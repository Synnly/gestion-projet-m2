import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from '../../../../src/forum/report/report.controller';
import { ReportService } from '../../../../src/forum/report/report.service';
import { CreateReportDto } from '../../../../src/forum/report/dto/create-report.dto';
import { UpdateReportDto } from '../../../../src/forum/report/dto/update-report.dto';
import { ReportReason } from '../../../../src/forum/report/reportReason.enum';
import { AuthGuard } from '../../../../src/auth/auth.guard';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

describe('ReportController', () => {
    let controller: ReportController;
    let service: ReportService;

    const mockReportId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const mockMessageId = new Types.ObjectId('507f1f77bcf86cd799439012');
    const mockReporterId = new Types.ObjectId('507f1f77bcf86cd799439013');

    const mockReport = {
        _id: mockReportId,
        messageId: {
            _id: mockMessageId,
            content: 'Test message',
            authorId: {
                _id: new Types.ObjectId(),
                email: 'author@test.com',
                firstName: 'John',
                lastName: 'Doe',
            },
            topicId: {
                _id: new Types.ObjectId(),
                forumId: 'general',
                title: 'Test Topic',
            },
        },
        reporterId: mockReporterId,
        reason: ReportReason.SPAM,
        explanation: 'This is spam',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockReportService = {
        createReport: jest.fn(),
        getAllReports: jest.fn(),
        getReportById: jest.fn(),
        getReportsByMessageId: jest.fn(),
        getReportsByReporterId: jest.fn(),
        updateReportStatus: jest.fn(),
        deleteReport: jest.fn(),
        getReportStats: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReportController],
            providers: [
                {
                    provide: ReportService,
                    useValue: mockReportService,
                },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ReportController>(ReportController);
        service = module.get<ReportService>(ReportService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createReport', () => {
        it('should create a report', async () => {
            const createReportDto: CreateReportDto = {
                messageId: mockMessageId.toString(),
                reason: ReportReason.SPAM,
                explanation: 'This is spam',
            };

            const req = { user: { sub: mockReporterId.toString() } } as any;

            mockReportService.createReport.mockResolvedValue(mockReport);

            const result = await controller.createReport(createReportDto, req);

            expect(result).toEqual(mockReport);
            expect(service.createReport).toHaveBeenCalledWith(createReportDto, mockReporterId.toString());
        });

        it('should throw BadRequestException if user not authenticated', async () => {
            const createReportDto: CreateReportDto = {
                messageId: mockMessageId.toString(),
                reason: ReportReason.SPAM,
            };

            const req = { user: undefined } as any;

            await expect(controller.createReport(createReportDto, req)).rejects.toThrow(BadRequestException);
            expect(service.createReport).not.toHaveBeenCalled();
        });
    });

    describe('getAllReports', () => {
        it('should return paginated reports', async () => {
            const paginatedResult = {
                data: [mockReport],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockReportService.getAllReports.mockResolvedValue(paginatedResult);

            const result = await controller.getAllReports(1, 10);

            expect(result).toEqual(paginatedResult);
            expect(service.getAllReports).toHaveBeenCalledWith(1, 10, undefined);
        });

        it('should filter reports by status', async () => {
            const paginatedResult = {
                data: [mockReport],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockReportService.getAllReports.mockResolvedValue(paginatedResult);

            await controller.getAllReports(1, 10, 'pending');

            expect(service.getAllReports).toHaveBeenCalledWith(1, 10, 'pending');
        });
    });

    describe('getReportById', () => {
        it('should return a report by id', async () => {
            mockReportService.getReportById.mockResolvedValue(mockReport);

            const result = await controller.getReportById(mockReportId.toString());

            expect(result).toEqual(mockReport);
            expect(service.getReportById).toHaveBeenCalledWith(mockReportId.toString());
        });
    });

    describe('getReportsByMessageId', () => {
        it('should return reports for a message', async () => {
            mockReportService.getReportsByMessageId.mockResolvedValue([mockReport]);

            const result = await controller.getReportsByMessageId(mockMessageId.toString());

            expect(result).toEqual([mockReport]);
            expect(service.getReportsByMessageId).toHaveBeenCalledWith(mockMessageId.toString());
        });
    });

    describe('getMyReports', () => {
        it('should return reports created by current user', async () => {
            const req = { user: { sub: mockReporterId.toString() } } as any;

            mockReportService.getReportsByReporterId.mockResolvedValue([mockReport]);

            const result = await controller.getMyReports(req);

            expect(result).toEqual([mockReport]);
            expect(service.getReportsByReporterId).toHaveBeenCalledWith(mockReporterId.toString());
        });

        it('should throw BadRequestException if user not authenticated', async () => {
            const req = { user: undefined } as any;

            await expect(controller.getMyReports(req)).rejects.toThrow(BadRequestException);
            expect(service.getReportsByReporterId).not.toHaveBeenCalled();
        });
    });

    describe('updateReportStatus', () => {
        it('should update report status', async () => {
            const updateDto: UpdateReportDto = { status: 'resolved' };
            const updatedReport = { ...mockReport, status: 'resolved' };

            mockReportService.updateReportStatus.mockResolvedValue(updatedReport);

            const result = await controller.updateReportStatus(mockReportId.toString(), updateDto);

            expect(result).toEqual(updatedReport);
            expect(service.updateReportStatus).toHaveBeenCalledWith(mockReportId.toString(), updateDto);
        });
    });

    describe('deleteReport', () => {
        it('should delete a report', async () => {
            mockReportService.deleteReport.mockResolvedValue(undefined);

            await controller.deleteReport(mockReportId.toString());

            expect(service.deleteReport).toHaveBeenCalledWith(mockReportId.toString());
        });
    });

    describe('getReportStats', () => {
        it('should return report statistics', async () => {
            const stats = {
                pending: 5,
                resolved: 3,
                rejected: 2,
            };

            mockReportService.getReportStats.mockResolvedValue(stats);

            const result = await controller.getReportStats();

            expect(result).toEqual(stats);
            expect(service.getReportStats).toHaveBeenCalled();
        });
    });
});
