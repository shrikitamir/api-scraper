import { Tenant } from '../tenant/tenant.entity';
import { ScrapedData } from './scraped-data.entity';

export interface Scraper {
  scrape(tenant: Tenant): Promise<ScrapedData[]>;
}
