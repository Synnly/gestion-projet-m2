import { Test, TestingModule } from '@nestjs/testing';
import { ForumController } from '../../../src/forum/forum.controller';
import { ForumService } from '../../../src/forum/forum.service';
import { TopicService } from '../../../src/forum/topic/topic.service';
import { PaginationDto } from '../../../src/common/pagination/dto/pagination.dto';
import { ForumDto } from '../../../src/forum/dto/forum.dto';
import { Types } from 'mongoose';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { getModelToken } from '@nestjs/mongoose';
import { Forum } from '../../../src/forum/forum.schema';

describe('ForumController', () => {
    let controller: ForumController;
    let service: ForumService;
    let topicService: TopicService;

    const mockForumService = {
        findAll: jest.fn(),
        findOneByCompanyId: jest.fn(),
    };

    const mockTopicService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const mockForumModel = {
        findById: jest.fn(),
    };

    const mockForum = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        company: new Types.ObjectId('507f1f77bcf86cd799439022'),
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function () {
            return this;
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ForumController],
            providers: [
                {
                    provide: ForumService,
                    useValue: mockForumService,
                },
                {
                    provide: TopicService,
                    useValue: mockTopicService,
                },
                {
                    provide: getModelToken(Forum.name),
                    useValue: mockForumModel,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ForumController>(ForumController);
        service = module.get<ForumService>(ForumService);
        topicService = module.get<TopicService>(TopicService);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('findAllForums', () => {
        it('should return a paginated result of forums when findAllForums is called', async () => {
            const paginationResult = {
                data: [mockForum],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockForumService.findAll.mockResolvedValue(paginationResult);

            const query: PaginationDto = { page: 1, limit: 10 };
            const result = await controller.findAllForums(query);

            expect(result.data).toHaveLength(1);
            expect(result.data[0]).toBeInstanceOf(ForumDto);
            expect(result.data[0]._id).toEqual(mockForum._id);
            expect(result.total).toBe(1);
            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return an empty paginated result when no forums exist and findAllForums is called', async () => {
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };
            mockForumService.findAll.mockResolvedValue(paginationResult);

            const query: PaginationDto = { page: 1, limit: 10 };
            const result = await controller.findAllForums(query);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return multiple forums in paginated result when multiple forums exist and findAllForums is called', async () => {
            const mockForums = [
                mockForum,
                {
                    ...mockForum,
                    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                },
            ];
            const paginationResult = {
                data: mockForums,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockForumService.findAll.mockResolvedValue(paginationResult);

            const query: PaginationDto = { page: 1, limit: 10 };
            const result = await controller.findAllForums(query);

            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toBeInstanceOf(ForumDto);
            expect(result.data[1]).toBeInstanceOf(ForumDto);
            expect(result.total).toBe(2);
            expect(service.findAll).toHaveBeenCalledWith(query);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });
    });

    describe('getGeneralForum', () => {
        it('should return the general forum when it exists', async () => {
            const generalForum = { ...mockForum, company: undefined };
            mockForumService.findOneByCompanyId.mockResolvedValue(generalForum);

            const result = await controller.getGeneralForum();

            expect(result).toBeInstanceOf(ForumDto);
            expect(result?._id).toEqual(generalForum._id);
            expect(result?.company).toBeUndefined();
            expect(service.findOneByCompanyId).toHaveBeenCalledWith();
        });

        it('should return null when general forum does not exist', async () => {
            mockForumService.findOneByCompanyId.mockResolvedValue(null);

            const result = await controller.getGeneralForum();

            expect(result).toBeNull();
            expect(service.findOneByCompanyId).toHaveBeenCalledWith();
        });
    });

    describe('findOneByCompanyId', () => {
        it('should return the forum for the given companyId', async () => {
            const companyId = new Types.ObjectId().toString();
            mockForumService.findOneByCompanyId.mockResolvedValue(mockForum);

            const result = await controller.findOneByCompanyId(companyId);

            expect(result).toBeInstanceOf(ForumDto);
            expect(result?._id).toEqual(mockForum._id);
            expect(service.findOneByCompanyId).toHaveBeenCalledWith(companyId);
        });

        it('should return null if no forum exists for the companyId', async () => {
            const companyId = new Types.ObjectId().toString();
            mockForumService.findOneByCompanyId.mockResolvedValue(null);

            const result = await controller.findOneByCompanyId(companyId);

            expect(result).toBeNull();
            expect(service.findOneByCompanyId).toHaveBeenCalledWith(companyId);
        });
    });

    describe('findAll (topics)', () => {
        it('should return paginated topics for a forum', async () => {
            const forumId = new Types.ObjectId().toString();
            const mockTopics = [
                {
                    _id: new Types.ObjectId(),
                    title: 'Topic 1',
                    description: 'Description 1',
                    messages: [],
                    author: new Types.ObjectId(),
                    nbMessages: 0,
                },
                {
                    _id: new Types.ObjectId(),
                    title: 'Topic 2',
                    description: 'Description 2',
                    messages: [],
                    author: new Types.ObjectId(),
                    nbMessages: 0,
                },
            ];
            const paginationResult = {
                data: mockTopics,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockTopicService.findAll.mockResolvedValue(paginationResult);

            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = await controller.findAll(forumId, pagination);

            expect(result).toEqual(paginationResult);
            expect(result.data).toHaveLength(2);
            expect(topicService.findAll).toHaveBeenCalledWith(forumId, pagination);
            expect(topicService.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return empty result when forum has no topics', async () => {
            const forumId = new Types.ObjectId().toString();
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };
            mockTopicService.findAll.mockResolvedValue(paginationResult);

            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = await controller.findAll(forumId, pagination);

            expect(result.data).toHaveLength(0);
            expect(topicService.findAll).toHaveBeenCalledWith(forumId, pagination);
        });
    });

    describe('findOne (topic)', () => {
        it('should return a topic when it exists', async () => {
            const forumId = new Types.ObjectId().toString();
            const topicId = new Types.ObjectId().toString();
            const mockTopic = {
                _id: topicId,
                title: 'Test Topic',
                description: 'Test Description',
                messages: [],
                author: new Types.ObjectId(),
                nbMessages: 0,
            };
            mockTopicService.findOne.mockResolvedValue(mockTopic);

            const result = await controller.findOne(forumId, topicId);

            expect(result).toEqual(mockTopic);
            expect(topicService.findOne).toHaveBeenCalledWith(forumId, topicId);
            expect(topicService.findOne).toHaveBeenCalledTimes(1);
        });

        it('should return null when topic does not exist', async () => {
            const forumId = new Types.ObjectId().toString();
            const topicId = new Types.ObjectId().toString();
            mockTopicService.findOne.mockResolvedValue(null);

            const result = await controller.findOne(forumId, topicId);

            expect(result).toBeNull();
            expect(topicService.findOne).toHaveBeenCalledWith(forumId, topicId);
        });
    });

    describe('create (topic)', () => {
        it('should create a new topic in a forum', async () => {
            const forumId = new Types.ObjectId().toString();
            const userId = new Types.ObjectId();
            const createDto = {
                title: 'New Topic',
                description: 'New Description',
                messages: [],
            };
            const req = {
                user: { sub: userId.toString() },
            } as any;

            mockTopicService.create.mockResolvedValue(undefined);

            await controller.create(forumId, createDto as any, req);

            expect(topicService.create).toHaveBeenCalledWith(forumId, {
                ...createDto,
                author: userId,
            });
            expect(topicService.create).toHaveBeenCalledTimes(1);
        });

        it('should create topic with author from request user', async () => {
            const forumId = new Types.ObjectId().toString();
            const userId = new Types.ObjectId();
            const createDto = {
                title: 'Another Topic',
                description: 'Another Description',
                messages: [],
            };
            const req = {
                user: { sub: userId.toString(), email: 'user@example.com' },
            } as any;

            mockTopicService.create.mockResolvedValue(undefined);

            await controller.create(forumId, createDto as any, req);

            const expectedDto = {
                ...createDto,
                author: new Types.ObjectId(userId.toString()),
            };
            expect(topicService.create).toHaveBeenCalledWith(forumId, expectedDto);
        });
    });

    describe('update (topic)', () => {
        it('should update an existing topic', async () => {
            const forumId = new Types.ObjectId().toString();
            const topicId = new Types.ObjectId().toString();
            const updateDto = {
                messages: [new Types.ObjectId()],
            };
            const req = {
                user: { sub: new Types.ObjectId().toString() },
            } as any;

            mockTopicService.update.mockResolvedValue(undefined);

            await controller.update(forumId, topicId, updateDto as any, req);

            expect(topicService.update).toHaveBeenCalledWith(forumId, topicId, updateDto);
            expect(topicService.update).toHaveBeenCalledTimes(1);
        });

        it('should update topic with complete CreateTopicDto', async () => {
            const forumId = new Types.ObjectId().toString();
            const topicId = new Types.ObjectId().toString();
            const createDto = {
                title: 'Updated Title',
                description: 'Updated Description',
                messages: [],
                author: new Types.ObjectId(),
            };
            const req = {
                user: { sub: new Types.ObjectId().toString() },
            } as any;

            mockTopicService.update.mockResolvedValue(undefined);

            await controller.update(forumId, topicId, createDto as any, req);

            expect(topicService.update).toHaveBeenCalledWith(forumId, topicId, createDto);
        });
    });
});
