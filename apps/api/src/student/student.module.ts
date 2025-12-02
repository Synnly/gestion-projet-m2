import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { UsersModule } from '../user/user.module';

@Module({
    imports: [UsersModule],
    controllers: [StudentController],
    providers: [StudentService],
    exports: [StudentService],
})
/**
 * Module that groups student-related controllers and services.
 *
 * Registers `StudentController` and `StudentService` and imports `UsersModule`.
 */
export class StudentModule {}
