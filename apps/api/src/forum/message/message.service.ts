import { Injectable } from '@nestjs/common';
import { Message } from './message.schema';
import { Forum } from '../forum.schema';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { Model } from 'mongoose';
import { CreateMessageDto } from './dto/createMessageDto';
import { PaginationResult } from 'client/src/types/internship.types';
@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Forum.name) private readonly messageModel: Model<Message>,
        private readonly paginationService: PaginationService,
    ) {}

    async sendMessage(topicId: string, createMessageDto: CreateMessageDto): Promise<Message> {
        const message = new this.messageModel({
            topicId,
            ...createMessageDto,
        });
        await message.save();
        return message;
    }

    async findMessagesByTopicId(
        topicId: string,
        query: { page: number; limit: number },
    ): Promise<PaginationResult<Message>> {
        const { page, limit } = query;
        const filter = { topicId };
        const populate = [{ path: 'author' }, { path: 'parentMessage' }];
        return this.paginationService.paginate(this.messageModel, filter, page, limit, populate);
    }

    async findAll(topicId: string, query: PaginationDto): Promise<PaginationResult<Message>> {
        const { page, limit } = query;
        const filter = { topicId };
        const populate = [{ path: 'author' }, { path: 'parentMessage' }];
        return this.paginationService.paginate(this.messageModel, filter, page, limit, populate);
    }
}
