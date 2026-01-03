import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { User, UserSchema } from './user.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { Student, StudentSchema } from '../student/student.schema';
import { Role } from '../common/roles/roles.enum';
import { Admin, AdminSchema } from '../admin/admin.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MailerModule } from '../mailer/mailer.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MailerModule.register(),
    ],
    controllers: [UserController],
    providers: [
        {
            provide: getModelToken(Company.name),
            useFactory: (connection: Connection) => {
                // Get the User model
                const userModel = connection.model(User.name);

                // Create Company discriminator if not already exists
                if (!userModel.discriminators?.[Company.name]) {
                    // Use Role.COMPANY as the discriminator value so stored documents have role = 'COMPANY'
                    return userModel.discriminator(Company.name, CompanySchema, Role.COMPANY);
                }

                return connection.model(Company.name);
            },
            inject: [getConnectionToken()],
        },
        {
            provide: getModelToken(Student.name),
            useFactory: (connection: Connection) => {
                const userModel = connection.model(User.name);

                if (!userModel.discriminators?.[Student.name]) {
                    return userModel.discriminator(Student.name, StudentSchema, Role.STUDENT);
                }

                return connection.model(Student.name);
            },
            inject: [getConnectionToken()],
        },
        UserService,
        {
            provide: getModelToken(Admin.name),
            useFactory: (connection: Connection) => {
                const userModel = connection.model(User.name);

                if (!userModel.discriminators?.[Admin.name]) {
                    return userModel.discriminator(Admin.name, AdminSchema, Role.ADMIN);
                }

                return connection.model(Admin.name);
            },
            inject: [getConnectionToken()],
        },
    ],
    exports: [MongooseModule, getModelToken(Company.name), getModelToken(Student.name), UserService, getModelToken(Admin.name)],
})
export class UsersModule {}
