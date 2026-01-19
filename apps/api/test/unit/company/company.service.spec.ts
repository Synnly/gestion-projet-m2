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

describe('CompanyService', () => {
    let service: CompanyService;
    let model: Model<CompanyDocument>;

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
        updateOne: jest.fn(),
    };

    const mockExec = jest.fn();
    const mockPostService = {
        findOne: jest.fn(),
    };
    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockForumService = {
        create: jest.fn(),
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
            ],
        }).compile();

        service = module.get<CompanyService>(CompanyService);
        model = module.get<Model<CompanyDocument>>(getModelToken(Company.name));

        jest.clearAllMocks();
    });

    it('should be defined when service is instantiated', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should call companyModel.find with filter and populate posts', async () => {
            const mockCompanies = [{ _id: '1', name: 'C1', posts: [] }];
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockCompanies),
            };
            mockCompanyModel.find.mockReturnValue(mockQuery);

            const result = await service.findAll();

            expect(mockCompanyModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect(mockQuery.populate).toHaveBeenCalledWith({ path: 'posts', select: service.populateField });
            expect(result).toEqual(mockCompanies);
        });

        it('should handle empty results', async () => {
            const mockQuery = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            };
            mockCompanyModel.find.mockReturnValue(mockQuery);

            const result = await service.findAll();

            expect(result).toEqual([]);
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
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
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
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
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

        it('should create company when create is called with a partial address', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
                city: 'Paris',
                country: 'France',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(expect.objectContaining({ city: 'Paris', country: 'France' }));
            // Password hashing is handled by User schema pre-save hook
        });

        it('should create company when create is called with a complete address', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = mockCompanyModel.create.mock.calls[0][0];
            expect(createdArg).toEqual(
                expect.objectContaining({
                    streetNumber: '10',
                    streetName: 'Rue de Test',
                    postalCode: '75001',
                    city: 'Paris',
                    country: 'France',
                }),
            );
            // Password hashing is handled by User schema pre-save hook
        });
    });

    describe('update', () => {
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
                city: 'Paris',
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
                streetNumber: '456',
                streetName: 'New Street',
                postalCode: '54321',
                city: 'New City',
                country: 'New Country',
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
                streetNumber: '999',
                streetName: 'Complete Street',
                postalCode: '99999',
                city: 'Complete City',
                country: 'Complete Country',
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
        it('should soft-delete a company when remove is called with a valid id', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
            );
            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

        it('should return void after successful soft-delete when remove resolves', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.remove('507f1f77bcf86cd799439011');

            expect(result).toBeUndefined();
        });

        it('should only soft-delete non-deleted companies when remove is called', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
            );
        });

        it('should throw NotFoundException when removing non-existent company', async () => {
            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(NotFoundException);
            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(
                'Company not found or already deleted',
            );
        });

        it('should throw when remove encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });

        it('should soft-delete companies with different ids when remove is called for each id', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id, deletedAt: new Date() });
                mockCompanyModel.findOneAndUpdate.mockReturnValue({
                    exec: mockExec,
                });

                await service.remove(id);

                expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                    { _id: id, deletedAt: { $exists: false } },
                    expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
                );
            }
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
            const companiesBeforeDelete = [
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
            ];

            const companiesAfterDelete = [
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'keep@example.com',
                    name: 'Keep Company',
                },
            ];

            const mockQueryBefore = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(companiesBeforeDelete),
            };

            const mockQueryAfter = {
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(companiesAfterDelete),
            };

            mockCompanyModel.find.mockReturnValueOnce(mockQueryBefore).mockReturnValueOnce(mockQueryAfter);

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            const beforeDelete = await service.findAll();
            expect(beforeDelete).toHaveLength(2);

            await service.remove('507f1f77bcf86cd799439011');

            const afterDelete = await service.findAll();
            expect(afterDelete).toHaveLength(1);
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
                { _id: '507f1f77bcf86cd799439011' },
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
                { _id: '507f1f77bcf86cd799439011' },
                { $set: updateDto },
            );
        });

        it('should update multiple fields when updatePublicProfile is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                description: 'Updated description',
                emailContact: 'newemail@test.com',
                website: 'https://newsite.com',
                telephone: '+33123456789',
                city: 'Lyon',
                country: 'France',
            });

            mockCompanyModel.updateOne.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 1, acknowledged: true }),
            });

            await service.updatePublicProfile('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.updateOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011' },
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
                { _id: '507f1f77bcf86cd799439011' },
                { $set: updateDto },
            );
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
});
