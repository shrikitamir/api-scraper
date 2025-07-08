import { Injectable } from '@nestjs/common';
import { Tenant } from '../tenant/tenant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapedData } from './scraped-data.entity';
import { IntegrationFactory } from './integration.factory';

@Injectable()
export class ScraperService {
  private readonly tenantBatchSize = 5; // Process 5 tenants in parallel at a time
  private readonly documentBatchSize = 50; // Process 50 documents in a batch

  constructor(
    private readonly integrationFactory: IntegrationFactory,
    @InjectRepository(ScrapedData)
    private readonly scrapedDataRepository: Repository<ScrapedData>,
  ) {}

  async scrapeAll(tenants: Tenant[]) {
    if (tenants.length === 0) {
      console.log('No tenants to process');
      return;
    }

    const startTime = Date.now();
    console.log(`Starting parallel scraping for ${tenants.length} tenants...`);

    // Process tenants in batches for better performance and resource management
    const totalBatches = Math.ceil(tenants.length / this.tenantBatchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * this.tenantBatchSize;
      const batchEnd = Math.min(
        batchStart + this.tenantBatchSize,
        tenants.length,
      );
      const tenantBatch = tenants.slice(batchStart, batchEnd);

      const batchStartTime = Date.now();
      console.log(
        `Processing tenant batch ${batchIndex + 1}/${totalBatches} (${tenantBatch.length} tenants: ${tenantBatch.map((t) => t.name).join(', ')})`,
      );

      // Process tenants in this batch in parallel
      const batchPromises = tenantBatch.map((tenant) =>
        this.scrapeTenant(tenant),
      );

      // Use allSettled to ensure one tenant's failure doesn't stop others
      const batchResults = await Promise.allSettled(batchPromises);

      // Log results for this batch
      const successCount = batchResults.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failureCount = batchResults.filter(
        (r) => r.status === 'rejected',
      ).length;
      const batchDuration = Date.now() - batchStartTime;

      batchResults.forEach((result, index) => {
        const tenant = tenantBatch[index];
        if (result.status === 'fulfilled') {
          console.log(
            `✅ Successfully completed scraping for tenant: ${tenant.name}`,
          );
        } else {
          console.error(
            `❌ Failed to scrape tenant: ${tenant.name}`,
            result.reason,
          );
        }
      });

      console.log(
        `Completed tenant batch ${batchIndex + 1}/${totalBatches} in ${batchDuration}ms (${successCount} success, ${failureCount} failed)`,
      );
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `Finished parallel scraping for all ${tenants.length} tenants in ${totalDuration}ms`,
    );
  }

  private async scrapeTenant(tenant: Tenant): Promise<void> {
    console.log(`Starting scraping for tenant: ${tenant.name}`);

    const enabledIntegrations = this.integrationFactory.getEnabledIntegrations(
      tenant.integrations || [],
    );

    if (enabledIntegrations.length === 0) {
      console.log(`No enabled integrations found for tenant: ${tenant.name}`);
      return;
    }

    // Process integrations for this tenant sequentially to avoid overwhelming individual tenant systems
    for (const { type, service } of enabledIntegrations) {
      try {
        console.log(`Running ${type} integration for tenant: ${tenant.name}`);
        const scrapedData = await service.scrape(tenant);

        if (scrapedData.length > 0) {
          const { inserted, updated } = await this.upsertData(
            scrapedData,
            tenant,
          );
          console.log(
            `Processed ${scrapedData.length} records from ${type} for tenant: ${tenant.name} (${inserted} new, ${updated} updated)`,
          );
        } else {
          console.log(`No data found from ${type} for tenant: ${tenant.name}`);
        }
      } catch (error) {
        console.error(
          `Error scraping ${type} for tenant ${tenant.name}:`,
          error,
        );
        // Continue with other integrations even if one fails
      }
    }
  }

  private async upsertData(
    scrapedDataArray: ScrapedData[],
    tenant: Tenant,
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    // Process records in batches for better performance
    for (let i = 0; i < scrapedDataArray.length; i += this.documentBatchSize) {
      const batch = scrapedDataArray.slice(i, i + this.documentBatchSize);

      for (const newData of batch) {
        try {
          // Use upsert with conflict resolution
          const result = await this.scrapedDataRepository
            .createQueryBuilder()
            .insert()
            .into(ScrapedData)
            .values({
              source: newData.source,
              externalId: newData.externalId,
              data: newData.data,
              tenant: tenant,
            })
            .orUpdate(
              ['data', 'updatedAt'],
              ['source', 'externalId', 'tenantId'],
            )
            .returning(['id', 'createdAt', 'updatedAt'])
            .execute();

          // Check if it was an insert or update based on createdAt vs updatedAt
          if (result.raw.length > 0) {
            const record = result.raw[0];
            const isNewRecord =
              new Date(record.createdAt).getTime() ===
              new Date(record.updatedAt).getTime();

            if (isNewRecord) {
              inserted++;
              console.log(
                `Inserted new record: ${newData.source}:${newData.externalId}`,
              );
            } else {
              updated++;
              console.log(
                `Updated existing record: ${newData.source}:${newData.externalId}`,
              );
            }
          }
        } catch (error) {
          console.error(
            `Error upserting record ${newData.source}:${newData.externalId}:`,
            error,
          );

          // Fallback to manual upsert if the above fails
          try {
            await this.manualUpsert(newData, tenant);
            console.log(
              `Fallback upsert successful for: ${newData.source}:${newData.externalId}`,
            );
          } catch (fallbackError) {
            console.error(
              `Fallback upsert also failed for ${newData.source}:${newData.externalId}:`,
              fallbackError,
            );
          }
        }
      }
    }

    return { inserted, updated };
  }

  private async manualUpsert(
    newData: ScrapedData,
    tenant: Tenant,
  ): Promise<void> {
    const existingRecord = await this.scrapedDataRepository.findOne({
      where: {
        source: newData.source,
        externalId: newData.externalId,
        tenant: { id: tenant.id },
      },
    });

    if (existingRecord) {
      // Update existing record - TypeORM will automatically update the updatedAt field
      existingRecord.data = newData.data;
      await this.scrapedDataRepository.save(existingRecord);
    } else {
      // Insert new record
      await this.scrapedDataRepository.save(newData);
    }
  }
}
