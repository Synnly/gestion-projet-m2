import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../user/user.module';
import { Report, ReportSchema } from '../forum/message/report/report.schema';

@Module({
    imports: [
        UsersModule,
        MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
