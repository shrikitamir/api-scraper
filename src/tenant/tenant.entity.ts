import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ScrapedData } from '../scraper/scraped-data.entity';

enum IntegrationType {
  CONFLUENCE = 'confluence',
  JIRA = 'jira',
}

export enum AuthorizationMethod {
  BASIC = 'basic',
  BEARER = 'bearer',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
}

export interface IntegrationConfig {
  type: IntegrationType;
  enabled: boolean;
  authMethod: AuthorizationMethod;
  config: {
    baseUrl: string;
    username: string;
    apiToken: string;
    // Additional fields can be added per integration type
    [key: string]: any;
  };
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('jsonb', { nullable: true, default: [] })
  integrations: IntegrationConfig[];

  @OneToMany(() => ScrapedData, (scrapedData) => scrapedData.tenant)
  scrapedData: ScrapedData[];
}
