import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CompanyService } from '../../../src/company/company.service';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { Company, CompanyDocument, StructureType, LegalStatus } from '../../../src/company/company.schema';
import { CreateCompanyDto } from '../../../src/company/dto/createCompany.dto';
import { UpdateCompanyDto } from '../../../src/company/dto/updateCompany.dto';
import { NafCode } from '../../../src/company/nafCodes.enum';
import { PostService } from '../../../src/post/post.service';
import { ForumService } from '../../../src/forum/forum.service';
import { NotificationService } from '../../../src/notification/notification.service';
import { Post } from '../../../src/post/post.schema';
import { Application } from '../../../src/application/application.schema';
import { Forum } from '../../../src/forum/forum.schema';
import { Topic } from '../../../src/forum/topic/topic.schema';
import { Message } from '../../../src/forum/message/message.schema';
import { GeoService } from '../../../src/common/geography/geo.service';
import { RefreshToken } from '../../../src/auth/refreshToken.schema';
import { Notification } from '../../../src/notification/notification.schema';

describe('CompanyService', () => {
    let service: CompanyService;
    let model: Model<CompanyDocument>;

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        updateOne: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        db: {
            startSession: jest.fn(),
        },
    };

    const mockPostModel = {
        find: jest.fn(),
        deleteMany: jest.fn(),
    };

    const mockApplicationModel = {
        find: jest.fn(),
        deleteMany: jest.fn(),
    };

    const mockForumModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        deleteMany: jest.fn(),
        updateOne: jest.fn(),
    };

    const mockTopicModel = {
        find: jest.fn(),
        deleteMany: jest.fn(),
    };

    const mockMessageModel = {
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
    };

    const mockExec = jest.fn();
    const mockPostService = {
        findOne: jest.fn(),
        delete: jest.fn(),
    };
    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockForumService = {
        create: jest.fn(),
        findOneByCompanyId: jest.fn(),
    };

    const mockNotificationService = {
        create: jest.fn(),
    };

    const mockNotificationModel = {
        updateMany: jest.fn(),
    };

    const mockRefreshTokenModel = {
        updateOne: jest.fn(),
        updateMany: jest.fn(),
    };

    const mockGeoService = {
        geocodeAddress: jest.fn().mockResolvedValue([2.3522, 48.8566]),
    };

    const setupFindOnePopulate = () => {
        const populate = jest.fn().mockReturnValue({ exec: mockExec });
        mockCompanyModel.findOne.mockReturnValue({ populate });
        return populate;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompanyService,
                {
                    provide: getModelToken(Company.name),
                    useValue: mockCompanyModel,
                },
                {
                    provide: getModelToken(Post.name),
                    useValue: mockPostModel,
                },
                {
                    provide: getModelToken(Application.name),
                    useValue: mockApplicationModel,
                },
                {
                    provide: getModelToken(Forum.name),
                    useValue: mockForumModel,
                },
                {
                    provide: getModelToken(Topic.name),
                    useValue: mockTopicModel,
                },
                {
                    provide: getModelToken(Message.name),
                    useValue: mockMessageModel,
                },
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
                {
                    provide: ForumService,
                    useValue: mockForumService,
                },
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
                {
                    provide: GeoService,
                    useValue: mockGeoService,
                },
                {
                    provide: getModelToken(Notification.name),
                    useValue: mockNotificationModel,
                },
                {
                    provide: getModelToken(RefreshToken.name),
                    useValue: mockRefreshTokenModel,
                },
            ],
        }).compile();

        service = module.get<CompanyService>(CompanyService);
        model = module.get<Model<CompanyDocument>>(getModelToken(Company.name));

        jest.clearAllMocks();

        mockNotificationModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
        mockRefreshTokenModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
        mockRefreshTokenModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
        mockPostService.delete.mockResolvedValue(undefined);
        mockForumService.findOneByCompanyId.mockResolvedValue(null);
    });

    it('should be defined when service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated companies', async () => {
            const paginationResult = {
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        email: 'test@example.com',
                        password: 'hashedPassword',
                        name: 'Test Company',
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };
            mockPaginationService.paginate.mockResolvedValue(paginationResult);

            const result = await service.findAll({ page: 1, limit: 10 } as any);

            expect(result).toEqual(paginationResult);
            expect(result.data).toHaveLength(1);
            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                expect.anything(),
                expect.any(Object), // filters
                1,
                10,
                expect.any(Array), // populate
                expect.anything(), // sort
            );
        });

        it('should return empty result when no companies found', async () => {
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
    });

    describe('findOne', () => {
        it('should return a company by id when findOne is called with an existing id', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
            };

            mockExec.mockResolvedValue(company);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
            expect(mockCompanyModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('should return null when findOne is called with a non-existent id', async () => {
            mockExec.mockResolvedValue(null);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439999');

            expect(result).toBeNull();
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439999',
                deletedAt: { $exists: false },
            });
        });

        it('should return null when findOne is called for a deleted company', async () => {
            mockExec.mockResolvedValue(null);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeNull();
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
        });

        it('should return company with all optional fields when findOne finds a full document', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
                siretNumber: '12345678901234',
                nafCode: NafCode.NAF_62_02A,
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                address: '10 Rue de Test, 75001 Paris, France',
            };

            mockExec.mockResolvedValue(company);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect(result?.siretNumber).toBe('12345678901234');
            expect(result?.structureType).toBe(StructureType.PrivateCompany);
        });

        it('should return company with minimal fields when findOne finds a minimal document', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
            };

            mockExec.mockResolvedValue(company);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect(result?.siretNumber).toBeUndefined();
        });

        it('should throw when findOne encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            setupFindOnePopulate();

            await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect(mockCompanyModel.findOne).toHaveBeenCalledTimes(1);
        });

        it('should handle different id formats when findOne is called with various ids', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id, email: 'test@example.com', name: 'Test' });
                setupFindOnePopulate();

                await service.findOne(id);

                expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                    _id: id,
                    deletedAt: { $exists: false },
                });
            }
        });
    });

    describe('create', () => {
        it('should create a company when create is called with minimal required fields', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledTimes(1);
            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(
                expect.objectContaining({
                    email: createDto.email,
                    name: createDto.name,
                }),
            );
            expect(mockForumService.create).not.toHaveBeenCalled();
            expect(typeof createdArg.password).toBe('string');
            // Password hashing is handled by User schema pre-save hook, not tested in unit tests with mocks
        });

        it('should create a company when create is called with all fields provided', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
                siretNumber: '12345678901234',
                nafCode: NafCode.NAF_62_02A,
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                address: '10 Rue de Test, 75001 Paris, France',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(
                expect.objectContaining({
                    email: createDto.email,
                    name: createDto.name,
                }),
            );
            // Password hashing is handled by User schema pre-save hook
        });

        it('should return void after successful creation when create resolves', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            const result = await service.create(createDto);

            expect(result).toBeUndefined();
            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            // Password hashing is handled by User schema pre-save hook
        });

        it('should create company with each StructureType when create is called for each enum value', async () => {
            for (const structureType of Object.values(StructureType)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${structureType}@example.com`,
                    password: 'Password123!',
                    name: `Test ${structureType}`,
                    structureType: structureType,
                });

                mockCompanyModel.create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                const createdArg = mockCompanyModel.create.mock.calls[mockCompanyModel.create.mock.calls.length - 1][0];
                expect(createdArg).toEqual(expect.objectContaining({ structureType }));
                // Password hashing is handled by User schema pre-save hook
            }
        });

        it('should create company with each LegalStatus when create is called for each enum value', async () => {
            for (const legalStatus of Object.values(LegalStatus)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${legalStatus}@example.com`,
                    password: 'Password123!',
                    name: `Test ${legalStatus}`,
                    legalStatus: legalStatus,
                });

                mockCompanyModel.create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                const createdArg = mockCompanyModel.create.mock.calls[mockCompanyModel.create.mock.calls.length - 1][0];
                expect(createdArg).toEqual(expect.objectContaining({ legalStatus }));
                // Password hashing is handled by User schema pre-save hook
            }
        });

        it('should throw when create encounters a database error', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            const error = new Error('Duplicate key error');
            mockCompanyModel.create.mockRejectedValue(error);

            await expect(service.create(createDto)).rejects.toThrow('Duplicate key error');
            expect(mockCompanyModel.create).toHaveBeenCalledTimes(1);
        });

        it('should throw when create encounters validation errors', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            const error = new Error('Validation error');
            mockCompanyModel.create.mockRejectedValue(error);

            await expect(service.create(createDto)).rejects.toThrow('Validation error');
        });

        it('should create company when create is called with a complete address', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
                address: '10 Rue de Test, 75001 Paris, France',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(
                expect.objectContaining({
                    address: createDto.address,
                }),
            );
            // Password hashing is handled by User schema pre-save hook
        });
    });

    describe('update', () => {
        it('should create a forum when company is validated for the first time', async () => {
            const updateDto = new UpdateCompanyDto({
                isValid: true,
            });

            const mockCompany = {
                _id: '507f1f77bcf86cd799439011',
                isValid: false,
                save: jest.fn().mockResolvedValue(true),
                rejected: {},
            };

            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            expect(mockForumService.findOneByCompanyId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockForumService.create).toHaveBeenCalledWith(mockCompany._id);
        });

        it('should not create a forum when re-validating a company that already has one', async () => {
            const updateDto = new UpdateCompanyDto({
                isValid: true,
            });

            const mockCompany = {
                _id: '507f1f77bcf86cd799439011',
                isValid: false,
                save: jest.fn().mockResolvedValue(true),
            };

            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });
            mockForumService.findOneByCompanyId.mockResolvedValue({ _id: 'forum-id', rejected: {} });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            expect(mockForumService.findOneByCompanyId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(mockForumService.create).not.toHaveBeenCalled();
        });

        it('should not create a forum when company is already valid', async () => {
            const updateDto = new UpdateCompanyDto({
                isValid: true,
            });

            const mockCompany = {
                _id: '507f1f77bcf86cd799439011',
                isValid: true,
                save: jest.fn().mockResolvedValue(true),
            };

            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            expect(mockForumService.create).not.toHaveBeenCalled();
        });

        it('should validate provided post ids and update when posts are valid', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
                posts: ['507f1f77bcf86cd799439100'],
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            // postService.findOne resolves to a post -> validation passes
            mockPostService.findOne.mockResolvedValue({ _id: '507f1f77bcf86cd799439100' } as any);

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockPostService.findOne).toHaveBeenCalledTimes(1);
            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should throw BadRequestException when postService.findOne throws for a post id', async () => {
            const updateDto = new UpdateCompanyDto({ posts: ['invalid-id'] });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            mockPostService.findOne.mockImplementationOnce(() => {
                throw new Error('Invalid post id');
            });

            await expect(service.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException when a provided post id does not exist', async () => {
            const updateDto = new UpdateCompanyDto({ posts: ['507f1f77bcf86cd799439199'] });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            mockPostService.findOne.mockResolvedValue(null);

            await expect(service.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow(NotFoundException);
        });
        it('should update a company when update is called with a single field', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const mockCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Old Company',
                save: jest.fn().mockResolvedValue(true),
            };

            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should update a company when update is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
                address: '10 Rue de Test, 75001 Paris, France',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should return void after successful update when findOneAndUpdate resolves', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            const result = await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(result).toBeUndefined();
        });

        it('should update company password when update is called with a new password', async () => {
            const updateDto = new UpdateCompanyDto({
                password: 'NewPassword123!',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            // Password hashing is handled by User schema pre-save hook
        });

        it('should update company structureType when update is called with a new structureType', async () => {
            const updateDto = new UpdateCompanyDto({
                structureType: StructureType.Association,
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should update company legalStatus when update is called with a new legalStatus', async () => {
            const updateDto = new UpdateCompanyDto({
                legalStatus: LegalStatus.SAS,
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should update company address fields when update is called with new address data', async () => {
            const updateDto = new UpdateCompanyDto({
                address: '10 Rue de Test, 75001 Paris, France',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should update all company fields when update is called with full update data', async () => {
            const updateDto = new UpdateCompanyDto({
                password: 'NewPassword123!',
                name: 'Fully Updated Company',
                nafCode: NafCode.NAF_62_02A,
                structureType: StructureType.NGO,
                legalStatus: LegalStatus.OTHER,
                address: '10 Rue de Test, 75001 Paris, France',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            // Service uses Object.assign + save(), User pre-save hook handles password hashing
        });

        it('should include updatedAt timestamp when update is performed', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            // updatedAt is set by Mongoose timestamps, not explicitly in service
        });

        it('should create a new company when update is attempted on a non-existent id (upsert)', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            // mock create to succeed
            mockCompanyModel.create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', ...updateDto });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.create).toHaveBeenCalledTimes(1);
            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            // ensure DTO fields were passed to create (we don't assert exact _id here)
            expect(createdArg).toEqual(expect.objectContaining({ name: updateDto.name }));
        });

        it('should throw when update encounters a database error', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await expect(service.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow('Database error');
        });

        it('should handle empty update DTO when update is called with empty data', async () => {
            const updateDto = new UpdateCompanyDto({});

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });

        it('should set new: true option when update is called', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        const COMPANY_ID = '507f1f77bcf86cd799439011';

        it('should soft-delete a company when remove is called with a valid id', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });

        it('should return void after successful soft-delete', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            const result = await service.remove(COMPANY_ID);

            expect(result).toBeUndefined();
        });

        it('should call findOneAndUpdate with the correct filter and $set payload', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: COMPANY_ID, deletedAt: { $exists: false } },
                expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
            );
        });

        it('should soft-delete related notifications after company is deleted', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
                { userId: COMPANY_ID },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should expire the refresh token after company is deleted', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
                { userId: COMPANY_ID },
                { $set: { expiresAt: expect.any(Date) } },
            );
        });

        it('should call postService.delete for each associated post', async () => {
            const postId1 = '507f1f77bcf86cd799430001';
            const postId2 = '507f1f77bcf86cd799430002';
            mockExec.mockResolvedValue({
                _id: COMPANY_ID,
                deletedAt: new Date(),
                posts: [{ toString: () => postId1 }, { toString: () => postId2 }],
            });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockPostService.delete).toHaveBeenCalledWith(postId1);
            expect(mockPostService.delete).toHaveBeenCalledWith(postId2);
            expect(mockPostService.delete).toHaveBeenCalledTimes(2);
        });

        it('should not call postService.delete when company has no posts', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date(), posts: [] });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockPostService.delete).not.toHaveBeenCalled();
        });

        it('should not call postService.delete when posts field is undefined', async () => {
            mockExec.mockResolvedValue({ _id: COMPANY_ID, deletedAt: new Date() });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(COMPANY_ID);

            expect(mockPostService.delete).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when company does not exist or is already deleted', async () => {
            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(NotFoundException);
            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(
                'Company not found or already deleted',
            );
        });

        it('should throw when remove encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await expect(service.remove(COMPANY_ID)).rejects.toThrow('Database error');
            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });

        it('should soft-delete companies with different ids', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id, deletedAt: new Date(), posts: [] });
                mockCompanyModel.findOneAndUpdate.mockReturnValue({ exec: mockExec });

                await service.remove(id);

                expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                    { _id: id, deletedAt: { $exists: false } },
                    expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
                );
            }
        });
    });

    describe('removeAll', () => {
        it('should resolve to undefined when there are no active companies', async () => {
            mockCompanyModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
            });

            await expect(service.removeAll()).resolves.toBeUndefined();
        });

        it('should call updateMany to soft-delete all companies', async () => {
            mockCompanyModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
            });

            await service.removeAll();

            expect(mockCompanyModel.updateMany).toHaveBeenCalledWith(
                { deletedAt: { $exists: false } },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should soft-delete notifications and refresh tokens when companies have posts', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const postId = '507f1f77bcf86cd799430001';
            mockCompanyModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([{ _id: { toString: () => companyId }, posts: [postId] }]),
            });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            });

            await service.removeAll();

            expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
                { userId: { $in: [companyId] } },
                { $set: { deletedAt: expect.any(Date) } },
            );
            expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
                { userId: { $in: [companyId] } },
                { $set: { expiresAt: expect.any(Date) } },
            );
        });

        it('should call postService.delete for every post of every company', async () => {
            const companyId1 = '507f1f77bcf86cd799439011';
            const companyId2 = '507f1f77bcf86cd799439012';
            const postId1 = '507f1f77bcf86cd799430001';
            const postId2 = '507f1f77bcf86cd799430002';
            const postId3 = '507f1f77bcf86cd799430003';

            mockCompanyModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([
                    { _id: { toString: () => companyId1 }, posts: [postId1, postId2] },
                    { _id: { toString: () => companyId2 }, posts: [postId3] },
                ]),
            });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
            });

            await service.removeAll();

            expect(mockPostService.delete).toHaveBeenCalledWith(postId1);
            expect(mockPostService.delete).toHaveBeenCalledWith(postId2);
            expect(mockPostService.delete).toHaveBeenCalledWith(postId3);
            expect(mockPostService.delete).toHaveBeenCalledTimes(3);
        });

        it('should not call notifications/refreshToken updateMany when no company has posts', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            mockCompanyModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([{ _id: { toString: () => companyId }, posts: [] }]),
            });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            });

            await service.removeAll();

            expect(mockNotificationModel.updateMany).not.toHaveBeenCalled();
            expect(mockRefreshTokenModel.updateMany).not.toHaveBeenCalled();
        });

        it('should not call postService.delete when no company has posts', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            mockCompanyModel.find.mockReturnValue({
                exec: jest.fn().mockResolvedValue([{ _id: { toString: () => companyId }, posts: [] }]),
            });
            mockCompanyModel.updateMany = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            });

            await service.removeAll();

            expect(mockPostService.delete).not.toHaveBeenCalled();
        });

        it('should throw when find encounters a database error', async () => {
            mockCompanyModel.find.mockReturnValue({
                exec: jest.fn().mockRejectedValue(new Error('Database error')),
            });

            await expect(service.removeAll()).rejects.toThrow('Database error');
        });
    });

    describe('Integration scenarios', () => {
        it('should create and then find the created company when create then findOne are called', async () => {
            const createDto = new CreateCompanyDto({
                email: 'integration@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Integration Company',
            });

            const createdCompany = {
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            };

            mockCompanyModel.create.mockResolvedValue(createdCompany);
            mockExec.mockResolvedValue(createdCompany);
            setupFindOnePopulate();

            await service.create(createDto);
            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(createdCompany);
        });

        it('should create, update, and verify the updated company when create and update are called sequentially', async () => {
            const createDto = new CreateCompanyDto({
                email: 'update-test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Update Test Company',
            });

            const updateDto = new UpdateCompanyDto({
                name: 'Updated Test Company',
            });

            mockCompanyModel.create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

            const updatedCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'update-test@example.com',
                name: 'Updated Test Company',
            };

            mockExec.mockResolvedValue(updatedCompany);
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.create(createDto);
            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });

        it('should verify company is removed from findAll after deletion when remove is called', async () => {
            const companiesBeforeDelete = {
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        email: 'delete-test@example.com',
                        name: 'Delete Test Company',
                    },
                    {
                        _id: '507f1f77bcf86cd799439012',
                        email: 'keep@example.com',
                        name: 'Keep Company',
                    },
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            const companiesAfterDelete = {
                data: [
                    {
                        _id: '507f1f77bcf86cd799439012',
                        email: 'keep@example.com',
                        name: 'Keep Company',
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            // findAll relies on paginationService, so we must mock paginate instead of model.find
            mockPaginationService.paginate
                .mockResolvedValueOnce(companiesBeforeDelete)
                .mockResolvedValueOnce(companiesAfterDelete);

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            const beforeDelete = await service.findAll({ page: 1, limit: 10 } as any);
            expect(beforeDelete.data).toHaveLength(2);

            await service.remove('507f1f77bcf86cd799439011');

            const afterDelete = await service.findAll({ page: 1, limit: 10 } as any);
            expect(afterDelete.data).toHaveLength(1);
        });
    });

    describe('Edge cases', () => {
        it('should return null when findOne returns null', async () => {
            mockExec.mockResolvedValue(null);
            setupFindOnePopulate();

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeNull();
        });

        it('should handle undefined values in update DTO when update is called with undefined fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: undefined,
                password: undefined,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });

        it('should handle special characters in fields when create is called with special characters', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test+special@example.com',
                role: 'COMPANY' as any,
                password: 'P@ssw0rd!#$',
                name: 'Test Company with \'quotes\' and "symbols"',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(
                expect.objectContaining({
                    email: createDto.email,
                    name: createDto.name,
                }),
            );
            // Password hashing is handled by User schema pre-save hook
        });

        it('should handle concurrent operations when multiple create calls are executed concurrently', async () => {
            const createDto1 = new CreateCompanyDto({
                email: 'test1@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company 1',
            });

            const createDto2 = new CreateCompanyDto({
                email: 'test2@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company 2',
            });

            mockCompanyModel.create
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', ...createDto1 })
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439012', ...createDto2 });

            await Promise.all([service.create(createDto1), service.create(createDto2)]);

            expect(mockCompanyModel.create).toHaveBeenCalledTimes(2);
        });
    });

    describe('updatePublicProfile', () => {
        it('should update public profile when updatePublicProfile is called with valid data', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated description',
                emailContact: 'newemail@test.com',
            });

            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1, acknowledged: true }),
            });

            await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: updateDto },
            );
        });

        it('should return void after successful update when updatePublicProfile resolves', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated',
            });

            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1, acknowledged: true }),
            });

            const result = await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(result).toBeUndefined();
        });

        it('should update single field when updatePublicProfile is called with one field', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Only description update',
            });

            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1, acknowledged: true }),
            });

            await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: updateDto },
            );
        });

        it('should update multiple fields when updatePublicProfile is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated description',
                emailContact: 'newemail@test.com',
                website: 'https://newsite.com',
                telephone: '+33123456789',
                address: '10 Rue de Test, 75001 Paris, France',
            });

            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1, acknowledged: true }),
            });

            await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: updateDto },
            );
        });

        it('should throw NotFoundException when no company exists with said id', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated',
            });

            mockCompanyModel.findOne.mockReturnValue(null);

            await expect(service.updatePublicProfile('507f1f77bcf86cd799439999', updateDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw error when updatePublicProfile encounters database error', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated',
            });

            const error = new Error('Database error');
            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockRejectedValue(error),
            });

            await expect(service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow(
                'Company not found',
            );
        });

        it('should handle empty update DTO when updatePublicProfile is called with empty data', async () => {
            const updateDto = new UpdateCompanyDto({});

            mockCompanyModel.findOne.mockReturnValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 0, acknowledged: true }),
            });

            await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: updateDto },
            );
        });
    });

    describe('findPendingValidation', () => {
        it('should return paginated companies with isValid=false', async () => {
            const mockPaginatedResult = {
                data: [
                    { _id: '1', name: 'Company 1', isValid: false, email: 'c1@test.com' },
                    { _id: '2', name: 'Company 2', isValid: false, email: 'c2@test.com' },
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(mockPaginatedResult);

            const query = { page: 1, limit: 10 } as any;
            const result = await service.findPendingValidation(query);

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                model,
                {
                    deletedAt: { $exists: false },
                    isValid: false,
                    $or: [
                        { 'rejected.isRejected': { $ne: true } },
                        {
                            'rejected.isRejected': true,
                            'rejected.modifiedAt': { $exists: true },
                        },
                    ],
                },
                1,
                10,
                undefined,
                '-1',
            );
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should use default pagination values when not provided', async () => {
            const mockPaginatedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(mockPaginatedResult);

            const query = {} as any;
            await service.findPendingValidation(query);

            expect(mockPaginationService.paginate).toHaveBeenCalledWith(
                model,
                {
                    deletedAt: { $exists: false },
                    isValid: false,
                    $or: [
                        { 'rejected.isRejected': { $ne: true } },
                        {
                            'rejected.isRejected': true,
                            'rejected.modifiedAt': { $exists: true },
                        },
                    ],
                },
                undefined,
                undefined,
                undefined,
                '-1',
            );
        });

        it('should handle multiple pages correctly', async () => {
            const mockPaginatedResult = {
                data: [{ _id: '3', name: 'Company 3', isValid: false, email: 'c3@test.com' }],
                total: 15,
                page: 2,
                limit: 10,
                totalPages: 2,
                hasNext: false,
                hasPrev: true,
            };

            mockPaginationService.paginate.mockResolvedValue(mockPaginatedResult);

            const query = { page: 2, limit: 10 } as any;
            const result = await service.findPendingValidation(query);

            expect(result.page).toBe(2);
            expect(result.hasNext).toBe(false);
            expect(result.hasPrev).toBe(true);
        });

        it('should exclude soft-deleted companies from pending validation', async () => {
            const mockPaginatedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockPaginationService.paginate.mockResolvedValue(mockPaginatedResult);

            const query = { page: 1, limit: 10 } as any;
            await service.findPendingValidation(query);

            const filter = mockPaginationService.paginate.mock.calls[0][1];
            expect(filter).toHaveProperty('deletedAt');
            expect(filter.deletedAt).toEqual({ $exists: false });
            expect(filter.isValid).toBe(false);
        });
    });

    describe('isValid', () => {
        it('should return true when company exists and isValid is true', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const mockCompany = {
                _id: companyId,
                name: 'Valid Company',
                isValid: true,
            };

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCompany) });

            const result = await service.isValid(companyId);

            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: companyId,
                deletedAt: { $exists: false },
            });
            expect(result).toBe(true);
        });

        it('should return false when company exists and isValid is false', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const mockCompany = {
                _id: companyId,
                name: 'Invalid Company',
                isValid: false,
            };

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCompany) });

            const result = await service.isValid(companyId);

            expect(result).toBe(false);
        });

        it('should return false when company exists and isValid is null', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const mockCompany = {
                _id: companyId,
                name: 'Company Without Validation',
                isValid: null,
            };

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCompany) });

            const result = await service.isValid(companyId);

            expect(result).toBe(false);
        });

        it('should return false when company exists and isValid is undefined', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const mockCompany = {
                _id: companyId,
                name: 'Company Without Validation',
            };

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCompany) });

            const result = await service.isValid(companyId);

            expect(result).toBe(false);
        });

        it('should throw NotFoundException when company does not exist', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.isValid(companyId)).rejects.toThrow(NotFoundException);
            await expect(service.isValid(companyId)).rejects.toThrow(`Company with id ${companyId} not found`);
        });

        it('should throw NotFoundException when company is soft-deleted', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.isValid(companyId)).rejects.toThrow(NotFoundException);
        });

        it('should exclude soft-deleted companies from the query', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            mockCompanyModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.isValid(companyId)).rejects.toThrow();

            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: companyId,
                deletedAt: { $exists: false },
            });
        });
    });

    describe('handleCompanyCleanupCron', () => {
        let mockSession: any;

        beforeEach(() => {
            // Mock session with withTransaction
            mockSession = {
                withTransaction: jest.fn(async (callback) => {
                    // Execute the callback function directly
                    return await callback();
                }),
                endSession: jest.fn(),
            };
            mockCompanyModel.db.startSession.mockResolvedValue(mockSession);
        });

        it('should do nothing when no companies to delete', async () => {
            mockCompanyModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            await service.handleCompanyCleanupCron();

            expect(mockCompanyModel.find).toHaveBeenCalled();
            expect(mockPostModel.find).not.toHaveBeenCalled();
            expect(mockApplicationModel.deleteMany).not.toHaveBeenCalled();
            expect(mockPostModel.deleteMany).not.toHaveBeenCalled();
            expect(mockForumModel.find).not.toHaveBeenCalled();
            expect(mockTopicModel.find).not.toHaveBeenCalled();
            expect(mockMessageModel.deleteMany).not.toHaveBeenCalled();
            expect(mockTopicModel.deleteMany).not.toHaveBeenCalled();
            expect(mockForumModel.deleteMany).not.toHaveBeenCalled();
            expect(mockCompanyModel.deleteMany).not.toHaveBeenCalled();
        });

        it('should delete companies and all related data when companies older than 30 days exist', async () => {
            const companyId1 = 'company1';
            const companyId2 = 'company2';
            const postId1 = 'post1';
            const postId2 = 'post2';
            const forumId1 = 'forum1';
            const topicId1 = 'topic1';

            mockCompanyModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([
                    { _id: companyId1, name: 'Company 1' },
                    { _id: companyId2, name: 'Company 2' },
                ]),
            });

            mockPostModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([
                    { _id: postId1, title: 'Post 1' },
                    { _id: postId2, title: 'Post 2' },
                ]),
            });

            // Mock des applications avec students et posts
            const mockApplications = [
                { student: { _id: 'student1' }, post: { title: 'Post 1' } },
                { student: { _id: 'student2' }, post: { title: 'Post 1' } },
                { student: { _id: 'student3' }, post: { title: 'Post 2' } },
            ];

            const mockApplicationQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockApplications),
            };

            mockApplicationModel.find.mockReturnValue(mockApplicationQuery);
            mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 5 });

            // Mock for deleteMany with session support
            mockPostModel.deleteMany.mockReturnValue({
                session: jest.fn().mockResolvedValue({ deletedCount: 2 }),
            });

            mockForumModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: forumId1 }]),
            });

            mockTopicModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: topicId1 }]),
            });

            mockMessageModel.deleteMany.mockResolvedValue({ deletedCount: 10 });
            mockTopicModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockForumModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockCompanyModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
            mockNotificationService.create.mockResolvedValue(undefined);
            mockForumModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await service.handleCompanyCleanupCron();

            expect(mockCompanyModel.find).toHaveBeenCalledWith({
                deletedAt: { $lte: expect.any(Date) },
            });

            expect(mockPostModel.find).toHaveBeenCalledWith({
                company: { $in: [companyId1, companyId2] },
            });

            // Vérifier que les applications ont été récupérées avec populate
            expect(mockApplicationModel.find).toHaveBeenCalledWith({
                post: { $in: [postId1, postId2] },
            });
            expect(mockApplicationQuery.populate).toHaveBeenCalledWith('student', '_id');
            expect(mockApplicationQuery.populate).toHaveBeenCalledWith('post', 'title');

            // Vérifier que les notifications ont été envoyées
            expect(mockNotificationService.create).toHaveBeenCalledTimes(3);
            expect(mockNotificationService.create).toHaveBeenCalledWith({
                userId: 'student1',
                message: expect.stringContaining('Post 1'),
            });

            expect(mockApplicationModel.deleteMany).toHaveBeenCalledWith({
                post: { $in: [postId1, postId2] },
            });

            expect(mockPostModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [postId1, postId2] },
            });

            expect(mockForumModel.find).toHaveBeenCalledWith({
                company: { $in: [companyId1, companyId2] },
            });

            expect(mockTopicModel.find).toHaveBeenCalledWith({
                forumId: { $in: [forumId1] },
            });

            expect(mockMessageModel.deleteMany).toHaveBeenCalledWith({
                topicId: { $in: [topicId1] },
            });

            expect(mockTopicModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [topicId1] },
            });

            expect(mockForumModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [forumId1] },
            });

            expect(mockCompanyModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [companyId1, companyId2] },
            });
        });

        it('should handle companies with no posts correctly', async () => {
            const companyId = 'company1';

            mockCompanyModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: companyId, name: 'Company 1' }]),
            });

            mockPostModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            mockForumModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            mockCompanyModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockForumModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await service.handleCompanyCleanupCron();

            expect(mockCompanyModel.find).toHaveBeenCalled();
            expect(mockPostModel.find).toHaveBeenCalled();
            expect(mockApplicationModel.find).not.toHaveBeenCalled();
            expect(mockApplicationModel.deleteMany).not.toHaveBeenCalled();
            expect(mockPostModel.deleteMany).not.toHaveBeenCalled();
            expect(mockNotificationService.create).not.toHaveBeenCalled();
            expect(mockForumModel.find).toHaveBeenCalled();
            expect(mockCompanyModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [companyId] },
            });
        });

        it('should handle the full cleanup process correctly with exact date check', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);

            const companiesToDelete = [
                { _id: 'oldCompany1', name: 'Old Company 1' },
                { _id: 'oldCompany2', name: 'Old Company 2' },
            ];

            mockCompanyModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(companiesToDelete),
            });

            mockPostModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: 'post1', title: 'Post 1' }]),
            });

            // Mock des applications
            const mockApplicationQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([
                    { student: { _id: 'student1' }, post: { title: 'Post 1' } },
                    { student: { _id: 'student2' }, post: { title: 'Post 1' } },
                    { student: { _id: 'student3' }, post: { title: 'Post 1' } },
                ]),
            };

            mockApplicationModel.find.mockReturnValue(mockApplicationQuery);
            mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 3 });
            mockNotificationService.create.mockResolvedValue(undefined);

            mockPostModel.deleteMany.mockReturnValue({
                session: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            mockForumModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: 'forum1' }]),
            });

            mockTopicModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: 'topic1' }]),
            });

            mockMessageModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
            mockTopicModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockForumModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockCompanyModel.deleteMany.mockResolvedValue({ deletedCount: 2 });
            mockForumModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await service.handleCompanyCleanupCron();

            expect(mockCompanyModel.find).toHaveBeenCalledWith({
                deletedAt: { $lte: expect.any(Date) },
            });

            expect(mockCompanyModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: ['oldCompany1', 'oldCompany2'] },
            });
        });

        it('should continue cleanup even if notification sending fails', async () => {
            const companyId = 'company1';
            const postId = 'post1';

            mockCompanyModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: companyId, name: 'Test Company' }]),
            });

            mockPostModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: postId, title: 'Test Post' }]),
            });

            // Mock des applications
            const mockApplicationQuery = {
                populate: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([{ student: { _id: 'student1' }, post: { title: 'Test Post' } }]),
            };

            mockApplicationModel.find.mockReturnValue(mockApplicationQuery);
            mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 1 });

            // Simuler une erreur lors de l'envoi de notification
            mockNotificationService.create.mockRejectedValue(new Error('Notification service down'));

            mockPostModel.deleteMany.mockReturnValue({
                session: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            mockForumModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            mockCompanyModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
            mockForumModel.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            // Ne devrait pas lancer d'erreur
            await expect(service.handleCompanyCleanupCron()).resolves.not.toThrow();

            // Les candidatures doivent quand même être supprimées
            expect(mockApplicationModel.deleteMany).toHaveBeenCalledWith({
                post: { $in: [postId] },
            });

            // L'entreprise doit quand même être supprimée
            expect(mockCompanyModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [companyId] },
            });
        });
    });

    describe('restore', () => {
        it('should restore a soft-deleted company within 30 days', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const deletedDate = new Date();
            deletedDate.setDate(deletedDate.getDate() - 15); // Deleted 15 days ago

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: deletedDate,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });
            mockCompanyModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

            await service.restore(companyId);

            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: companyId,
                deletedAt: { $exists: true },
            });
            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith({ _id: companyId }, { $unset: { deletedAt: 1 } });
        });

        it('should throw NotFoundException when company is not found or not deleted', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            const mockExec = jest.fn().mockResolvedValue(null);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await expect(service.restore(companyId)).rejects.toThrow(NotFoundException);
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: companyId,
                deletedAt: { $exists: true },
            });
        });

        it('should throw BadRequestException when 30-day period has expired', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const deletedDate = new Date();
            deletedDate.setDate(deletedDate.getDate() - 35); // Deleted 35 days ago

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: deletedDate,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await expect(service.restore(companyId)).rejects.toThrow(BadRequestException);
            expect(mockCompanyModel.updateOne).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when company has no deletedAt field', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: undefined,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await expect(service.restore(companyId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('checkDeletionStatus', () => {
        it('should return isDeleted: false when company is not deleted', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: undefined,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            const result = await service.checkDeletionStatus(companyId);

            expect(result).toEqual({ isDeleted: false });
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({ _id: companyId });
        });

        it('should return deletion info with days remaining when company is deleted', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const deletedDate = new Date();
            deletedDate.setDate(deletedDate.getDate() - 10); // Deleted 10 days ago

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: deletedDate,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            const result = await service.checkDeletionStatus(companyId);

            expect(result.isDeleted).toBe(true);
            expect(result.daysRemaining).toBe(20);
            expect(result.deletedAt).toBe(deletedDate);
        });

        it('should return 0 days remaining when company deleted more than 30 days ago', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const deletedDate = new Date();
            deletedDate.setDate(deletedDate.getDate() - 35); // Deleted 35 days ago

            const mockCompany = {
                _id: companyId,
                name: 'Test Company',
                deletedAt: deletedDate,
            };

            const mockExec = jest.fn().mockResolvedValue(mockCompany);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            const result = await service.checkDeletionStatus(companyId);

            expect(result.isDeleted).toBe(true);
            expect(result.daysRemaining).toBe(0);
        });

        it('should throw NotFoundException when company does not exist', async () => {
            const companyId = '507f1f77bcf86cd799439011';

            const mockExec = jest.fn().mockResolvedValue(null);
            mockCompanyModel.findOne.mockReturnValue({ exec: mockExec });

            await expect(service.checkDeletionStatus(companyId)).rejects.toThrow(NotFoundException);
        });
    });
});
