import { Injectable } from '@nestjs/common';
import { Message } from './message.schema';
import { Forum } from '../forum.schema';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dto/createMessageDto';
import { PaginationResult } from 'client/src/types/internship.types';
import { QueryBuilder } from 'src/common/pagination/query.builder';
import { MessagePaginationDto } from 'src/common/pagination/dto/messagePagination.dto';
@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Forum.name) private readonly messageModel: Model<Message>,
        private readonly paginationService: PaginationService,
    ) {}

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
        await message.save();
        return message;
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
        const populate = [{ path: 'author', select: 'firstName lastName name logo' }, { path: 'parentMessage' }];
        return this.paginationService.paginate(this.messageModel, filter, page, limit, populate);
    }
}
