import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { TopicService } from '../../../src/forum/topic/topic.service';
import { Topic } from '../../../src/forum/topic/topic.schema';
import { Forum } from '../../../src/forum/forum.schema';
import { MessageService } from '../../../src/forum/message/message.service';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { CreateTopicDto } from '../../../src/forum/topic/dto/createTopic.dto';
import { UpdateTopicDto } from '../../../src/forum/topic/dto/updateTopic.dto';

describe('TopicService', () => {
    let service: TopicService;
    let topicModel: any;
    let forumModel: any;
    let paginationService: PaginationService;

    const mockTopicId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const mockForumId = new Types.ObjectId('507f1f77bcf86cd799439012');
    const mockAuthorId = new Types.ObjectId('507f1f77bcf86cd799439013');

    const mockTopic = {
        _id: mockTopicId,
        title: 'Test Topic',
        description: 'Test Description',
        messages: [],
        author: mockAuthorId,
        forumId: mockForumId,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(this),
    };

    const mockTopicModel = {
        create: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };

    const mockForumModel = {
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockMessageService = {};

    // Helper to create a chainable query mock
    const mockQuery = (result: any) => ({
        exec: jest.fn().mockResolvedValue(result),
        populate: jest.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve(result).then(resolve),
    });

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TopicService,
                {
                    provide: getModelToken(Topic.name),
                    useValue: mockTopicModel,
                },
                {
                    provide: getModelToken(Forum.name),
                    useValue: mockForumModel,
                },
                {
                    provide: MessageService,
                    useValue: mockMessageService,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
            ],
        }).compile();

        service = module.get<TopicService>(TopicService);
        topicModel = module.get(getModelToken(Topic.name));
        forumModel = module.get(getModelToken(Forum.name));
        paginationService = module.get<PaginationService>(PaginationService);
    });

    describe('constructor', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('findAll', () => {
        it('should return paginated topics for a forum', async () => {
            const paginationDto = { page: 1, limit: 10 };
            const expectedResult = {
                data: [mockTopic],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(expectedResult);

            const result = await service.findAll(mockForumId.toString(), paginationDto);

            expect(result).toEqual(expectedResult);
            expect(paginationService.paginate).toHaveBeenCalledWith(
                topicModel,
                { forumId: mockForumId.toString() },
                1,
                10,
                [
                    { path: 'messages', select: 'content author createdAt updatedAt' },
                    { path: 'author', select: '_id firstName lastName name email logo' },
                ],
                undefined,
            );
        });

        it('should handle custom sort parameter', async () => {
            const paginationDto = { page: 1, limit: 10, sort: '-createdAt' };
            const expectedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(expectedResult);

            await service.findAll(mockForumId.toString(), paginationDto);

            expect(paginationService.paginate).toHaveBeenCalledWith(
                topicModel,
                { forumId: mockForumId.toString() },
                1,
                10,
                [
                    { path: 'messages', select: 'content author createdAt updatedAt' },
                    { path: 'author', select: '_id firstName lastName name email logo' },
                ],
                '-createdAt',
            );
        });
    });

    describe('findOne', () => {
        it('should return a topic by id and forumId', async () => {
            const query = mockQuery(mockTopic);
            mockTopicModel.findOne.mockReturnValue(query);

            const result = await service.findOne(mockForumId.toString(), mockTopicId.toString());

            expect(result).toEqual(mockTopic);
            expect(topicModel.findOne).toHaveBeenCalledWith({
                _id: mockTopicId.toString(),
                forumId: mockForumId.toString(),
            });
            expect(query.populate).toHaveBeenCalledWith([
                { path: 'messages', select: 'content author createdAt updatedAt' },
                { path: 'author', select: '_id firstName lastName name email logo' },
            ]);
        });

        it('should return null if topic is not found', async () => {
            const query = mockQuery(null);
            mockTopicModel.findOne.mockReturnValue(query);

            const result = await service.findOne(mockForumId.toString(), mockTopicId.toString());

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new topic and update forum statistics', async () => {
            const createDto: CreateTopicDto = {
                title: 'New Topic',
                description: 'New Description',
                messages: [],
                author: mockAuthorId,
            };

            const createdTopic = { ...mockTopic, ...createDto, _id: mockTopicId };
            mockTopicModel.create.mockResolvedValue(createdTopic);
            mockForumModel.findByIdAndUpdate.mockResolvedValue({
                _id: mockForumId,
                nbTopics: 1,
                topics: [mockTopicId],
            });

            await service.create(mockForumId.toString(), createDto);

            expect(topicModel.create).toHaveBeenCalledWith({
                ...createDto,
                forumId: mockForumId.toString(),
            });
            expect(forumModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockForumId.toString(),
                {
                    $inc: { nbTopics: 1 },
                    $push: { topics: mockTopicId },
                },
                { new: true },
            );
        });

        it('should create topic without description', async () => {
            const createDto: CreateTopicDto = {
                title: 'Topic without description',
                messages: [],
                author: mockAuthorId,
            };

            const createdTopic = { ...mockTopic, ...createDto, _id: mockTopicId };
            mockTopicModel.create.mockResolvedValue(createdTopic);
            mockForumModel.findByIdAndUpdate.mockResolvedValue({});

            await service.create(mockForumId.toString(), createDto);

            expect(topicModel.create).toHaveBeenCalledWith({
                ...createDto,
                forumId: mockForumId.toString(),
            });
        });
    });

    describe('update', () => {
        it('should update an existing topic', async () => {
            const updateDto: UpdateTopicDto = {
                messages: [new Types.ObjectId()],
            };

            const existingTopic = {
                ...mockTopic,
                save: jest.fn().mockResolvedValue({ ...mockTopic, ...updateDto }),
            };

            const query = mockQuery(existingTopic);
            mockTopicModel.findOne.mockReturnValue(query);

            await service.update(mockForumId.toString(), mockTopicId.toString(), updateDto);

            expect(topicModel.findOne).toHaveBeenCalledWith({
                _id: mockTopicId.toString(),
                forumId: mockForumId.toString(),
            });
            expect(existingTopic.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should create a new topic if it does not exist (upsert behavior)', async () => {
            const createDto: CreateTopicDto = {
                title: 'New Topic',
                description: 'New Description',
                messages: [],
                author: mockAuthorId,
            };

            const query = mockQuery(null);
            mockTopicModel.findOne.mockReturnValue(query);
            mockTopicModel.create.mockResolvedValue({ ...mockTopic, ...createDto });

            await service.update(mockForumId.toString(), mockTopicId.toString(), createDto);

            expect(topicModel.findOne).toHaveBeenCalledWith({
                _id: mockTopicId.toString(),
                forumId: mockForumId.toString(),
            });
            expect(topicModel.create).toHaveBeenCalledWith({
                ...createDto,
                forumId: mockForumId.toString(),
            });
        });

        it('should update only provided fields', async () => {
            const updateDto: UpdateTopicDto = {
                messages: [new Types.ObjectId()],
            };

            const existingTopic = {
                ...mockTopic,
                save: jest.fn().mockResolvedValue({ ...mockTopic, ...updateDto }),
            };

            const query = mockQuery(existingTopic);
            mockTopicModel.findOne.mockReturnValue(query);

            await service.update(mockForumId.toString(), mockTopicId.toString(), updateDto);

            expect(existingTopic.save).toHaveBeenCalled();
        });
    });
});
