import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notification.schema';
import { CreateNotificationDto } from './dto/createNotification.dto';
import { UpdateNotificationDto } from './dto/updateNotification.dto';

@Injectable()
/**
 * Service that handles notification data operations.
 *
 * Provides methods to find, create, update and delete notification records in the database.
 */
export class NotificationService {
    constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) {}

    /**
     * Find all notifications.
     * @returns A promise resolving to an array of `Notification` documents.
     */
    async findAll(): Promise<Notification[]> {
        return this.notificationModel.find().sort({ createdAt: -1 }).exec();
    }

    /**
     * Find all notifications for a specific user.
     * @param userId The user's id.
     * @returns A promise resolving to an array of `Notification` documents.
     */
    async findByUserId(userId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Find all unread notifications for a specific user.
     * @param userId The user's id.
     * @returns A promise resolving to an array of unread `Notification` documents.
     */
    async findUnreadByUserId(userId: string): Promise<Notification[]> {
        return this.notificationModel
            .find({
                userId: new Types.ObjectId(userId),
                read: false,
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Find a single notification by id.
     * @param id The notification's id.
     * @returns The `Notification` document or null if not found.
     */
    async findOne(id: string): Promise<Notification | null> {
        return this.notificationModel.findById(id).exec();
    }

    /**
     * Create a new notification record.
     * @param dto The creation payload.
     * @returns The created `Notification` document.
     */
    async create(dto: CreateNotificationDto): Promise<Notification> {
        const newNotification = await this.notificationModel.create(dto);
        return newNotification;
    }

    /**
     * Update an existing notification.
     * @param id The notification's id.
     * @param dto The update payload.
     * @returns The updated `Notification` document.
     * @throws {NotFoundException} When the notification doesn't exist.
     */
    async update(id: string, dto: UpdateNotificationDto): Promise<Notification> {
        const notification = await this.notificationModel.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();

        if (!notification) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }

        return notification;
    }

    /**
     * Mark a notification as read.
     * @param id The notification's id.
     * @returns The updated `Notification` document.
     * @throws {NotFoundException} When the notification doesn't exist.
     */
    async markAsRead(id: string): Promise<Notification> {
        return this.update(id, { read: true });
    }

    /**
     * Mark all notifications for a user as read.
     * @param userId The user's id.
     * @returns The number of modified notifications.
     */
    async markAllAsReadForUser(userId: string): Promise<number> {
        const result = await this.notificationModel
            .updateMany({ userId: new Types.ObjectId(userId), read: false }, { $set: { read: true } })
            .exec();

        return result.modifiedCount;
    }

    /**
     * Delete a notification by id.
     * @param id The notification's id.
     * @throws {NotFoundException} When the notification doesn't exist.
     */
    async delete(id: string): Promise<void> {
        const result = await this.notificationModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Notification with id ${id} not found`);
        }
    }

    /**
     * Delete all notifications for a specific user.
     * @param userId The user's id.
     * @returns The number of deleted notifications.
     */
    async deleteAllForUser(userId: string): Promise<number> {
        const result = await this.notificationModel
            .deleteMany({
                userId: new Types.ObjectId(userId),
            })
            .exec();
        return result.deletedCount;
    }

    /**
     * Count unread notifications for a specific user.
     * @param userId The user's id.
     * @returns The count of unread notifications.
     */
    async countUnreadForUser(userId: string): Promise<number> {
        return this.notificationModel
            .countDocuments({
                userId: new Types.ObjectId(userId),
                read: false,
            })
            .exec();
    }
}
