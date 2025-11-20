import { Module, forwardRef } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaJobs } from './agenda.jobs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CompanyModule } from '../company/company.module';
import { Agenda } from 'agenda';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => CompanyModule),
],
  providers: [
    AgendaService,
    AgendaJobs,
    {
      provide: 'AGENDA_INSTANCE',
      useFactory: async (configService: ConfigService) => {
        const mongoUrl = configService.get<string>('DATABASE_URL');
        if (!mongoUrl) throw new Error('DATABASE_URL manquant dans .env');

        const agenda = new Agenda({
          db: { address: mongoUrl, collection: 'agendaJobs' },
        });

        await agenda.start();
        return agenda;
      },
      inject: [ConfigService],
    },
  ],
  exports: [AgendaService],
})
export class AgendaModule {}
