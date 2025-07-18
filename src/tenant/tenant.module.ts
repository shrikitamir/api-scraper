import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { ScrapedData } from '../scraper/scraped-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, ScrapedData])],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
