import { Injectable } from '@nestjs/common';
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

/**
 * Service for managing forum topics.
 */
@Injectable()
export class TopicService {
    /**
     * Fields to populate when retrieving topics.
     */
    private readonly populateField: string = 'content author createdAt updatedAt';

    private readonly populate = [
        { path: 'messages', select: this.populateField },
        { path: 'author', select: '_id firstName lastName name email logo ban' },
    ];

    /**
     * constructor
     * @param topicModel the topic model
     * @param forumModel the forum model
     * @param paginationService the pagination service
     */
    constructor(
        @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
        @InjectModel(Forum.name) private readonly forumModel: Model<ForumDocument>,
        private readonly paginationService: PaginationService,
    ) {}

    /**
     * Retrieves a paginated list of topics for a specific forum.
     * @param forumId the ID of the forum
     * @param pagination pagination parameters
     * @returns paginated list of topics
     */
    async findAll(forumId: string, pagination: PaginationDto): Promise<PaginationResult<Topic>> {
        const { page = 1, limit = 10, sort, searchQuery } = pagination;
        const filter: Record<string, unknown> = { forumId };

        if (searchQuery) {
            filter.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
            ];
        }

        return this.paginationService.paginate(this.topicModel, filter, page, limit, this.populate, sort);
    }

    /**
     * Retrieves a specific topic by its ID within a forum.
     * @param forumId the ID of the forum
     * @param id the ID of the topic
     * @returns the topic or null if not found
     */
    async findOne(forumId: string, id: string): Promise<Topic | null> {
        return this.topicModel.findOne({ _id: id, forumId }).populate(this.populate).exec();
    }

    /**
     * Creates a new topic within a forum.
     * @param forumId the ID of the forum
     * @param dto the data transfer object containing topic details
     */
    async create(forumId: string, dto: CreateTopicDto): Promise<void> {
        const topic = await this.topicModel.create({ ...dto, forumId });

        await this.forumModel.findByIdAndUpdate(
            forumId,
            {
                $inc: { nbTopics: 1 },
                $push: { topics: topic._id },
            },
            { new: true },
        );
    }

    /**
     * Updates an existing topic or creates a new one within a forum.
     * @param forumId the ID of the forum
     * @param id the ID of the topic
     * @param dto the data transfer object containing topic details
     * @returns
     */
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

        const newTopic = await this.topicModel.create({ ...(dto as CreateTopicDto), forumId });
        await this.forumModel.findByIdAndUpdate(
            forumId,
            { $inc: { nbTopics: 1 }, $push: { topics: newTopic._id } },
            { new: true },
        );
        return;
    }
}
