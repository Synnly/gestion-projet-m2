import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PostService } from '../../../src/post/post.service';
import { Post } from '../../../src/post/post.schema';
import { CreatePostDto } from '../../../src/post/dto/createPost.dto';
import { PostType } from '../../../src/post/post.schema';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { GeoService } from '../../../src/common/geography/geo.service';
import { CompanyService } from '../../../src/company/company.service';
import { CreationFailedError } from '../../../src/errors/creationFailedError';
import { ApplicationService } from '../../../src/application/application.service';

const basePost = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    title: 'Développeur Full Stack',
    description: 'Nous recherchons un développeur full stack expérimenté',
    duration: '6 mois',
    startDate: '2025-01-15',
    minSalary: 2000,
    maxSalary: 3000,
    sector: 'IT',
    keySkills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
    adress: 'Paris, France',
    type: PostType.Hybride,
    isVisible: true,
    isCoverLetterRequired: false,
};

const createMockPost = (overrides: Partial<Post> = {}) => {
    const post: any = {
        ...basePost,
        ...overrides,
    };
    post.populate = jest.fn().mockResolvedValue(post);
    return post;
};

describe('PostService', () => {
    let service: PostService;
    let model: Model<Post>;

    const mockPost = createMockPost();

    const mockPostModel = {
        create: jest.fn(),
        find: jest.fn(),
        findById: jest.fn(),
        findOneAndUpdate: jest.fn(),
        constructor: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockGeoService = {
        geocodeAddress: jest.fn().mockResolvedValue([2.3522, 48.8566]),
    };

    const mockCompanyService = {
        findOne: jest.fn().mockResolvedValue({
            address: '10 Rue de Test',
        }),
    };

    const mockApplicationService = {
        getPostIdsByStudent: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                {
                    provide: getModelToken(Post.name),
                    useValue: mockPostModel,
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
                {
                    provide: ApplicationService,
                    useValue: mockApplicationService,
                },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        model = module.get<Model<Post>>(getModelToken(Post.name));

        jest.clearAllMocks();
    });

    it('should be defined when service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const companyId = '507f1f77bcf86cd799439099';
        const validCreatePostDto: CreatePostDto = {
            title: 'Nouveau poste',
            description: 'Description du nouveau poste',
            duration: '3 mois',
            startDate: '2025-02-01',
            minSalary: 1500,
            maxSalary: 2500,
            sector: 'IT',
            keySkills: ['Python', 'Django'],
            adress: 'Lyon, France',
            type: PostType.Presentiel,
            isVisible: true,
            isCoverLetterRequired: false,
        };

        it('should create a new post when valid dto is provided and create is called', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            const mockSave = jest.fn().mockResolvedValue(mockPost);
            const postInstance = {
                ...validCreatePostDto,
                save: mockSave,
            };

            const mockModel = Object.assign(jest.fn().mockReturnValue(postInstance), {
                findById: jest.fn().mockReturnValue({ populate: populateMock }),
            });
            const serviceWithMock = new PostService(
                mockModel as any,
                mockPaginationService as any,
                mockGeoService as any,
                mockCompanyService as any,
                mockApplicationService as any,
            );

            const result = await serviceWithMock.create(validCreatePostDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result._id?.toString()).toBe(mockPost._id.toString());
            expect(result.title).toBe(mockPost.title);
            expect(result.description).toBe(mockPost.description);
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalDto: CreatePostDto = {
                title: 'Titre minimal',
                description: 'Description minimale',
                keySkills: ['Compétence1'],
                isCoverLetterRequired: false,
            };

            const mockSave = jest.fn().mockResolvedValue({ ...mockPost, ...minimalDto });
            const postInstance = {
                ...minimalDto,
                save: mockSave,
            };

            const execMock = jest.fn().mockResolvedValue(createMockPost({ ...minimalDto }));
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            const mockModel = Object.assign(jest.fn().mockReturnValue(postInstance), {
                findById: jest.fn().mockReturnValue({ populate: populateMock }),
            });
            const serviceWithMock = new PostService(
                mockModel as any,
                mockPaginationService as any,
                mockGeoService as any,
                mockCompanyService as any,
                mockApplicationService as any,
            );

            const result = await serviceWithMock.create(minimalDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result.title).toBe('Titre minimal');
            expect(result.description).toBe('Description minimale');
        });

        it('should create a post with all optional fields when create is called', async () => {
            const mockSave = jest.fn().mockResolvedValue(mockPost);
            const postInstance = {
                ...validCreatePostDto,
                save: mockSave,
            };

            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            const mockModel = Object.assign(jest.fn().mockReturnValue(postInstance), {
                findById: jest.fn().mockReturnValue({ populate: populateMock }),
            });
            const serviceWithMock = new PostService(
                mockModel as any,
                mockPaginationService as any,
                mockGeoService as any,
                mockCompanyService as any,
                mockApplicationService as any,
            );

            const result = await serviceWithMock.create(validCreatePostDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('minSalary');
            expect(result).toHaveProperty('maxSalary');
        });

        it('should throw CreationFailedError when populated post cannot be retrieved after save', async () => {
            const mockSave = jest.fn().mockResolvedValue(mockPost);
            const postInstance = {
                ...validCreatePostDto,
                save: mockSave,
            };

            const execMock = jest.fn().mockResolvedValue(null);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            const mockModel = Object.assign(jest.fn().mockReturnValue(postInstance), {
                findById: jest.fn().mockReturnValue({ populate: populateMock }),
            });

            const serviceWithMock = new PostService(
                mockModel as any,
                mockPaginationService as any,
                mockGeoService as any,
                mockCompanyService as any,
                mockApplicationService as any,
            );

            await expect(serviceWithMock.create(validCreatePostDto, companyId)).rejects.toThrow(CreationFailedError);
        });
    });

    describe('findAll', () => {
        it('should return paginated posts when findAll is called', async () => {
            const mockPosts = [createMockPost()];
            const paginationResult = {
                data: mockPosts,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAll({ page: 1, limit: 10 } as any);

            // Service returns a paginated result: assert on `data`
            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(mockPaginationService.paginate).toHaveBeenCalledTimes(1);
        });

        it('should return empty paginated result when no posts exist and findAll is called', async () => {
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAll({ page: 1, limit: 10 } as any);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should return multiple posts in paginated result when multiple posts exist and findAll is called', async () => {
            const mockPosts = [
                createMockPost(),
                createMockPost({ _id: new Types.ObjectId('507f1f77bcf86cd799439012'), title: 'Développeur Backend' }),
                createMockPost({ _id: new Types.ObjectId('507f1f77bcf86cd799439013'), title: 'Développeur Frontend' }),
            ];
            const paginationResult = {
                data: mockPosts,
                total: 3,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAll({ page: 1, limit: 10 } as any);

            expect(result.data).toHaveLength(3);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(result.data[1].title).toBe('Développeur Backend');
            expect(result.data[2].title).toBe('Développeur Frontend');
        });
    });

    describe('findOne', () => {
        const validObjectId = '507f1f77bcf86cd799439011';

        it('should return a post when valid id is provided and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            mockPostModel.findById.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeDefined();
            expect(result?.title).toBe('Développeur Full Stack');
            expect(mockPostModel.findById).toHaveBeenCalledWith(validObjectId);
            expect(populateMock).toHaveBeenCalledWith({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus address logo',
            });
            expect(execMock).toHaveBeenCalledTimes(1);
        });

        it('should return null when post is not found and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(null);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            mockPostModel.findById.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeNull();
            expect(mockPostModel.findById).toHaveBeenCalledWith(validObjectId);
        });

        it('should return correct post data when post exists and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(mockPost);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            mockPostModel.findById.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeDefined();
            expect(result?.description).toBe('Nous recherchons un développeur full stack expérimenté');
            expect(result?.duration).toBe('6 mois');
            expect(result?.minSalary).toBe(2000);
            expect(result?.maxSalary).toBe(3000);
            expect(result?.keySkills).toEqual(['JavaScript', 'TypeScript', 'React', 'Node.js']);
            expect(result?.type).toBe(PostType.Hybride);
        });
    });

    describe('update', () => {
        const companyId = '507f1f77bcf86cd799439099';
        const postId = '507f1f77bcf86cd799439011';

        it('should update and return the post when it belongs to the company', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost({ title: 'Updated Title' }));
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            mockPostModel.findOneAndUpdate.mockReturnValue({ populate: populateMock });

            const dto = { title: 'Updated Title' } as any;

            const result = await service.update(dto, companyId, postId);

            expect(result.title).toBe('Updated Title');
            expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledTimes(1);

            const calledFilter = mockPostModel.findOneAndUpdate.mock.calls[0][0];
            expect(calledFilter._id).toBe(postId);
            expect(String(calledFilter.company)).toBe(companyId);
        });

        it('should throw NotFoundException when update returns null', async () => {
            const execMock = jest.fn().mockResolvedValue(null);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            mockPostModel.findOneAndUpdate.mockReturnValue({ populate: populateMock });

            const dto = { title: 'No Update' } as any;

            await expect(service.update(dto, companyId, postId)).rejects.toThrow();
        });
    });

    describe('findAllByStudent', () => {
        const studentId = '507f1f77bcf86cd799439088';

        it('should return paginated posts when student has applications', async () => {
            const postIds = [
                new Types.ObjectId('507f1f77bcf86cd799439011'),
                new Types.ObjectId('507f1f77bcf86cd799439012'),
            ];
            const mockPosts = [
                createMockPost({ _id: postIds[0] }),
                createMockPost({ _id: postIds[1], title: 'Développeur Backend' }),
            ];
            const paginationResult = {
                data: mockPosts,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue(postIds);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAllByStudent({ page: 1, limit: 10 } as any, studentId);

            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledWith(studentId);
            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledTimes(1);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]._id).toEqual(postIds[0]);
            expect(result.data[1]._id).toEqual(postIds[1]);
            expect(result.total).toBe(2);
        });

        it('should return empty paginated result when student has no applications', async () => {
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue([]);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAllByStudent({ page: 1, limit: 10 } as any, studentId);

            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledWith(studentId);
            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should apply additional filters along with post IDs from applications', async () => {
            const postIds = [new Types.ObjectId('507f1f77bcf86cd799439011')];
            const mockPosts = [createMockPost({ _id: postIds[0], sector: 'IT' })];
            const paginationResult = {
                data: mockPosts,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue(postIds);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const query = {
                page: 1,
                limit: 10,
                sector: 'IT',
            };

            const result = await service.findAllByStudent(query as any, studentId);

            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledWith(studentId);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].sector).toBe('IT');
        });

        it('should handle pagination correctly when there are multiple pages', async () => {
            const postIds = Array.from(
                { length: 25 },
                (_, i) => new Types.ObjectId(`507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`),
            );
            const mockPosts = postIds.slice(10, 20).map((id) => createMockPost({ _id: id }));
            const paginationResult = {
                data: mockPosts,
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                hasNext: true,
                hasPrev: true,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue(postIds);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAllByStudent({ page: 2, limit: 10 } as any, studentId);

            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledWith(studentId);
            expect(result.data).toHaveLength(10);
            expect(result.page).toBe(2);
            expect(result.totalPages).toBe(3);
            expect(result.hasNext).toBe(true);
            expect(result.hasPrev).toBe(true);
        });

        it('should apply sorting when sort parameter is provided', async () => {
            const postIds = [
                new Types.ObjectId('507f1f77bcf86cd799439011'),
                new Types.ObjectId('507f1f77bcf86cd799439012'),
            ];
            const mockPosts = [
                createMockPost({ _id: postIds[1], title: 'B Post' }),
                createMockPost({ _id: postIds[0], title: 'A Post' }),
            ];
            const paginationResult = {
                data: mockPosts,
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue(postIds);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAllByStudent({ page: 1, limit: 10, sort: '-title' } as any, studentId);

            expect(mockApplicationService.getPostIdsByStudent).toHaveBeenCalledWith(studentId);
            expect(mockPaginationService.paginate).toHaveBeenCalledTimes(1);
            expect(result.data).toHaveLength(2);
        });

        it('should populate company fields in returned posts', async () => {
            const postIds = [new Types.ObjectId('507f1f77bcf86cd799439011')];
            const mockPosts = [createMockPost({ _id: postIds[0] })];
            const paginationResult = {
                data: mockPosts,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockApplicationService.getPostIdsByStudent.mockResolvedValue(postIds);
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            await service.findAllByStudent({ page: 1, limit: 10 } as any, studentId);

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                expect.anything(),
                expect.anything(),
                1,
                10,
                [
                    {
                        path: 'company',
                        select: '_id name siretNumber nafCode structureType legalStatus address logo location',
                    },
                ],
                expect.anything(),
            );
        });
    });
});
