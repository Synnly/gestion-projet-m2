import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic, TopicDocument } from './topic.schema';
import { MessageService } from '../message/message.service';
import { Message } from '../message/message.schema';
import { CreateTopicDto } from './dto/createTopic.dto';
import { UpdateTopicDto } from './dto/updateTopic.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../../common/pagination/dto/paginationResult';

@Injectable()
export class TopicService {
    constructor(
        @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
        @Inject() private readonly messageService: MessageService,
        private readonly paginationService: PaginationService,
        private readonly populateField: string = 'content author createdAt updatedAt',
    ) {}

    async findAll(pagination: PaginationDto): Promise<PaginationResult<Topic>> {
        const { page = 1, limit = 10, sort } = pagination;
        const populate = [{ path: 'messages', select: this.populateField }];
        const filter = {};
        return this.paginationService.paginate(this.topicModel, filter, page, limit, populate, sort);
    }

    async findOne(id: string): Promise<Topic | null> {
        return this.topicModel.findOne({ _id: id }).populate({ path: 'messages', select: this.populateField }).exec();
    }

    async create(dto: CreateTopicDto): Promise<void> {
        await this.topicModel.create({ ...dto });
        return;
    }

    async update(id: string, dto: UpdateTopicDto | CreateTopicDto): Promise<void> {
        const topic = await this.topicModel.findOne({ _id: id }).exec();

        if (topic) {
            for (const messageId of dto.messages ?? []) {
                let message: Message | null | undefined = undefined;
                try {
                    message = await this.messageService.findOne(messageId);
                } catch (error) {
                    throw new BadRequestException('Invalid message ID: ' + messageId);
                }
                if (message === null) throw new NotFoundException('Message with id ' + messageId + ' not found');
            }

            Object.assign(topic, dto);
            await topic.save({ validateBeforeSave: false });
            return;
        }

        await this.topicModel.create({ ...(dto as CreateTopicDto) });
        return;
    }
}
