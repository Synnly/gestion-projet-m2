import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ReportService } from '../../../../src/forum/report/report.service';
import { Report } from '../../../../src/forum/report/report.schema';
import { Message } from '../../../../src/forum/message/message.schema';
import { PaginationService } from '../../../../src/common/pagination/pagination.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReportReason } from '../../../../src/forum/report/reportReason.enum';

describe('ReportService', () => {
    let service: ReportService;
    let reportModel: any;
    let messageModel: any;
    let paginationService: PaginationService;

    const mockMessageId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const mockReporterId = new Types.ObjectId('507f1f77bcf86cd799439012');
    const mockReportId = new Types.ObjectId('507f1f77bcf86cd799439013');

    const mockMessage = {
        _id: mockMessageId,
        content: 'Test message content',
        authorId: new Types.ObjectId(),
        topicId: new Types.ObjectId(),
    };

    const mockReport = {
        _id: mockReportId,
        messageId: mockMessageId,
        reporterId: mockReporterId,
        reason: ReportReason.SPAM,
        explanation: 'This is spam',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockReportModel = {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
    };

    const mockMessageModel = {
        findById: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportService,
                {
                    provide: getModelToken(Report.name),
                    useValue: mockReportModel,
                },
                {
                    provide: getModelToken(Message.name),
                    useValue: mockMessageModel,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
            ],
        }).compile();

        service = module.get<ReportService>(ReportService);
        reportModel = module.get(getModelToken(Report.name));
        messageModel = module.get(getModelToken(Message.name));
        paginationService = module.get<PaginationService>(PaginationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createReport', () => {
        const createReportDto = {
            messageId: mockMessageId.toString(),
            reason: ReportReason.SPAM,
            explanation: 'This is spam',
        };

        it('should create a report successfully', async () => {
            mockMessageModel.findById.mockResolvedValue(mockMessage);
            mockReportModel.findOne.mockResolvedValue(null);
            mockReportModel.create.mockResolvedValue(mockReport);

            const result = await service.createReport(createReportDto, mockReporterId.toString());

            expect(result).toEqual(mockReport);
            expect(messageModel.findById).toHaveBeenCalledWith(createReportDto.messageId);
            expect(reportModel.findOne).toHaveBeenCalledWith({
                messageId: createReportDto.messageId,
                reporterId: mockReporterId,
            });
            expect(reportModel.create).toHaveBeenCalledWith({
                ...createReportDto,
                reporterId: mockReporterId,
                messageId: expect.any(Types.ObjectId),
            });
        });

        it('should throw NotFoundException if message does not exist', async () => {
            mockMessageModel.findById.mockResolvedValue(null);

            await expect(service.createReport(createReportDto, mockReporterId.toString())).rejects.toThrow(
                NotFoundException,
            );
            expect(messageModel.findById).toHaveBeenCalledWith(createReportDto.messageId);
            expect(reportModel.create).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if user already reported this message', async () => {
            mockMessageModel.findById.mockResolvedValue(mockMessage);
            mockReportModel.findOne.mockResolvedValue(mockReport);

            await expect(service.createReport(createReportDto, mockReporterId.toString())).rejects.toThrow(
                BadRequestException,
            );
            expect(reportModel.findOne).toHaveBeenCalledWith({
                messageId: createReportDto.messageId,
                reporterId: mockReporterId,
            });
            expect(reportModel.create).not.toHaveBeenCalled();
        });
    });

    describe('getAllReports', () => {
        it('should return paginated reports', async () => {
            const expectedResult = {
                data: [mockReport],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(expectedResult);

            const result = await service.getAllReports(1, 10);

            expect(result).toEqual(expectedResult);
            expect(paginationService.paginate).toHaveBeenCalledWith(
                reportModel,
                {},
                1,
                10,
                [
                    {
                        path: 'messageId',
                        populate: [
                            {
                                path: 'topicId',
                                select: 'forumId title',
                            },
                            {
                                path: 'authorId',
                                select: 'email firstName lastName ban',
                            },
                        ],
                    },
                ],
                '-1',
            );
        });

        it('should filter reports by status', async () => {
            const expectedResult = {
                data: [mockReport],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(expectedResult);

            await service.getAllReports(1, 10, 'pending');

            expect(paginationService.paginate).toHaveBeenCalledWith(
                reportModel,
                { status: 'pending' },
                1,
                10,
                expect.any(Array),
                '-1',
            );
        });
    });

    describe('getReportById', () => {
        it('should return a report by id', async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockReport),
            };
            mockReportModel.findById.mockReturnValue(mockQuery);

            const result = await service.getReportById(mockReportId.toString());

            expect(result).toEqual(mockReport);
            expect(reportModel.findById).toHaveBeenCalledWith(mockReportId.toString());
            expect(mockQuery.populate).toHaveBeenCalledTimes(2);
        });

        it('should throw NotFoundException if report not found', async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            };
            mockReportModel.findById.mockReturnValue(mockQuery);

            await expect(service.getReportById(mockReportId.toString())).rejects.toThrow(NotFoundException);
        });
    });

    describe('getReportsByMessageId', () => {
        it('should return all reports for a message', async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([mockReport]),
            };
            mockReportModel.find.mockReturnValue(mockQuery);

            const result = await service.getReportsByMessageId(mockMessageId.toString());

            expect(result).toEqual([mockReport]);
            expect(reportModel.find).toHaveBeenCalledWith({ messageId: expect.any(Types.ObjectId) });
        });
    });

    describe('getReportsByReporterId', () => {
        it('should return all reports created by a user', async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue([mockReport]),
                    }),
                }),
            };
            mockReportModel.find.mockReturnValue(mockQuery);

            const result = await service.getReportsByReporterId(mockReporterId.toString());

            expect(result).toEqual([mockReport]);
            expect(reportModel.find).toHaveBeenCalledWith({ reporterId: expect.any(Types.ObjectId) });
        });
    });

    describe('updateReportStatus', () => {
        it('should update report status', async () => {
            const updateDto = { status: 'resolved' };
            const updatedReport = { ...mockReport, status: 'resolved' };

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(updatedReport),
            };
            mockReportModel.findByIdAndUpdate.mockReturnValue(mockQuery);

            const result = await service.updateReportStatus(mockReportId.toString(), updateDto);

            expect(result).toEqual(updatedReport);
            expect(reportModel.findByIdAndUpdate).toHaveBeenCalledWith(
                mockReportId.toString(),
                updateDto,
                { new: true },
            );
        });

        it('should throw NotFoundException if report not found', async () => {
            const updateDto = { status: 'resolved' };

            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            };
            mockReportModel.findByIdAndUpdate.mockReturnValue(mockQuery);

            await expect(service.updateReportStatus(mockReportId.toString(), updateDto)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('deleteReport', () => {
        it('should delete a report', async () => {
            mockReportModel.findByIdAndDelete.mockResolvedValue(mockReport);

            await service.deleteReport(mockReportId.toString());

            expect(reportModel.findByIdAndDelete).toHaveBeenCalledWith(mockReportId.toString());
        });

        it('should throw NotFoundException if report not found', async () => {
            mockReportModel.findByIdAndDelete.mockResolvedValue(null);

            await expect(service.deleteReport(mockReportId.toString())).rejects.toThrow(NotFoundException);
        });
    });

    describe('getReportStats', () => {
        it('should return report statistics', async () => {
            const mockStats = [
                { _id: 'pending', count: 5 },
                { _id: 'resolved', count: 3 },
                { _id: 'rejected', count: 2 },
            ];

            mockReportModel.aggregate.mockResolvedValue(mockStats);

            const result = await service.getReportStats();

            expect(result).toEqual({
                pending: 5,
                resolved: 3,
                rejected: 2,
            });
            expect(reportModel.aggregate).toHaveBeenCalledWith([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ]);
        });
    });
});
