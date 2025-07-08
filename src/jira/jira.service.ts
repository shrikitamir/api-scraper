import { Injectable } from '@nestjs/common';
import { Scraper } from '../scraper/scraper.interface';
import { Tenant, IntegrationConfig } from '../tenant/tenant.entity';
import { ScrapedData } from '../scraper/scraped-data.entity';

@Injectable()
export class JiraService implements Scraper {
  async scrape(tenant: Tenant): Promise<ScrapedData[]> {
    const jiraConfig = tenant.integrations.find(
      (integration: IntegrationConfig) =>
        integration.type === 'jira' && integration.enabled,
    );

    if (!jiraConfig) {
      console.log(`Jira not configured or disabled for tenant: ${tenant.name}`);
      return [];
    }

    // Implementation for Jira scraping
    console.log(
      `Scraping Jira for tenant: ${tenant.name} from ${jiraConfig.config.baseUrl}`,
    );

    // TODO: Replace with actual API call to Jira
    // This would use jiraConfig.config.baseUrl and jiraConfig.config.apiToken
    const data = [
      {
        id: '10001',
        key: 'PROJ-123',
        summary: 'Example Issue',
        status: 'In Progress',
        updated: '2024-01-01T10:00:00Z',
      },
      {
        id: '10002',
        key: 'PROJ-124',
        summary: 'Another Issue',
        status: 'Done',
        updated: '2024-01-01T11:00:00Z',
      },
    ];

    return data.map((item) => {
      const scrapedData = new ScrapedData();
      scrapedData.source = 'jira';
      scrapedData.externalId = item.key; // Use Jira issue key as external ID
      scrapedData.data = item;
      scrapedData.tenant = tenant;
      return scrapedData;
    });
  }
}
