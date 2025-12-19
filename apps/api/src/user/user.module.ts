import { Module } from '@nestjs/common';
import { MongooseModule, getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { User, UserSchema } from './user.schema';
import { Company, CompanySchema } from '../company/company.schema';
import { Student, StudentSchema } from '../student/student.schema';
import { Role } from '../common/roles/roles.enum';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
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
    ],
    exports: [MongooseModule, getModelToken(Company.name), getModelToken(Student.name)],
})
export class UsersModule {}
