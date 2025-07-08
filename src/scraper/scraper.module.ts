import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ConfluenceModule } from '../confluence/confluence.module';
import { JiraModule } from '../jira/jira.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapedData } from './scraped-data.entity';
import { IntegrationFactory } from './integration.factory';

@Module({
  imports: [
    ConfluenceModule,
    JiraModule,
    TypeOrmModule.forFeature([ScrapedData]),
  ],
  providers: [ScraperService, IntegrationFactory],
  exports: [ScraperService],
})
export class ScraperModule {}
