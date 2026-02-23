import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../user/user.module';
<<<<<<< reports
import { Report, ReportSchema } from '../forum/report/report.schema';

@Module({
    imports: [UsersModule],
    controllers: [],
=======
import { DatabaseExport, DatabaseExportSchema } from './database-export.schema';
import { DatabaseImport, DatabaseImportSchema } from './database-import.schema';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        UsersModule,
        MailerModule.register(),
        MongooseModule.forFeature([
            { name: DatabaseExport.name, schema: DatabaseExportSchema },
            { name: DatabaseImport.name, schema: DatabaseImportSchema },
        ]),
    ],
    controllers: [AdminController],
>>>>>>> dev
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
