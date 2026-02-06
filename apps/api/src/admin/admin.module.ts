import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../user/user.module';
import { DatabaseExport, DatabaseExportSchema } from './database-export.schema';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        UsersModule,
        MailerModule.register(),
        MongooseModule.forFeature([
            { name: DatabaseExport.name, schema: DatabaseExportSchema },
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
