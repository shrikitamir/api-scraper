import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity()
@Unique(['source', 'externalId', 'tenant'])
export class ScrapedData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string;

  @Column()
  externalId: string; // External system's unique identifier (e.g., Confluence page ID, Jira issue key)

  @Column('jsonb')
  data: any;

  @ManyToOne(() => Tenant, (tenant) => tenant.scrapedData)
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
