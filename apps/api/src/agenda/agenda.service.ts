import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Agenda } from 'agenda';
import { AgendaJobs } from './agenda.jobs';
import { ModuleRef } from '@nestjs/core';
import { CompanyService } from '../company/company.service';

@Injectable()
export class AgendaService implements OnModuleInit {
  constructor(
    @Inject('AGENDA_INSTANCE') private readonly agenda: Agenda,
    private readonly agendaJobs: AgendaJobs,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    const companyService = this.moduleRef.get(CompanyService, { strict: false });
    this.agendaJobs.setCompanyService(companyService);
    this.agendaJobs.register(this.agenda);
  }

  async scheduleCompanyDeletion(companyId: string): Promise<void> {
    await this.agenda.schedule('in 30 seconds', 'delete-company', { companyId });
    // await this.agenda.schedule('in 30 seconds', ['delete-company'], { companyId });
  }
}