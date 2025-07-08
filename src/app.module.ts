import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './tenant/tenant.module';
import { ScraperModule } from './scraper/scraper.module';
import { ConfluenceModule } from './confluence/confluence.module';
import { JiraModule } from './jira/jira.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    DatabaseModule,
    TenantModule,
    CronModule,
    ScraperModule,
    ConfluenceModule,
    JiraModule,
  ],
})
export class AppModule {}
