import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from '../../../src/post/post.controller';
import { PostService } from '../../../src/post/post.service';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatePostDto } from '../../../src/post/dto/createPost.dto';
import { PostType } from '../../../src/post/post.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('PostController', () => {
    let controller: PostController;
    let service: PostService;

    const mockPostService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findAllByStudent: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockPost = {
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostController],
            providers: [
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        controller = module.get<PostController>(PostController);
        service = module.get<PostService>(PostService);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        const mockRequest = {
            user: {
                sub: 'someUserId',
            },
        };

        it('should return a paginated result of posts when findAll is called', async () => {
            const paginationResult = {
                data: [mockPost],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockPostService.findAll.mockResolvedValue(paginationResult);

            const result = await controller.findAll({ page: 1, limit: 10 } as any, mockRequest as any);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(result.total).toBe(1);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return an empty paginated result when no posts exist and findAll is called', async () => {
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };
            mockPostService.findAll.mockResolvedValue(paginationResult);

            const result = await controller.findAll({ page: 1, limit: 10 } as any, mockRequest as any);

            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return multiple posts in paginated result when multiple posts exist and findAll is called', async () => {
            const mockPosts = [
                mockPost,
                {
                    ...mockPost,
                    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                    title: 'Développeur Backend',
                },
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
            mockPostService.findAll.mockResolvedValue(paginationResult);

            const result = await controller.findAll({ page: 1, limit: 10 } as any, mockRequest as any);

            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(result.data[1].title).toBe('Développeur Backend');
            expect(result.total).toBe(2);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });
    });

    describe('findOne', () => {
        const validObjectId = '507f1f77bcf86cd799439011';

        it('should return a post when valid id is provided and findOne is called', async () => {
            mockPostService.findOne.mockResolvedValue(mockPost);

            const result = await controller.findOne(validObjectId);

            expect(result.title).toBe('Développeur Full Stack');
            expect(result._id.toHexString()).toBe(validObjectId);
            expect(service.findOne).toHaveBeenCalledWith(validObjectId);
            expect(service.findOne).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when post is not found and findOne is called', async () => {
            mockPostService.findOne.mockResolvedValue(null);

            await expect(controller.findOne(validObjectId)).rejects.toThrow(NotFoundException);
            await expect(controller.findOne(validObjectId)).rejects.toThrow(`Post with id ${validObjectId} not found`);
            expect(service.findOne).toHaveBeenCalledWith(validObjectId);
        });

        it('should return correct post data when post exists and findOne is called', async () => {
            mockPostService.findOne.mockResolvedValue(mockPost);

            const result = await controller.findOne(validObjectId);

            expect(result.description).toBe('Nous recherchons un développeur full stack expérimenté');
            expect(result.duration).toBe('6 mois');
            expect(result.minSalary).toBe(2000);
            expect(result.maxSalary).toBe(3000);
            expect(result.keySkills).toEqual(['JavaScript', 'TypeScript', 'React', 'Node.js']);
        });
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

        it('should create a post when valid dto is provided and create is called', async () => {
            mockPostService.create.mockResolvedValue(mockPost);

            await controller.create(companyId, validCreatePostDto);

            expect(service.create).toHaveBeenCalledWith(validCreatePostDto, companyId);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalDto: CreatePostDto = {
                title: 'Titre minimal',
                description: 'Description minimale',
                keySkills: ['Compétence1'],
                isCoverLetterRequired: false,
            };
            mockPostService.create.mockResolvedValue({ ...mockPost, ...minimalDto });

            await controller.create(companyId, minimalDto);

            expect(service.create).toHaveBeenCalledWith(minimalDto, companyId);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create a post with all optional fields when create is called', async () => {
            mockPostService.create.mockResolvedValue(mockPost);

            await controller.create(companyId, validCreatePostDto);

            expect(service.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: validCreatePostDto.title,
                    description: validCreatePostDto.description,
                    duration: validCreatePostDto.duration,
                    startDate: validCreatePostDto.startDate,
                    minSalary: validCreatePostDto.minSalary,
                    maxSalary: validCreatePostDto.maxSalary,
                    sector: validCreatePostDto.sector,
                    keySkills: validCreatePostDto.keySkills,
                    adress: validCreatePostDto.adress,
                    type: validCreatePostDto.type,
                }),
                companyId,
            );
        });
    });

    describe('update', () => {
        const companyId = '507f1f77bcf86cd799439099';
        const postId = '507f1f77bcf86cd799439011';

        it('should return updated PostDto when update succeeds', async () => {
            const updated = { ...mockPost, title: 'Updated' };
            mockPostService.update.mockResolvedValue(updated);

            const result = await controller.update(companyId, postId, { title: 'Updated' } as any);

            expect(mockPostService.update).toHaveBeenCalledWith({ title: 'Updated' }, companyId, postId);
            expect(result.title).toBe('Updated');
        });

        it('should propagate NotFoundException from service', async () => {
            mockPostService.update.mockRejectedValue(new NotFoundException('not found'));

            await expect(controller.update(companyId, postId, { title: 'x' } as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findAllWithApplications', () => {
        const studentId = '507f1f77bcf86cd799439088';
        const mockRequest = {
            user: {
                sub: studentId,
            },
        };

        it('should return paginated posts when student has applications', async () => {
            const mockPosts = [
                mockPost,
                {
                    ...mockPost,
                    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                    title: 'Développeur Backend',
                },
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

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 1, limit: 10 } as any, mockRequest);

            expect(service.findAllByStudent).toHaveBeenCalledWith({ page: 1, limit: 10 }, studentId);
            expect(service.findAllByStudent).toHaveBeenCalledTimes(1);
            expect(result.data).toHaveLength(2);
            expect(result.data[0].title).toBe('Développeur Full Stack');
            expect(result.data[1].title).toBe('Développeur Backend');
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

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 1, limit: 10 } as any, mockRequest);

            expect(service.findAllByStudent).toHaveBeenCalledWith({ page: 1, limit: 10 }, studentId);
            expect(result.data).toHaveLength(0);
            expect(result.total).toBe(0);
        });

        it('should pass correct student ID from request to service', async () => {
            const customStudentId = '507f1f77bcf86cd799439099';
            const customRequest = {
                user: {
                    sub: customStudentId,
                },
            };
            const paginationResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            await controller.findAllWithApplications({ page: 1, limit: 10 } as any, customRequest);

            expect(service.findAllByStudent).toHaveBeenCalledWith({ page: 1, limit: 10 }, customStudentId);
        });

        it('should handle pagination correctly with multiple pages', async () => {
            const mockPosts = [mockPost];
            const paginationResult = {
                data: mockPosts,
                total: 25,
                page: 2,
                limit: 10,
                totalPages: 3,
                hasNext: true,
                hasPrev: true,
            };

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 2, limit: 10 } as any, mockRequest);

            expect(service.findAllByStudent).toHaveBeenCalledWith({ page: 2, limit: 10 }, studentId);
            expect(result.page).toBe(2);
            expect(result.totalPages).toBe(3);
            expect(result.hasNext).toBe(true);
            expect(result.hasPrev).toBe(true);
        });

        it('should return PostDto instances when posts are found', async () => {
            const paginationResult = {
                data: [mockPost],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 1, limit: 10 } as any, mockRequest);

            expect(result.data[0]).toHaveProperty('title');
            expect(result.data[0]).toHaveProperty('description');
            expect(result.data[0]).toHaveProperty('keySkills');
            expect(result.data[0]._id).toBeDefined();
        });

        it('should handle custom page size', async () => {
            const paginationResult = {
                data: [mockPost],
                total: 50,
                page: 1,
                limit: 25,
                totalPages: 2,
                hasNext: true,
                hasPrev: false,
            };

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 1, limit: 25 } as any, mockRequest);

            expect(service.findAllByStudent).toHaveBeenCalledWith({ page: 1, limit: 25 }, studentId);
            expect(result.limit).toBe(25);
        });

        it('should preserve all pagination metadata', async () => {
            const paginationResult = {
                data: [mockPost],
                total: 15,
                page: 2,
                limit: 5,
                totalPages: 3,
                hasNext: true,
                hasPrev: true,
            };

            mockPostService.findAllByStudent.mockResolvedValue(paginationResult);

            const result = await controller.findAllWithApplications({ page: 2, limit: 5 } as any, mockRequest);

            expect(result.total).toBe(15);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(5);
            expect(result.totalPages).toBe(3);
            expect(result.hasNext).toBe(true);
            expect(result.hasPrev).toBe(true);
        });
    });
});
