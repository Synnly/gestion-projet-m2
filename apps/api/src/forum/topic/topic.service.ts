import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic, TopicDocument } from './topic.schema';
import { Forum, ForumDocument } from '../forum.schema';
import { MessageService } from '../message/message.service';
// import { Message } from '../message/message.schema';
import { CreateTopicDto } from './dto/createTopic.dto';
import { UpdateTopicDto } from './dto/updateTopic.dto';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PaginationDto } from '../../common/pagination/dto/pagination.dto';
import { PaginationResult } from '../../common/pagination/dto/paginationResult';

@Injectable()
export class TopicService {
    constructor(
        @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
        @InjectModel(Forum.name) private readonly forumModel: Model<ForumDocument>,
        @Inject() private readonly messageService: MessageService,
        private readonly paginationService: PaginationService,
        private readonly populateField: string = 'content author createdAt updatedAt',
    ) {}

    async findAll(forumId: string, pagination: PaginationDto): Promise<PaginationResult<Topic>> {
        const { page = 1, limit = 10, sort } = pagination;
        const populate = [{ path: 'messages', select: this.populateField }];
        const filter = { forumId };
        return this.paginationService.paginate(this.topicModel, filter, page, limit, populate, sort);
    }

    async findOne(forumId: string, id: string): Promise<Topic | null> {
        return this.topicModel.findOne({ _id: id, forumId }).populate({ path: 'messages', select: this.populateField }).exec();
    }

    async create(forumId: string, dto: CreateTopicDto): Promise<void> {
        const topic = await this.topicModel.create({ ...dto, forumId });
        
        await this.forumModel.findByIdAndUpdate(
            forumId,
            { 
                $inc: { nbTopics: 1 },
                $push: { topics: topic._id }
            },
            { new: true }
        );
    }

    async update(forumId: string, id: string, dto: UpdateTopicDto | CreateTopicDto): Promise<void> {
        const topic = await this.topicModel.findOne({ _id: id, forumId }).exec();

        if (topic) {
            // for (const messageId of dto.messages ?? []) {
            //     let message: Message | null | undefined = undefined;
            //     try {
            //         message = await this.messageService.findOne(messageId);
            //     } catch (error) {
            //         throw new BadRequestException('Invalid message ID: ' + messageId);
            //     }
            //     if (message === null) throw new NotFoundException('Message with id ' + messageId + ' not found');
            // }

            Object.assign(topic, dto);
            await topic.save({ validateBeforeSave: false });
            return;
        }

        await this.topicModel.create({ ...(dto as CreateTopicDto), forumId });
        return;
    }
}
