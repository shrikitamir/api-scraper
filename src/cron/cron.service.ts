import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScraperService } from '../scraper/scraper.service';
import { TenantService } from '../tenant/tenant.service';

@Injectable()
export class CronService {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly tenantService: TenantService,
  ) {}

  @Cron('* * * * *') // Every minute
  async handleCron() {
    console.log('Starting scheduled scraping job...');
    const tenants = await this.tenantService.findAll();
    await this.scraperService.scrapeAll(tenants);
    console.log('Scheduled scraping job completed.');
  }
}
