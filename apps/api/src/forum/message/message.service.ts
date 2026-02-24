import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Message } from './message.schema';
import { Forum } from '../forum.schema';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationService } from '../../common/pagination/pagination.service';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dto/createMessageDto';
import { PaginationResult } from 'client/src/types/internship.types';
import { QueryBuilder } from '../../common/pagination/query.builder';
import { MessagePaginationDto } from '../../common/pagination/dto/messagePagination.dto';
import { Topic } from '../topic/topic.schema';
import { NotificationService } from 'src/notification/notification.service';
import { CreateNotificationDto } from 'src/notification/dto/createNotification.dto';
@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
        @InjectModel(Forum.name) private readonly forumModel: Model<Forum>,
        private readonly paginationService: PaginationService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Send a message in a topic.
     * @param topicId - The ID of the topic where the message will be sent.
     * @param createMessageDto - The data transfer object containing message details.
     * @returns The created message.
     */
    async sendMessage(topicId: string, createMessageDto: CreateMessageDto): Promise<Message> {
        const message = await this.messageModel.create({
            topicId,
            ...createMessageDto,
        });

        const topic = await this.topicModel.findByIdAndUpdate(topicId, {
            $push: { messages: message._id },
        });
        if (!topic) throw new NotFoundException("topic doesn't exist ");
        const forum = await this.forumModel.findByIdAndUpdate(
            topic?.forumId,
            {
                $inc: { nbMessages: 1 },
            },
            { new: true },
        );
        if (message.parentMessageId) {
            const replyMessage = await this.messageModel.findById(message.parentMessageId).populate('authorId').exec();
            if (replyMessage && replyMessage.authorId._id.toString() !== createMessageDto.authorId.toString()) {
                const dto = new CreateNotificationDto();
                dto.userId = replyMessage.authorId._id;
                dto.message = `Votre message a une nouvelle réponse dans le topic "${topic.title}"`;
                const companyPart = forum?.company?._id.toString() ?? 'general';
                dto.returnLink = `/forums/${companyPart}/topics/${forum?._id.toString()}/${topic._id.toString()}`;
                await this.notificationService.create(dto);
            }
        }
        return message;
    }

    /**
     * Find all messages for a given topic with pagination.
     * @param topicId - The ID of the topic to find messages for.
     * @param query - Pagination parameters (page, limit).
     * @returns A paginated result containing messages.
     */
    async findAll(query: MessagePaginationDto, topicId?: string): Promise<PaginationResult<Message>> {
        const { page = 1, limit = 10, ...rest } = query;
        const queryBuilder = new QueryBuilder<Message>({ ...rest, topicId });
        const filter = queryBuilder.buildMessageFilter();
        const populate = [
            { path: 'authorId', select: 'firstName lastName name logo role ban' },
            {
                path: 'parentMessageId',
                populate: {
                    path: 'authorId',
                    select: 'firstName lastName name ban',
                },
            },
        ];
        const paginate = await this.paginationService.paginate(this.messageModel, filter, page, limit, populate);
        return paginate;
    }

    /**
     * Soft delete a message by setting the deletedAt field.
     * @param messageId - The ID of the message to delete.
     * @returns The updated message.
     */
    async deleteMessage(messageId: string): Promise<Message> {
        const message = await this.messageModel.findByIdAndUpdate(
            messageId,
            { deletedAt: new Date() },
            { new: true }
        );
        
        if (!message) {
            throw new NotFoundException('Message not found');
        }
        
        return message;
    }

    /**
     * CronJob that runs daily at 3:00 AM to permanently delete messages 
     * that have been soft-deleted for more than 30 days.
     */
    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupOldDeletedMessages(): Promise<void> {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const result = await this.messageModel.deleteMany({
                deletedAt: { $ne: null, $lte: thirtyDaysAgo }
            });

            this.logger.log(`Cleanup completed: ${result.deletedCount} messages permanently deleted`);
        } catch (error) {
            this.logger.error('Error during message cleanup', error);
        }
    }
}
