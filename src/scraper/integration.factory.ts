import { Injectable } from '@nestjs/common';
import { ConfluenceService } from '../confluence/confluence.service';
import { JiraService } from '../jira/jira.service';
import { Scraper } from './scraper.interface';
import { IntegrationConfig } from '../tenant/tenant.entity';

@Injectable()
export class IntegrationFactory {
  constructor(
    private readonly confluenceService: ConfluenceService,
    private readonly jiraService: JiraService,
  ) {}

  getIntegrationService(integrationType: string): Scraper | null {
    switch (integrationType) {
      case 'confluence':
        return this.confluenceService;
      case 'jira':
        return this.jiraService;
      default:
        console.warn(`Unknown integration type: ${integrationType}`);
        return null;
    }
  }

  getEnabledIntegrations(
    integrations: IntegrationConfig[],
  ): { type: string; service: Scraper }[] {
    return integrations
      .filter((integration) => integration.enabled)
      .map((integration) => ({
        type: integration.type,
        service: this.getIntegrationService(integration.type),
      }))
      .filter((integration) => integration.service !== null);
  }
}
