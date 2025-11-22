// This file is made to check everyday for companies set as "deleted". If they were set as "deleted" for 30 days, they get removed from the database.
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyService } from './company.service';

@Injectable()
export class CompanyCleanup {
  private readonly logger = new Logger(CompanyCleanup.name);

  constructor(private readonly companyService: CompanyService) {}

  // @Cron('*/30 * * * * *')   // Every 30 seconds (for testing)
  @Cron(process.env.CLEANUP_CRON || '0 3 * * *')   // Everyday at 3AM
  async deleteExpired() {
    this.logger.log('Auto-cleanup of soft-deleted companies...');
    await this.companyService.deleteExpiredCompanies();
    this.logger.log('Companies cleanup completed.');
  }
}
