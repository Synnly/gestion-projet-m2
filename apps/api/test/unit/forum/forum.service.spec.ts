import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ForumService } from '../../../src/forum/forum.service';
import { Forum } from '../../../src/forum/forum.schema';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { GeoService } from '../../../src/common/geography/geo.service';
import { PaginationDto } from '../../../src/common/pagination/dto/pagination.dto';
import { CompanyService } from '../../../src/company/company.service';

// Mock QueryBuilder
jest.mock('../../../src/common/pagination/query.builder', () => {
    return {
        QueryBuilder: jest.fn().mockImplementation(() => {
            return {
                build: jest.fn().mockResolvedValue({ mocked: 'filter' }),
                buildSort: jest.fn().mockReturnValue({ mocked: 'sort' }),
            };
        }),
    };
});

describe('ForumService', () => {
    let service: ForumService;
    let paginationService: PaginationService;
    let companyService: CompanyService;

    const mockForumModel = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    // Helper to mock a Mongoose Query
    // This allows the query to be both awaited directly (thenable) and executed via .exec()
    const mockQuery = (result: any) => ({
        exec: jest.fn().mockResolvedValue(result),
        then: (resolve: any) => Promise.resolve(result).then(resolve),
        // Add chainable methods if needed, returning 'this'
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
    });

    // Mock constructor for new this.forumModel(...)
    const mockForumConstructor = jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest.fn().mockResolvedValue(dto),
    }));

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockGeoService = {};

    const mockCompanyService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();
        mockForumModel.findOne.mockReset();
        mockCompanyService.findOne.mockReset();
        mockPaginationService.paginate.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ForumService,
                {
                    provide: getModelToken(Forum.name),
                    useValue: mockForumConstructor,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
                {
                    provide: GeoService,
                    useValue: mockGeoService,
                },
                {
                    provide: CompanyService,
                    useValue: mockCompanyService,
                },
            ],
        }).compile();

        service = module.get<ForumService>(ForumService);
        paginationService = module.get<PaginationService>(PaginationService);
        companyService = module.get<CompanyService>(CompanyService);

        // Attach static methods to the constructor mock
        (mockForumConstructor as any).findOne = mockForumModel.findOne;
    });

    describe('constructor', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
    });

    describe('create', () => {
        it('should create a forum for a company when it does not exist', async () => {
            const companyId = new Types.ObjectId();
            const companyName = 'Test Company';

            // Mock findOne to return null (not found)
            mockForumModel.findOne.mockReturnValue(mockQuery(null));
            mockCompanyService.findOne.mockResolvedValue({ name: companyName });

            const result = await service.create(companyId);

            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: companyId });
            expect(mockCompanyService.findOne).toHaveBeenCalledWith(companyId.toString());
            expect(result).toEqual({ company: companyId, companyName, topics: [] });
        });

        it('should create a general forum when it does not exist', async () => {
            // Mock findOne to return null (not found)
            mockForumModel.findOne.mockReturnValue(mockQuery(null));

            const result = await service.create();

            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: undefined });
            expect(result).toEqual({ topics: [] });
        });

        it('should throw BadRequestException when forum for company already exists', async () => {
            const companyId = new Types.ObjectId();
            // Mock findOne to return an existing document
            mockForumModel.findOne.mockReturnValue(mockQuery({ _id: 'existing' }));

            await expect(service.create(companyId)).rejects.toThrow(BadRequestException);
            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: companyId });
        });

        it('should throw BadRequestException when general forum already exists', async () => {
            mockForumModel.findOne.mockReturnValue(mockQuery({ _id: 'existing' }));

            await expect(service.create()).rejects.toThrow(BadRequestException);
            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: undefined });
        });

        it('should throw BadRequestException when company does not exist', async () => {
            const companyId = new Types.ObjectId();
            mockForumModel.findOne.mockReturnValue(mockQuery(null));
            mockCompanyService.findOne.mockResolvedValue(null);

            await expect(service.create(companyId)).rejects.toThrow(BadRequestException);
            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: companyId });
            expect(mockCompanyService.findOne).toHaveBeenCalledWith(companyId.toString());
        });
    });

    describe('findOneByCompanyId', () => {
        it('should return a forum when found', async () => {
            const companyId = new Types.ObjectId().toString();
            const mockForum = { _id: 'forumId', company: companyId };

            mockForumModel.findOne.mockReturnValue(mockQuery(mockForum));

            const result = await service.findOneByCompanyId(companyId);

            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: companyId });
            expect(result).toEqual(mockForum);
        });

        it('should return null when not found', async () => {
            const companyId = new Types.ObjectId().toString();
            mockForumModel.findOne.mockReturnValue(mockQuery(null));

            const result = await service.findOneByCompanyId(companyId);

            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: companyId });
            expect(result).toBeNull();
        });

        it('should return general forum when companyId is undefined', async () => {
            const mockForum = { _id: 'generalForum' };
            mockForumModel.findOne.mockReturnValue(mockQuery(mockForum));

            const result = await service.findOneByCompanyId(undefined);

            expect(mockForumModel.findOne).toHaveBeenCalledWith({ company: undefined });
            expect(result).toEqual(mockForum);
        });
    });

    describe('findAll', () => {
        const expectedPopulate = [
            {
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            },
            {
                path: 'topics',
                select: '_id author title description',
            },
        ];

        it('should return paginated forums when findAll is called', async () => {
            const query: PaginationDto = { page: 1, limit: 10 };
            const mockForums = [{ _id: 'forum1' }, { _id: 'forum2' }];
            const mockResult = {
                data: mockForums,
                meta: { total: 2, page: 1, limit: 10, lastPage: 1 },
            };
            mockPaginationService.paginate.mockResolvedValue(mockResult);

            const result = await service.findAll(query);

            expect(paginationService.paginate).toHaveBeenCalledTimes(1);
            expect(paginationService.paginate).toHaveBeenCalledWith(
                mockForumConstructor,
                { mocked: 'filter' },
                query.page,
                query.limit,
                expectedPopulate,
                { mocked: 'sort' },
            );
            expect(result).toEqual(mockResult);
            expect(result.data).toHaveLength(2);
        });

        it('should return empty result when no forums found', async () => {
            const query: PaginationDto = { page: 1, limit: 10 };
            const mockResult = {
                data: [],
                meta: { total: 0, page: 1, limit: 10, lastPage: 1 },
            };
            mockPaginationService.paginate.mockResolvedValue(mockResult);

            const result = await service.findAll(query);

            expect(paginationService.paginate).toHaveBeenCalledTimes(1);
            expect(result.data).toHaveLength(0);
        });

        it('should call paginate with filters when provided', async () => {
            const query: PaginationDto = { page: 1, limit: 10, searchQuery: 'test' };
            const mockForums = [{ _id: 'forum1' }, { _id: 'forum2' }];
            const mockResult = {
                data: mockForums,
                meta: { total: 2, page: 1, limit: 10, lastPage: 1 },
            };
            mockPaginationService.paginate.mockResolvedValue(mockResult);

            const result = await service.findAll(query);

            expect(paginationService.paginate).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResult);
            expect(result.data).toHaveLength(2);
            expect(paginationService.paginate).toHaveBeenCalledWith(
                mockForumConstructor,
                { mocked: 'filter' },
                query.page,
                query.limit,
                expectedPopulate,
                { mocked: 'sort' },
            );
        });
    });
});
