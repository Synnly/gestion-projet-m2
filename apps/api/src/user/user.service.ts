import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { MailerService } from '../mailer/mailer.service';
import { RefreshToken, RefreshTokenDocument } from 'src/auth/refreshToken.schema';
import { Message, MessageDocument } from '../forum/message/message.schema';
import { Report, ReportDocument } from '../forum/report/report.schema';

@Injectable()
/**
 * Service that handles user data operations.
 *
 * Provides methods to find, create, update and soft-delete user records (including students, companies, and admins) in the database.
 */
export class UserService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshTokenDocument>,
        @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
        @InjectModel(Report.name) private readonly reportModel: Model<ReportDocument>,
        private readonly mailerService: MailerService,
    ) {}

    /**
     * Find a single user by id if not soft-deleted or banned.
     * @param id The user's id.
     * @returns The `User` document or null if not found.
     */
    async findOne(id: string): Promise<User | null> {
        return this.userModel.findOne({ _id: id, deletedAt: { $exists: false }, ban: { $exists: false } }).exec();
    }


    /**
     * Ban a user by setting a `ban` object.
     * @param userId The user's id.
     * @param reason The reason for banning the user.
     * @throws NotFoundException if the user does not exist or is already deleted.
     */
    async ban(userId: string, reason: string): Promise<void> {
        const bannedUser = await this.userModel
            .findOneAndUpdate(
                { _id: userId, ban: { $exists: false }, deletedAt: { $exists: false } },
                { $set: { ban: { date: new Date(), reason: reason } } })
            .exec();

        if (!bannedUser) throw new NotFoundException('User not found or already banned / deleted');

        // Deletes all refresh tokens linked to the user
        await this.refreshTokenModel.deleteMany({ userId: userId });

        // Get all messages from this user (using regex for MongoDB compatibility)
        const userMessages = await this.messageModel
            .find({ authorId: new RegExp(`^${userId}$`) })
            .select('_id')
            .exec();

        if (userMessages.length > 0) {
            const messageIds = userMessages.map(msg => msg._id);
            
            // Update all reports related to this user's messages to "resolved"
            await this.reportModel.updateMany(
                { 
                    messageId: { $in: messageIds },
                    status: { $ne: 'resolved' }
                },
                { $set: { status: 'resolved' } }
            ).exec();
        }

        // Send an email to the banned user
        try {
            await this.mailerService.sendAccountBanEmail(bannedUser.email, reason);
        } catch (error) {
            console.error(`Failed to send ban email to ${bannedUser.email}:`, error);
        }
    }
}