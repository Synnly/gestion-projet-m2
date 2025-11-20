import { Injectable, Logger } from '@nestjs/common';
import { Job, Agenda } from 'agenda';
import { CompanyService } from '../company/company.service';

@Injectable()
export class AgendaJobs {
  private readonly logger = new Logger(AgendaJobs.name);
  private companyService: CompanyService;

  setCompanyService(companyService: CompanyService) {
    this.companyService = companyService;
  }

  register(agenda: Agenda) {
    agenda.define('delete-company', async (job: Job) => {
      const { companyId } = job.attrs.data;
      this.logger.log(`Running auto-delete for company ${companyId}`);
      await this.companyService.hardDelete(companyId);
      this.logger.log(`Company ${companyId} permanently deleted.`);
    });
  }
}