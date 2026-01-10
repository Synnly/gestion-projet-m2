import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Topic } from '../../../../src/forum/topic/topic.schema';
import { MessageService } from '../../../../src/forum/message/message.service';
import { PaginationService } from '../../../../src/common/pagination/pagination.service';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../../../../src/forum/message/message.schema';
import { CreateMessageDto } from '../../../../src/forum/message/dto/createMessageDto';
import { NotificationService } from 'src/notification/notification.service';
import { Forum } from 'src/forum/forum.schema';
import { CreateNotificationDto } from 'src/notification/dto/createNotification.dto';
import { NotFoundException } from '@nestjs/common';

describe('MessageService', () => {
    let service: MessageService;
    let messageModel: Model<MessageDocument>;
    let topicModel: Model<Topic>;
    let forumModel: Model<Forum>;
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

    const mockMessage = {
        _id: new Types.ObjectId(),
        content: 'Test Message',
        authorId: mockAuthorId,
        topicId: mockTopicId,
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(this),
    };

    const mockTopicModel = {
        create: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    const mockForumModel = {
        findById: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    };
    const mockMessageModel = {
        save: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };
    const mockNotificationService = {
        create: jest.fn(),
    };
    const mockQuery = (result: any) => ({
        exec: jest.fn().mockResolvedValue(result),
        populate: jest.fn().mockReturnThis(),
        then: (resolve: any) => Promise.resolve(result).then(resolve),
    });
    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessageService,
                {
                    provide: getModelToken(Topic.name),
                    useValue: mockTopicModel,
                },
                {
                    provide: getModelToken(Message.name),
                    useValue: mockMessageModel,
                },
                { provide: getModelToken('Forum'), useValue: mockForumModel },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
            ],
        }).compile();

        service = module.get<MessageService>(MessageService);
        messageModel = module.get(getModelToken(Message.name));
        forumModel = module.get(getModelToken(Topic.name));
        topicModel = module.get(getModelToken(Topic.name));
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
                data: [mockMessage],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(expectedResult);

            const result = await service.findAll(paginationDto, mockTopicId.toString());

            expect(result).toEqual(expectedResult);
            expect(this.paginationService!.paginate).toHaveBeenCalledWith(
                messageModel,
                { topicId: mockTopic._id.toString() },
                1,
                10,
                [
                    { path: 'authorId', select: 'firstName lastName name logo role ' },
                    {
                        path: 'parentMessageId',
                        populate: {
                            path: 'authorId',
                            select: 'firstName lastName name',
                        },
                    },
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

            await service.findAll(paginationDto, mockTopicId.toString());

            expect(paginationService.paginate).toHaveBeenCalledWith(
                messageModel,
                { topicId: mockTopicId.toString() },
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

    describe('create', () => {
        it("should create a new message and update topic's message ", async () => {
            const createDto: CreateMessageDto = {
                content: 'New Message Content',
                authorId: mockAuthorId.toString(),
            };
            const createdMessage = { ...mockMessage, ...createDto, _id: mockMessage._id };
            mockMessageModel.save.mockResolvedValue(createdMessage);
            mockTopicModel.findByIdAndUpdate.mockResolvedValue({ ...mockTopic, messages: [mockMessage._id] });
            const message = await service.sendMessage(mockTopicId.toString(), createDto);

            expect(mockTopicModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopicId,
                {
                    $push: { topics: mockTopicId },
                },
                { new: true },
            );
            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopic?.forumId,
                { $inc: { nbMessages: 1 } },
                { new: true },
            );
            expect(message).toEqual(createdMessage);
        });

        it('should create a new message with reply, update topic and forum and send notif', async () => {
            const createDto: CreateMessageDto = {
                content: 'New Message Content',
                authorId: mockAuthorId.toString(),
                parentMessageId: new Types.ObjectId().toString(),
            };

            const replyMessage = { authorId: { _id: new Types.ObjectId() } };
            const createdMessage = { ...mockMessage, ...createDto, _id: mockMessage._id };

            mockMessageModel.save.mockResolvedValue(createdMessage);
            mockTopicModel.findByIdAndUpdate.mockResolvedValue({ ...mockTopic, messages: [mockMessage._id] });
            const mockForum = { _id: mockForumId, company: { _id: new Types.ObjectId() } };
            mockForumModel.findByIdAndUpdate.mockResolvedValue(mockForum);

            const message = await service.sendMessage(mockTopicId.toString(), createDto);
            const mockPopulate = jest.fn();
            const mockExec = jest.fn();

            mockMessageModel.findById.mockResolvedValue(mockPopulate);
            mockPopulate.mockResolvedValue(mockExec);
            mockExec.mockResolvedValue(replyMessage);

            expect(mockMessageModel).toHaveBeenCalledWith({
                ...createDto,
                topicId: mockTopicId.toString(),
            });

            expect(mockTopicModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopicId,
                {
                    $push: { topics: mockTopicId },
                },
                { new: true },
            );

            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopic?.forumId,
                { $inc: { nbMessages: 1 } },
                { new: true },
            );

            expect(message).toEqual(createdMessage);

            const dto = new CreateNotificationDto();
            dto.userId = replyMessage.authorId._id;
            dto.message = `Votre message a une nouvelle réponse dans le topic "${mockTopic.title}"`;
            const companyPart = mockForum.company?._id.toString();
            dto.returnLink = `/forums/${companyPart}/${mockForum._id.toString()}/${mockTopic._id.toString()}`;
            expect(mockNotificationService.create).toHaveBeenCalledWith(dto);
        });

        it("should not update topic and forum if topic doesn't exist and throw not found", async () => {
            const createDto: CreateMessageDto = {
                content: 'New Message Content',
                authorId: mockAuthorId.toString(),
                parentMessageId: new Types.ObjectId().toString(),
            };
            const createdMessage = { ...mockMessage, ...createDto, _id: mockMessage._id };
            mockMessageModel.save.mockResolvedValue(createdMessage);
            mockTopicModel.findByIdAndUpdate.mockResolvedValue(null);

            expect(await service.sendMessage(mockTopicId.toString(), createDto)).toThrow(NotFoundException);

            expect(mockMessageModel.save).toHaveBeenCalledWith({
                ...createDto,
                topicId: mockForumId.toString(),
            });
            expect(mockTopicModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopicId.toString(),
                {
                    $push: { topics: mockTopicId },
                },
                { new: true },
            );
            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockForumModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockTopic?.forumId,
                { $inc: { nbMessages: 1 } },
                { new: true },
            );
        });
    });
});
