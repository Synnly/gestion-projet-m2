import { Module } from '@nestjs/common';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../user/user.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { GeoService } from '../common/geography/geo.service';
import { PaginationService } from '../common/pagination/pagination.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from 'src/application/application.schema';
import { Message, MessageSchema } from 'src/forum/message/message.schema';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Application.name, schema: ApplicationSchema },
            { name: Message.name, schema: MessageSchema }, // Optionnel : pour les messages
            // Si Student n'est pas fourni par UsersModule, décommente la ligne ci-dessous :
            // { name: Student.name, schema: StudentSchema }
        ]),
        UsersModule,
        MailerModule.register(),
        NotificationModule,
        AuthModule,
    ],
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
