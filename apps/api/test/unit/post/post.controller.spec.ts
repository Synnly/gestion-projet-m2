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
        it('should return an array of posts when findAll is called', async () => {
            const mockPosts = [mockPost];
            mockPostService.findAll.mockResolvedValue(mockPosts);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Développeur Full Stack');
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when no posts exist and findAll is called', async () => {
            mockPostService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toHaveLength(0);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return multiple posts when multiple posts exist and findAll is called', async () => {
            const mockPosts = [
                mockPost,
                {
                    ...mockPost,
                    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
                    title: 'Développeur Backend',
                },
            ];
            mockPostService.findAll.mockResolvedValue(mockPosts);

            const result = await controller.findAll();

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Développeur Full Stack');
            expect(result[1].title).toBe('Développeur Backend');
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
            await expect(controller.findOne(validObjectId)).rejects.toThrow(
                `Post with id ${validObjectId} not found`,
            );
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
        const mockRequest = { user: { sub: '507f1f77bcf86cd799439099' } };
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

        it('should create a post when valid dto is provided and create is called', async () => {
            mockPostService.create.mockResolvedValue(mockPost);

            await controller.create(mockRequest as any, validCreatePostDto);

            expect(service.create).toHaveBeenCalledWith(validCreatePostDto, mockRequest.user.sub);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalDto: CreatePostDto = {
                title: 'Titre minimal',
                description: 'Description minimale',
                keySkills: ['Compétence1'],
            };
            mockPostService.create.mockResolvedValue({ ...mockPost, ...minimalDto });

            await controller.create(mockRequest as any, minimalDto);

            expect(service.create).toHaveBeenCalledWith(minimalDto, mockRequest.user.sub);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create a post with all optional fields when create is called', async () => {
            mockPostService.create.mockResolvedValue(mockPost);

            await controller.create(mockRequest as any, validCreatePostDto);

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
                mockRequest.user.sub,
            );
        });
    });
});
