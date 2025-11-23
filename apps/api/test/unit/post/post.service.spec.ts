import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';

import { PostService } from '../../../src/post/post.service';
import { Post } from '../../../src/post/post.schema';
import { CreatePostDto } from '../../../src/post/dto/createPost.dto';
import { PostType } from '../../../src/post/post.schema';
import { Company, LegalStatus, StructureType } from '../../../src/company/company.schema';
import { CreateCompanyDto } from '../../../src/company/dto/createCompany.dto';
import { NafCode } from '../../../src/company/nafCodes.enum';
import { Role } from '../../../src/common/roles/roles.enum';

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
    return {
        ...basePost,
        ...overrides,
    };
};

describe('PostService', () => {
    let service: PostService;

    // We define mockPostModel as a function (to act as a constructor)
    const mockPostModel = jest.fn();

    // Next, we attach static methods to the function
    (mockPostModel as any).find = jest.fn();
    (mockPostModel as any).findOne = jest.fn();
    (mockPostModel as any).findById = jest.fn();

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'SOFT_DELETE_RETENTION_DAYS') return 30;
            return null;
        }),
    };

    const mockSchedulerRegistry = {
        addCronJob: jest.fn(),
        deleteCronJob: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
                { provide: getModelToken(Post.name), useValue: mockPostModel },
                { provide: getModelToken(Company.name), useValue: mockCompanyModel },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        jest.clearAllMocks();
    });

    it('should be defined when service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        const companyId = '507f1f77bcf86cd799439099';

        const validCreateCompanyDto: CreateCompanyDto = {
            email: "company1@example.com",
            password: "Company123!",
            name: "Tech Innov Germany",
            siretNumber: "12345678901234",
            nafCode: NafCode.NAF_01_11Z,
            structureType: StructureType.PrivateCompany,
            legalStatus: LegalStatus.SAS,
            streetNumber: "42",
            streetName: "Avenue du Progrès",
            postalCode: "75010",
            city: "Berlin",
            country: "Germany",
            role: Role.COMPANY,
            posts: []
        };

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

        it('should throw NotFoundException if the company does not exist', async () => {
            mockCompanyModel.findOne.mockResolvedValue(null);

            await expect(service.create(validCreatePostDto, companyId))
                .rejects
                .toThrow(NotFoundException);
            
            expect(mockPostModel).not.toHaveBeenCalled();
        });

        it('should create a new post when valid dto is provided and create is called', async () => {
            // Mock company existence
            mockCompanyModel.findOne.mockResolvedValue({ 
                _id: companyId, 
                ...validCreateCompanyDto,
            });

            // Mock the final populated result
            const finalPost = createMockPost();
            const execMock = jest.fn().mockResolvedValue(finalPost);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });

            // Mock static findById used for population
            (mockPostModel as any).findById.mockReturnValue({ populate: populateMock });

            // Mock the save method on the instance
            const mockSave = jest.fn().mockResolvedValue(basePost);
            
            // Mock the constructor implementation
            mockPostModel.mockImplementation((dto: any) => ({
                ...dto,
                save: mockSave
            }));

            // --- Action ---
            const result = await service.create(validCreatePostDto, companyId);

            // --- Verifications ---
            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(mockPostModel).toHaveBeenCalledWith(expect.objectContaining({
                ...validCreatePostDto,
            }));
            expect(result).toEqual(finalPost);
        });

        it('should create a post with minimal required fields when create is called', async () => {
            const minimalDto: CreatePostDto = {
                title: 'Titre minimal',
                description: 'Description minimale',
                keySkills: ['Compétence1'],
            };

            // Mock company existence
            mockCompanyModel.findOne.mockResolvedValue({ _id: companyId });

            // Mock the final result
            const finalPost = createMockPost({ ...minimalDto });
            const execMock = jest.fn().mockResolvedValue(finalPost);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            (mockPostModel as any).findById.mockReturnValue({ populate: populateMock });

            // Mock the constructor
            const mockSave = jest.fn().mockResolvedValue(finalPost);
            mockPostModel.mockImplementation((dto: any) => ({
                ...dto,
                save: mockSave
            }));

            const result = await service.create(minimalDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result.title).toBe('Titre minimal');
            expect(result.description).toBe('Description minimale');
        });

        it('should create a post with all optional fields when create is called', async () => {
            // Mock company existence
            mockCompanyModel.findOne.mockResolvedValue({ _id: companyId });

            // Mock the final result
            const finalPost = createMockPost();
            const execMock = jest.fn().mockResolvedValue(finalPost);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            (mockPostModel as any).findById.mockReturnValue({ populate: populateMock });

            // Mock the constructor
            const mockSave = jest.fn().mockResolvedValue(basePost);
            mockPostModel.mockImplementation((dto: any) => ({
                ...dto,
                save: mockSave
            }));

            const result = await service.create(validCreatePostDto, companyId);

            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(result).toHaveProperty('duration');
            expect(result).toHaveProperty('startDate');
            expect(result).toHaveProperty('minSalary');
            expect(result).toHaveProperty('maxSalary');
        });
    });

    describe('findAll', () => {
        it('should return an array of posts when findAll is called', async () => {
            const mockPosts = [createMockPost()];
            const execMock = jest.fn().mockResolvedValue(mockPosts);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            
            // Use static method on function mock
            (mockPostModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Développeur Full Stack');
            expect((mockPostModel as any).find).toHaveBeenCalledTimes(1);
            expect(populateMock).toHaveBeenCalledWith({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            });
            expect(execMock).toHaveBeenCalledTimes(1);
        });

        it('should return an empty array when no posts exist and findAll is called', async () => {
            const execMock = jest.fn().mockResolvedValue([]);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            (mockPostModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toHaveLength(0);
            expect((mockPostModel as any).find).toHaveBeenCalledTimes(1);
        });

        it('should return multiple posts when multiple posts exist and findAll is called', async () => {
            const mockPosts = [
                createMockPost(),
                createMockPost({ _id: new Types.ObjectId('507f1f77bcf86cd799439012'), title: 'Développeur Backend' }),
                createMockPost({ _id: new Types.ObjectId('507f1f77bcf86cd799439013'), title: 'Développeur Frontend' }),
            ];
            const execMock = jest.fn().mockResolvedValue(mockPosts);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            (mockPostModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toHaveLength(3);
            expect(result[0].title).toBe('Développeur Full Stack');
            expect(result[1].title).toBe('Développeur Backend');
            expect(result[2].title).toBe('Développeur Frontend');
        });
    });

    describe('findOne', () => {
        const validObjectId = '507f1f77bcf86cd799439011';

        it('should return a post when valid id is provided and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            
            // We configure the mock for the findOne method specificaly
            (mockPostModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeDefined();
            expect(result?.title).toBe('Développeur Full Stack');
            
            // Important: we check that deleted posts are being filtered
            expect((mockPostModel as any).findOne).toHaveBeenCalledWith({ 
                _id: validObjectId, 
                deletedAt: { $exists: false } 
            });
            
            expect(populateMock).toHaveBeenCalledWith({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            });
            expect(execMock).toHaveBeenCalledTimes(1);
        });

        it('should return null when post is not found and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(null);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            
            (mockPostModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeNull();
            expect((mockPostModel as any).findOne).toHaveBeenCalledWith({ 
                _id: validObjectId, 
                deletedAt: { $exists: false } 
            });
        });

        it('should return correct post data when post exists and findOne is called', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            
            (mockPostModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOne(validObjectId);

            expect(result).toBeDefined();
            expect(result?.description).toBe('Nous recherchons un développeur full stack expérimenté');
            expect(result?.minSalary).toBe(2000);
        });
    });


    describe('findAllByCompany', () => {
        const companyId = '507f1f77bcf86cd799439099';

        it('should return posts belonging to the specified company', async () => {
            const mockPosts = [createMockPost(), createMockPost({ title: 'Autre poste' })];
            const execMock = jest.fn().mockResolvedValue(mockPosts);
            
            (mockPostModel as any).find.mockReturnValue({ exec: execMock });

            const result = await service.findAllByCompany(companyId);

            expect(result).toHaveLength(2);
            expect((mockPostModel as any).find).toHaveBeenCalledWith({
                companyId: new Types.ObjectId(companyId),
                deletedAt: { $exists: false }
            });
            expect(execMock).toHaveBeenCalledTimes(1);
        });

        it('should return empty array if company has no posts', async () => {
            const execMock = jest.fn().mockResolvedValue([]);
            
            (mockPostModel as any).find.mockReturnValue({ exec: execMock });

            const result = await service.findAllByCompany(companyId);

            expect(result).toHaveLength(0);
        });
    });

    describe('remove', () => {
        const postId = '507f1f77bcf86cd799439011';

        it('should soft delete a post by updating deletedAt', async () => {
            (mockPostModel as any).findOneAndUpdate = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(createMockPost())
            });

            await service.remove(postId);

            expect((mockPostModel as any).findOneAndUpdate).toHaveBeenCalledWith(
                { _id: postId, deletedAt: { $exists: false } },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should throw NotFoundException if post to delete is not found', async () => {
             (mockPostModel as any).findOneAndUpdate = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            await expect(service.remove(postId))
                .rejects
                .toThrow(NotFoundException);
        });
    });

    describe('deleteExpiredPosts (Cron)', () => {
        it('should delete posts older than retention days', async () => {
            (mockPostModel as any).deleteMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 5 })
            });

            await service.deleteExpired();

            expect((mockPostModel as any).deleteMany).toHaveBeenCalledWith({
                deletedAt: { $lte: expect.any(Date) }
            });
            
            expect(mockConfigService.get).toHaveBeenCalledWith('SOFT_DELETE_RETENTION_DAYS', 30);
        });

        it('should handle case with 0 deleted posts without error', async () => {
            (mockPostModel as any).deleteMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 0 })
            });

            await expect(service.deleteExpired()).resolves.not.toThrow();
        });
    });

    describe('removeAllByCompany', () => {
        const companyId = '507f1f77bcf86cd799439099';

        it('should soft-delete all posts linked to a company', async () => {
            (mockPostModel as any).updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 10 })
            });

            await service.removeAllByCompany(companyId);

            expect((mockPostModel as any).updateMany).toHaveBeenCalledWith(
                { 
                    company: new Types.ObjectId(companyId), 
                    deletedAt: { $exists: false } 
                },
                { $set: { deletedAt: expect.any(Date) } }
            );
        });
    });

    describe('findOneEvenIfDeleted', () => {
        const validObjectId = '507f1f77bcf86cd799439011';

        it('should return a post (even if deleted) without filtering deletedAt', async () => {
            const execMock = jest.fn().mockResolvedValue(createMockPost());
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            
            // We configure findOne
            (mockPostModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOneEvenIfDeleted(validObjectId);

            expect(result).toBeDefined();
            // Important : We check that findOne is called with only the id (no "deletedAt: { $exists: false }")
            expect((mockPostModel as any).findOne).toHaveBeenCalledWith({ 
                _id: validObjectId 
            });
            expect(execMock).toHaveBeenCalledTimes(1);
        });

        it('should return null if post absolutely does not exist', async () => {
            const execMock = jest.fn().mockResolvedValue(null);
            const populateMock = jest.fn().mockReturnValue({ exec: execMock });
            (mockPostModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOneEvenIfDeleted(validObjectId);

            expect(result).toBeNull();
        });
    });

    describe('findAllByCompanyEvenIfDeleted', () => {
        const companyId = '507f1f77bcf86cd799439099';

        it('should return all posts for a company including deleted ones', async () => {
            const mockPosts = [createMockPost(), createMockPost({ title: 'Post supprimé', deletedAt: new Date() })];
            const execMock = jest.fn().mockResolvedValue(mockPosts);
            
            (mockPostModel as any).find.mockReturnValue({ exec: execMock });

            await service.findAllByCompanyEvenIfDeleted(companyId);

            expect((mockPostModel as any).find).toHaveBeenCalledWith({
                company: new Types.ObjectId(companyId)
            });
        });
    });
});