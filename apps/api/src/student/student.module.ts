import { Module } from '@nestjs/common';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../user/user.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { GeoService } from '../common/geography/geo.service';
import { PaginationService } from '../common/pagination/pagination.service';

@Module({
    imports: [UsersModule, MailerModule.register()],
    controllers: [StudentController],
    providers: [StudentService, GeoService, PaginationService],
    exports: [StudentService],
})
/**
 * Module that groups student-related controllers and services.
 *
 * Registers `StudentController` and `StudentService` and imports `UsersModule`.
 */
export class StudentModule {}
