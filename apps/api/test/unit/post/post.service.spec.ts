import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PostService } from '../../../src/post/post.service';
import { Post } from '../../../src/post/post.schema';
import { CreatePostDto } from '../../../src/post/dto/createPost.dto';
import { PostType } from '../../../src/post/post.schema';
import { PaginationService } from '../../../src/common/pagination/pagination.service';

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
        constructor: jest.fn(),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
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
        };

        it('should create a new post when valid dto is provided and create is called', async () => {
            const savedPost = { ...mockPost, save: jest.fn().mockResolvedValue(mockPost) };
            jest.spyOn(model, 'constructor' as any).mockReturnValue(savedPost);

            // Mock the constructor using Object.setPrototypeOf
            const mockSave = jest.fn().mockResolvedValue(mockPost);
            const postInstance = {
                ...validCreatePostDto,
                save: mockSave,
            };

            // We need to mock the model instantiation
            (model as any) = jest.fn().mockReturnValue(postInstance);
            const serviceWithMock = new PostService(model);

            const result = await serviceWithMock.create(validCreatePostDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockPost);
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalDto: CreatePostDto = {
                title: 'Titre minimal',
                description: 'Description minimale',
                keySkills: ['Compétence1'],
            };

            const mockSave = jest.fn().mockResolvedValue({ ...mockPost, ...minimalDto });
            const postInstance = {
                ...minimalDto,
                save: mockSave,
            };

            (model as any) = jest.fn().mockReturnValue(postInstance);
            const serviceWithMock = new PostService(model);

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

            (model as any) = jest.fn().mockReturnValue(postInstance);
            const serviceWithMock = new PostService(model);

            const result = await serviceWithMock.create(validCreatePostDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('minSalary');
            expect(result).toHaveProperty('maxSalary');
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

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(result.total).toBe(1);
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
            expect(populateMock).toHaveBeenCalledWith('company');
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
});
