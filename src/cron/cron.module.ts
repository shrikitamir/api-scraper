import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScraperModule } from '../scraper/scraper.module';
import { TenantModule } from '../tenant/tenant.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot(), ScraperModule, TenantModule],
  providers: [CronService],
})
export class CronModule {}
