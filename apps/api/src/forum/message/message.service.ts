import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
        @InjectModel(Forum.name) private readonly forumModel: Model<Forum>,
        private readonly paginationService: PaginationService,
    ) { }

    /**
     * Send a message in a topic.
     * @param topicId - The ID of the topic where the message will be sent.
     * @param createMessageDto - The data transfer object containing message details.
     * @returns The created message.
     */
    async sendMessage(topicId: string, createMessageDto: CreateMessageDto): Promise<Message> {
        const message = new this.messageModel({
            topicId,
            ...createMessageDto,
        });

        const newMessages = await message.save();
        const topic = await this.topicModel.findByIdAndUpdate(topicId, {
            $push: { messages: newMessages._id },
        });
        if (!topic) throw new NotFoundException("topic doesn't exist ");
        await this.forumModel.findByIdAndUpdate(
            topic?.forumId,
            {
                $inc: { nbMessages: 1 },
            },
            { new: true },
        );
        return newMessages;
    }

    /**
     * Find all messages for a given topic with pagination.
     * @param topicId - The ID of the topic to find messages for.
     * @param query - Pagination parameters (page, limit).
     * @returns A paginated result containing messages.
     */
    async findAll(topicId: string, query: MessagePaginationDto): Promise<PaginationResult<Message>> {
        const { page, limit, ...rest } = query;
        const queryBuilder = new QueryBuilder<Message>({ ...rest, topicId });
        const filter = queryBuilder.buildMessageFilter();
        const populate = [
            { path: 'authorId', select: 'firstName lastName name logo role ' },
            {
                path: 'parentMessageId',
                populate: {
                    path: 'authorId',
                    select: 'firstName lastName name',
                },
            },
        ];
        const paginate = await this.paginationService.paginate(this.messageModel, filter, page, limit, populate);
        return paginate;
    }
}
