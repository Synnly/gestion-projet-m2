import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from '../../../src/post/post.controller';
import { PostService } from '../../../src/post/post.service';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PostType } from '../../../src/post/post.schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../../../src/auth/auth.guard'; // Ajuste les imports si besoin
import { RolesGuard } from '../../../src/common/roles/roles.guard';

describe('PostController', () => {
    let controller: PostController;
    let service: PostService;

    const mockPostService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
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
        })
        .overrideGuard(AuthGuard).useValue({ canActivate: () => true })
        .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
        .compile();

        controller = module.get<PostController>(PostController);
        service = module.get<PostService>(PostService);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
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

            const result = await controller.findAll({ page: 1, limit: 10 } as any);

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

            const result = await controller.findAll({ page: 1, limit: 10 } as any);

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

            const result = await controller.findAll({ page: 1, limit: 10 } as any);

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

    describe('remove', () => {
        const validObjectId = '507f1f77bcf86cd799439011';

        it('should call service.remove with correct id', async () => {
            mockPostService.remove.mockResolvedValue(undefined);

            await controller.remove(validObjectId);

            expect(service.remove).toHaveBeenCalledWith(validObjectId);
            expect(service.remove).toHaveBeenCalledTimes(1);
        });
    });
});