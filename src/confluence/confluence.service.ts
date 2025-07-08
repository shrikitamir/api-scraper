import { Injectable } from '@nestjs/common';
import { Scraper } from '../scraper/scraper.interface';
import {
  Tenant,
  IntegrationConfig,
  AuthorizationMethod,
} from '../tenant/tenant.entity';
import { ScrapedData } from '../scraper/scraped-data.entity';
import axios, { AxiosRequestConfig } from 'axios';

@Injectable()
export class ConfluenceService implements Scraper {
  async scrape(tenant: Tenant): Promise<ScrapedData[]> {
    const confluenceConfig = tenant.integrations.find(
      (integration: IntegrationConfig) =>
        integration.type === 'confluence' && integration.enabled,
    );

    if (!confluenceConfig) {
      console.log(
        `Confluence not configured or disabled for tenant: ${tenant.name}`,
      );
      return [];
    }

    console.log(
      `Scraping Confluence for tenant: ${tenant.name} from ${confluenceConfig.config.baseUrl}`,
    );

    try {
      // Get spaces first
      const spaces = await this.getSpaces(confluenceConfig);
      const scrapedData: ScrapedData[] = [];

      // For each space, get pages
      for (const space of spaces) {
        const pages = await this.getSpacePages(confluenceConfig, space.id);

        for (const page of pages) {
          const scraped = new ScrapedData();
          scraped.source = 'confluence';
          scraped.externalId = page.id;
          scraped.data = {
            id: page.id,
            title: page.title,
            spaceKey: space.key,
            spaceName: space.name,
            version: page.version.number,
            createdAt: page.createdAt,
            updatedAt: page.version.createdAt,
            webUrl: `${confluenceConfig.config.baseUrl}/spaces/${space.key}/pages/${page.id}`,
          };
          scraped.tenant = tenant;
          scrapedData.push(scraped);
        }
      }

      return scrapedData;
    } catch (error) {
      console.error(
        `Error scraping Confluence for tenant ${tenant.name}:`,
        error.message,
      );
      return [];
    }
  }

  private async getSpaces(config: IntegrationConfig): Promise<any[]> {
    const url = `${config.config.baseUrl}/api/v2/spaces`;
    const response = await this.makeRequest(config, url);
    return response.data.results || [];
  }

  private async getSpacePages(
    config: IntegrationConfig,
    spaceKey: string,
  ): Promise<any[]> {
    const url = `${config.config.baseUrl}/api/v2/spaces/${spaceKey}/pages`;
    const response = await this.makeRequest(config, url);
    return response.data.results || [];
  }

  private async makeRequest(
    config: IntegrationConfig,
    url: string,
  ): Promise<any> {
    const requestConfig: AxiosRequestConfig = {
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
      },
    };

    // Handle different authorization methods
    if (config.authMethod === AuthorizationMethod.BASIC) {
      requestConfig.auth = {
        username: config.config.username,
        password: config.config.apiToken,
      };
    } else if (config.authMethod === AuthorizationMethod.BEARER) {
      requestConfig.headers['Authorization'] =
        `Bearer ${config.config.apiToken}`;
    } else if (config.authMethod === AuthorizationMethod.API_KEY) {
      requestConfig.headers['Authorization'] = `${config.config.apiToken}`;
    }

    return await axios(requestConfig);
  }
}
