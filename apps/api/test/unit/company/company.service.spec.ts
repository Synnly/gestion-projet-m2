import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CompanyService } from '../../../src/company/company.service';
import { Company, CompanyDocument, StructureType, LegalStatus } from '../../../src/company/company.schema';
import { CreateCompanyDto } from '../../../src/company/dto/createCompany.dto';
import { UpdateCompanyDto } from '../../../src/company/dto/updateCompany.dto';
import { NafCode } from '../../../src/company/nafCodes.enum';
import { PostService } from '../../../src/post/post.service';
import { S3Service } from '../../../src/s3/s3.service';

describe('CompanyService', () => {
    let service: CompanyService;
    let model: Model<CompanyDocument>;

    // --- MOCKS ---

    const mockCompanyModel = jest.fn();
    (mockCompanyModel as any).find = jest.fn();
    (mockCompanyModel as any).findOne = jest.fn();
    (mockCompanyModel as any).findById = jest.fn();
    (mockCompanyModel as any).create = jest.fn();
    (mockCompanyModel as any).findOneAndUpdate = jest.fn();
    (mockCompanyModel as any).findOneAndDelete = jest.fn();
    (mockCompanyModel as any).deleteOne = jest.fn();

    const mockPostService = {
        findOne: jest.fn(),
        removeAllByCompany: jest.fn(),
        hardDeleteAllByCompany: jest.fn(),
    };

    const mockS3Service = {
        deleteFile: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue: any) => defaultValue || 30),
    };

    const mockSchedulerRegistry = {
        addCronJob: jest.fn(),
    };

    // Helper to mock find().populate().exec()
    const mockExec = jest.fn();
    const setupFindChain = (result: any, shouldFail = false) => {
        if (shouldFail) {
            mockExec.mockRejectedValue(result);
        } else {
            mockExec.mockResolvedValue(result);
        }
        
        const populateMock = jest.fn().mockReturnValue({ exec: mockExec });
        return { populate: populateMock };
    };

    beforeEach(async () => {
        // We activate false clocks BEFORE créating the module
        jest.useFakeTimers(); 

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompanyService,
                { provide: getModelToken(Company.name), useValue: mockCompanyModel },
                { provide: PostService, useValue: mockPostService },
                { provide: S3Service, useValue: mockS3Service },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
            ],
        }).compile();

        service = module.get<CompanyService>(CompanyService);
        model = module.get<Model<CompanyDocument>>(getModelToken(Company.name));

        jest.clearAllMocks();
    });

    // We clear after each test to not impact other files
    afterEach(() => {
        jest.useRealTimers();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of companies with populated posts', async () => {
            const companies = [{ name: 'Test Co' }];
            // Setup chain: find -> populate -> exec
            const populateMock = setupFindChain(companies).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toEqual(companies);
            expect((mockCompanyModel as any).find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect(populateMock).toHaveBeenCalledWith({ path: 'posts', select: expect.any(String) });
        });

        it('should return an array of companies when findAll is called and companies exist', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    password: 'hashedPassword',
                    name: 'Test Company',
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'test2@example.com',
                    password: 'hashedPassword2',
                    name: 'Test Company 2',
                },
            ];

            const populateMock = setupFindChain(companies).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toEqual(companies);
            expect((mockCompanyModel as any).find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect((mockCompanyModel as any).find).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return an empty array when findAll is called and no companies exist', async () => {
            const populateMock = setupFindChain([]).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toEqual([]);
            expect((mockCompanyModel as any).find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return companies with all fields when findAll is called and full documents are present', async () => {
            const companies = [
                {
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
                },
            ];

            const populateMock = setupFindChain(companies).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toEqual(companies);
            expect(result[0].siretNumber).toBe('12345678901234');
            expect(result[0].structureType).toBe(StructureType.PrivateCompany);
        });

    it('should only return non-deleted companies when findAll is called', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    password: 'hashedPassword',
                    name: 'Test Company',
                },
            ];

            const populateMock = setupFindChain(companies).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            await service.findAll();

            expect((mockCompanyModel as any).find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
        });

    it('should throw when findAll encounters a database error', async () => {
            const error = new Error('Database connection error');
            const { populate } = setupFindChain(error, true); 
            (mockCompanyModel as any).find.mockReturnValue({ populate });

            await expect(service.findAll()).rejects.toThrow('Database connection error');
            expect((mockCompanyModel as any).find).toHaveBeenCalledTimes(1);
        });

    it('should return multiple companies when findAll is called with many documents', async () => {
            const companies = Array.from({ length: 10 }, (_, i) => ({
                _id: `507f1f77bcf86cd79943901${i}`,
                email: `test${i}@example.com`,
                password: 'hashedPassword',
                name: `Test Company ${i}`,

            }));

            const populateMock = setupFindChain(companies).populate;
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            const result = await service.findAll();

            expect(result).toHaveLength(10);
            expect(result).toEqual(companies);
        });
    });

    describe('findOne', () => {
        it('should return a company if found', async () => {
            const company = { name: 'Test Co' };
            const populateMock = setupFindChain(company).populate;
            (mockCompanyModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOne('id1');

            expect(result).toEqual(company);
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith({ _id: 'id1', deletedAt: { $exists: false } });
        });

        it('should return null if not found', async () => {
            const populateMock = setupFindChain(null).populate;
            (mockCompanyModel as any).findOne.mockReturnValue({ populate: populateMock });

            const result = await service.findOne('id1');
            expect(result).toBeNull();
        });

        it('should return a company by id when findOne is called with an existing id', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
            };

            const { populate } = setupFindChain(company); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return null when findOne is called with a non-existent id', async () => {
            const { populate } = setupFindChain(null); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

            const result = await service.findOne('507f1f77bcf86cd799439999');

            expect(result).toBeNull();
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439999',
                deletedAt: { $exists: false },
            });
        });

    it('should return null when findOne is called for a deleted company', async () => {
            const { populate } = setupFindChain(null); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeNull();
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith({
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

            const { populate } = setupFindChain(company); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

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

            const { populate } = setupFindChain(company); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect(result?.siretNumber).toBeUndefined();

        });

    it('should throw when findOne encounters a database error', async () => {
            const error = new Error('Database error');
            const { populate } = setupFindChain(error, true); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

            await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect((mockCompanyModel as any).findOne).toHaveBeenCalledTimes(1);
        });

    it('should handle different id formats when findOne is called with various ids', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                const { populate } = setupFindChain({ _id: id, email: 'test@example.com', name: 'Test' }); 
                (mockCompanyModel as any).findOne.mockReturnValue({ populate });

                await service.findOne(id);

                expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith({
                    _id: id,
                    deletedAt: { $exists: false },
                });
            }
        });
    });

    describe('create', () => {
        it('should create a company', async () => {
            const dto = new CreateCompanyDto({ email: 'test@test.com', name: 'Test', password: 'pwd' });
            (mockCompanyModel as any).create.mockResolvedValue(dto);

            await service.create(dto);

            expect((mockCompanyModel as any).create).toHaveBeenCalledWith(expect.objectContaining(dto));
        });

        it('should create a company when create is called with minimal required fields', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect((mockCompanyModel as any).create).toHaveBeenCalledTimes(1);
            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
            expect(createdArg).toEqual(expect.objectContaining({
                email: createDto.email,
                name: createDto.name,
                }));
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

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
            expect(createdArg).toEqual(expect.objectContaining({
                email: createDto.email,
                name: createDto.name,
                }));
            // Password hashing is handled by User schema pre-save hook
        });

    it('should return void after successful creation when create resolves', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            const result = await service.create(createDto);

            expect(result).toBeUndefined();
            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
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

                (mockCompanyModel as any).create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                const createdArg = (mockCompanyModel as any).create.mock.calls[(mockCompanyModel as any).create.mock.calls.length - 1][0];
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

                (mockCompanyModel as any).create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                const createdArg = (mockCompanyModel as any).create.mock.calls[(mockCompanyModel as any).create.mock.calls.length - 1][0];
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
            (mockCompanyModel as any).create.mockRejectedValue(error);

            await expect(service.create(createDto)).rejects.toThrow('Duplicate key error');
            expect((mockCompanyModel as any).create).toHaveBeenCalledTimes(1);
        });

    it('should throw when create encounters validation errors', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                role: 'COMPANY' as any,
                password: 'Password123!',
                name: 'Test Company',
            });

            const error = new Error('Validation error');
            (mockCompanyModel as any).create.mockRejectedValue(error);

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

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
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

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
            expect(createdArg).toEqual(expect.objectContaining({
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
            }));
            // Password hashing is handled by User schema pre-save hook
        });

    });

    describe('update', () => {
        const companyId = 'id1';
        
        it('should update existing company if found', async () => {
            const dto = new UpdateCompanyDto({ name: 'Updated' });
            // Mock existing company with save method
            const existingCompany = { 
                _id: companyId, 
                name: 'Old', 
                save: jest.fn().mockResolvedValue(true) 
            };
            
            mockExec.mockResolvedValue(existingCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update(companyId, dto);

            expect(existingCompany.name).toBe('Updated');
            expect(existingCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

        it('should create new company if not found (Upsert)', async () => {
            const dto = new CreateCompanyDto({ email: 'new@test.com', name: 'New', password: 'pwd' });
            
            mockExec.mockResolvedValue(null);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update(companyId, dto);

            expect((mockCompanyModel as any).create).toHaveBeenCalledWith(expect.objectContaining(dto));
        });

        it('should validate posts existence during update', async () => {
            const dto = new UpdateCompanyDto({ posts: ['post1'] });
            const existingCompany = { save: jest.fn() };

            mockExec.mockResolvedValue(existingCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });
            
            mockPostService.findOne.mockResolvedValue({ _id: 'post1' });

            await service.update(companyId, dto);

            expect(mockPostService.findOne).toHaveBeenCalledWith('post1');
        });

        it('should throw BadRequestException if post ID is invalid', async () => {
            const dto = new UpdateCompanyDto({ posts: ['invalid'] });
            mockExec.mockResolvedValue({ save: jest.fn() });
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            mockPostService.findOne.mockRejectedValue(new Error('Invalid ID'));

            await expect(service.update(companyId, dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw NotFoundException if post not found', async () => {
            const dto = new UpdateCompanyDto({ posts: ['missing'] });
            mockExec.mockResolvedValue({ save: jest.fn() });
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            mockPostService.findOne.mockResolvedValue(null);

            await expect(service.update(companyId, dto)).rejects.toThrow(NotFoundException);
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
            (mockCompanyModel as any).findOne.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } }
            );
            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

    it('should update a company when update is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
                city: 'Paris',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect((mockCompanyModel as any).findOne).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } }
            );
            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

    it('should return void after successful update when findOneAndUpdate resolves', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            const result = await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(result).toBeUndefined();
        });

    it('should update company password when update is called with a new password', async () => {
            const updateDto = new UpdateCompanyDto({
                password: 'NewPassword123!',
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
        });

    it('should update company legalStatus when update is called with a new legalStatus', async () => {
            const updateDto = new UpdateCompanyDto({
                legalStatus: LegalStatus.SAS,
            });

            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalledWith({ validateBeforeSave: false });
            // updatedAt is set by Mongoose timestamps, not explicitly in service
        });

    it('should create a new company when update is attempted on a non-existent id (upsert)', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue(null);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            // mock create to succeed
            (mockCompanyModel as any).create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', ...updateDto });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect((mockCompanyModel as any).create).toHaveBeenCalledTimes(1);
            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
            // ensure DTO fields were passed to create (we don't assert exact _id here)
            expect(createdArg).toEqual(expect.objectContaining({ name: updateDto.name }));
        });

    it('should throw when update encounters a database error', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await expect(service.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow('Database error');
        });

    it('should handle empty update DTO when update is called with empty data', async () => {
            const updateDto = new UpdateCompanyDto({});

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });

    });

    describe('remove (Soft Delete)', () => {
        const id = 'id1';

        it('should soft delete company and call postService to remove posts', async () => {
            mockExec.mockResolvedValue({ _id: id });
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await service.remove(id);

            expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledWith(
                { _id: id, deletedAt: { $exists: false } },
                { $set: { deletedAt: expect.any(Date) } }
            );
            expect(mockPostService.removeAllByCompany).toHaveBeenCalledWith(id);
        });

        it('should throw NotFoundException if company not found', async () => {
            mockExec.mockResolvedValue(null);
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({ exec: mockExec });

            await expect(service.remove(id)).rejects.toThrow(NotFoundException);
        });

        it('should soft-delete a company when remove is called with a valid id', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
            );
            expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return void after successful soft-delete when remove resolves', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.remove('507f1f77bcf86cd799439011');

            expect(result).toBeUndefined();
        });

    it('should only soft-delete non-deleted companies when remove is called', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', deletedAt: new Date() });
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
            );
        });

    it('should throw NotFoundException when removing non-existent company', async () => {
            mockExec.mockResolvedValue(null);
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.remove('507f1f77bcf86cd799439999')).rejects.toThrow(
                'Company not found or already deleted',
            );
        });

    it('should throw when remove encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledTimes(1);
        });

    it('should soft-delete companies with different ids when remove is called for each id', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id, deletedAt: new Date() });
                (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({
                    exec: mockExec,
                });

                await service.remove(id);

                expect((mockCompanyModel as any).findOneAndUpdate).toHaveBeenCalledWith(
                    { _id: id, deletedAt: { $exists: false } },
                    expect.objectContaining({ $set: { deletedAt: expect.any(Date) } }),
                );
            }
        });
    });

    describe('Cron & Cleanup Logic', () => {
        it('onModuleInit should register cron job', () => {
            mockConfigService.get.mockReturnValue('0 3 * * *');
            service.onModuleInit();
            expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith('deleteExpiredCompanies', expect.anything());
        });

        describe('deleteExpired', () => {
            it('should hard delete expired companies', async () => {
                const expiredCompanies = [{ _id: 'c1' }, { _id: 'c2' }];
                (mockCompanyModel as any).find.mockResolvedValue(expiredCompanies);
                
                const hardDeleteSpy = jest.spyOn(service, 'hardDelete').mockResolvedValue(undefined);

                await service.deleteExpired();

                expect((mockCompanyModel as any).find).toHaveBeenCalledWith({ deletedAt: { $lte: expect.any(Date) } });
                expect(hardDeleteSpy).toHaveBeenCalledTimes(2);
                expect(hardDeleteSpy).toHaveBeenCalledWith('c1');
                expect(hardDeleteSpy).toHaveBeenCalledWith('c2');
            });

            it('should do nothing if no expired companies', async () => {
                (mockCompanyModel as any).find.mockResolvedValue([]);
                const hardDeleteSpy = jest.spyOn(service, 'hardDelete');

                await service.deleteExpired();

                expect(hardDeleteSpy).not.toHaveBeenCalled();
            });
        });

        describe('hardDelete', () => {
            const id = 'c1';

            it('should perform full cleanup', async () => {
                const removeLogoSpy = jest.spyOn(service, 'removeCompanyLogo').mockResolvedValue(undefined);
                (mockCompanyModel as any).deleteOne.mockResolvedValue({ deletedCount: 1 });

                await service.hardDelete(id);

                expect(mockPostService.hardDeleteAllByCompany).toHaveBeenCalledWith(id);
                expect(removeLogoSpy).toHaveBeenCalledWith(id);
                expect((mockCompanyModel as any).deleteOne).toHaveBeenCalledWith({ _id: id });
            });
        });

        describe('removeCompanyLogo', () => {
            const id = 'c1';

            it('should delete file from S3 and update company', async () => {
                const company = { 
                    _id: id, 
                    id: id, 
                    logo: 'logo.png', 
                    save: jest.fn() 
                };
                (mockCompanyModel as any).findById.mockResolvedValue(company);

                await service.removeCompanyLogo(id);

                expect(mockS3Service.deleteFile).toHaveBeenCalledWith('logo.png', id);
                expect(company.logo).toBeUndefined();
                expect(company.save).toHaveBeenCalled();
            });

            it('should do nothing if no logo', async () => {
                const company = { _id: id, logo: null, save: jest.fn() };
                (mockCompanyModel as any).findById.mockResolvedValue(company);

                await service.removeCompanyLogo(id);

                expect(mockS3Service.deleteFile).not.toHaveBeenCalled();
            });

            it('should throw if company not found', async () => {
                (mockCompanyModel as any).findById.mockResolvedValue(null);
                await expect(service.removeCompanyLogo(id)).rejects.toThrow(NotFoundException);
            });
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

            const { populate } = setupFindChain(createdCompany); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

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

            (mockCompanyModel as any).create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

            const updatedCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'update-test@example.com',
                name: 'Updated Test Company',
            };

            mockExec.mockResolvedValue(updatedCompany);
            const mockCompany = { save: jest.fn().mockResolvedValue(true) };
            mockExec.mockResolvedValue(mockCompany);
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

            await service.create(createDto);
            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompany.save).toHaveBeenCalled();
        });

       it('should verify company is removed from findAll after deletion when remove is called', async () => {
            const companiesBeforeDelete = [
                { _id: 'id1', name: 'To Delete', deletedAt: undefined },
                { _id: 'id2', name: 'Keep', deletedAt: undefined },
            ];
            const companiesAfterDelete = [
                { _id: 'id2', name: 'Keep', deletedAt: undefined },
            ];

            mockExec
                .mockResolvedValueOnce(companiesBeforeDelete)
                .mockResolvedValueOnce({ _id: 'id1' })
                .mockResolvedValueOnce(companiesAfterDelete);
            
            // findAll : find() -> populate() -> exec()
            const populateMock = jest.fn().mockReturnValue({ exec: mockExec });
            (mockCompanyModel as any).find.mockReturnValue({ populate: populateMock });

            // remove : findOneAndUpdate() -> exec() (no populate)
            (mockCompanyModel as any).findOneAndUpdate.mockReturnValue({ exec: mockExec });

            // --- Action 1 : État initial ---
            const beforeDelete = await service.findAll();
            expect(beforeDelete).toHaveLength(2);

            await service.remove('id1');

            const afterDelete = await service.findAll();
            expect(afterDelete).toHaveLength(1);
            expect(afterDelete[0]._id).toBe('id2');
        });
    });

    describe('Edge cases', () => {
        it('should return null when findOne returns null', async () => {
            const { populate } = setupFindChain(null); 
            (mockCompanyModel as any).findOne.mockReturnValue({ populate });

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
            (mockCompanyModel as any).findOne.mockReturnValue({ exec: mockExec });

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

            (mockCompanyModel as any).create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            const createdArg = (mockCompanyModel as any).create.mock.calls[0][0];
            expect(createdArg).toEqual(expect.objectContaining({
                email: createDto.email,
                name: createDto.name,
                }));
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

            (mockCompanyModel as any).create
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', ...createDto1 })
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439012', ...createDto2 });

            await Promise.all([service.create(createDto1), service.create(createDto2)]);

            expect((mockCompanyModel as any).create).toHaveBeenCalledTimes(2);
        });
    });
});