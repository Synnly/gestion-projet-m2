import { Test, TestingModule } from '@nestjs/testing';
import { ForumController } from '../../../src/forum/forum.controller';
import { ForumService } from '../../../src/forum/forum.service';
import { PaginationDto } from '../../../src/common/pagination/dto/pagination.dto';
import { ForumDto } from '../../../src/forum/dto/forum.dto';
import { Types } from 'mongoose';
import { AuthGuard } from '../../../src/auth/auth.guard';

describe('ForumController', () => {
    let controller: ForumController;
    let service: ForumService;

    const mockForumService = {
        findAll: jest.fn(),
        findOneByCompanyId: jest.fn(),
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
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<ForumController>(ForumController);
        service = module.get<ForumService>(ForumService);

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
});
