import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './notification.schema';
import { SchemaFactory } from '@nestjs/mongoose';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Notification.name, schema: SchemaFactory.createForClass(Notification) }]),
    ],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
