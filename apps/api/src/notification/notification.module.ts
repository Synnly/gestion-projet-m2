import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { Notification } from './notification.schema';
import { SchemaFactory } from '@nestjs/mongoose';
import { NotificationOwnerGuard } from './guard/notificationOwner.guard';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Notification.name, schema: SchemaFactory.createForClass(Notification) }]),
    ],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationOwnerGuard],
    exports: [NotificationService, MongooseModule],
})
export class NotificationModule {}
