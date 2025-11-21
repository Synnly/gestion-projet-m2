import { Global, Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MailerConfigService } from './mailer.config';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';
import { User, UserSchema } from '../user/user.schema';

@Global()
@Module({
    imports: [
        NestMailerModule.forRootAsync({
            imports: [ConfigModule],
            useClass: MailerConfigService,
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],
    controllers: [MailerController],
    providers: [MailerService, MailerConfigService],
    exports: [MailerService],
})
export class MailerModule {}

export { MailerService };
