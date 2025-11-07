import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyService } from '../../../src/company/company.service';
import { Company, CompanyDocument, StructureType, LegalStatus } from '../../../src/company/company.schema';
import { CreateCompanyDto } from '../../../src/company/dto/createCompany.dto';
import { UpdateCompanyDto } from '../../../src/company/dto/updateCompany.dto';

describe('CompanyService', () => {
    let service: CompanyService;
    let model: Model<CompanyDocument>;

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
    };

    const mockExec = jest.fn();

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CompanyService,
                {
                    provide: getModelToken(Company.name),
                    useValue: mockCompanyModel,
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
    it('should return an array of companies when findAll is called and companies exist', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    password: 'hashedPassword',
                    name: 'Test Company',
                    isValid: true,
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'test2@example.com',
                    password: 'hashedPassword2',
                    name: 'Test Company 2',
                    isValid: false,
                },
            ];

            mockExec.mockResolvedValue(companies);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findAll();

            expect(result).toEqual(companies);
            expect(mockCompanyModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
            expect(mockCompanyModel.find).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return an empty array when findAll is called and no companies exist', async () => {
            mockExec.mockResolvedValue([]);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findAll();

            expect(result).toEqual([]);
            expect(mockCompanyModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
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
                    nafCode: '6202A',
                    structureType: StructureType.PrivateCompany,
                    legalStatus: LegalStatus.SARL,
                    streetNumber: '10',
                    streetName: 'Rue de Test',
                    postalCode: '75001',
                    city: 'Paris',
                    country: 'France',
                    isValid: true,
                },
            ];

            mockExec.mockResolvedValue(companies);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

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
                    isValid: true,
                },
            ];

            mockExec.mockResolvedValue(companies);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

            await service.findAll();

            expect(mockCompanyModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
        });

    it('should throw when findAll encounters a database error', async () => {
            const error = new Error('Database connection error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.findAll()).rejects.toThrow('Database connection error');
            expect(mockCompanyModel.find).toHaveBeenCalledTimes(1);
        });

    it('should return multiple companies when findAll is called with many documents', async () => {
            const companies = Array.from({ length: 10 }, (_, i) => ({
                _id: `507f1f77bcf86cd79943901${i}`,
                email: `test${i}@example.com`,
                password: 'hashedPassword',
                name: `Test Company ${i}`,
                isValid: i % 2 === 0,
            }));

            mockExec.mockResolvedValue(companies);
            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findAll();

            expect(result).toHaveLength(10);
            expect(result).toEqual(companies);
        });
    });

    describe('findOne', () => {
    it('should return a company by id when findOne is called with an existing id', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
                isValid: true,
            };

            mockExec.mockResolvedValue(company);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

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
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findOne('507f1f77bcf86cd799439999');

            expect(result).toBeNull();
            expect(mockCompanyModel.findOne).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439999',
                deletedAt: { $exists: false },
            });
        });

    it('should return null when findOne is called for a deleted company', async () => {
            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

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
                nafCode: '6202A',
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
                isValid: true,
            };

            mockExec.mockResolvedValue(company);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

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
                isValid: false,
            };

            mockExec.mockResolvedValue(company);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(company);
            expect(result?.siretNumber).toBeUndefined();
            expect(result?.isValid).toBe(false);
        });

    it('should throw when findOne encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect(mockCompanyModel.findOne).toHaveBeenCalledTimes(1);
        });

    it('should handle different id formats when findOne is called with various ids', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id, email: 'test@example.com', name: 'Test' });
                mockCompanyModel.findOne.mockReturnValue({
                    exec: mockExec,
                });

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
                password: 'Password123!',
                name: 'Test Company',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(createDto);
            expect(mockCompanyModel.create).toHaveBeenCalledTimes(1);
        });

    it('should create a company when create is called with all fields provided', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                siretNumber: '12345678901234',
                nafCode: '6202A',
                structureType: StructureType.PrivateCompany,
                legalStatus: LegalStatus.SARL,
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
                isValid: true,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(createDto);
        });

    it('should return void after successful creation when create resolves', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            const result = await service.create(createDto);

            expect(result).toBeUndefined();
        });

    it('should create company with each StructureType when create is called for each enum value', async () => {
            for (const structureType of Object.values(StructureType)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${structureType}@example.com`,
                    password: 'Password123!',
                    name: `Test ${structureType}`,
                    structureType: structureType,
                    isValid: false,
                });

                mockCompanyModel.create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                expect(mockCompanyModel.create).toHaveBeenCalledWith(expect.objectContaining({ structureType }));
            }
        });

    it('should create company with each LegalStatus when create is called for each enum value', async () => {
            for (const legalStatus of Object.values(LegalStatus)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${legalStatus}@example.com`,
                    password: 'Password123!',
                    name: `Test ${legalStatus}`,
                    legalStatus: legalStatus,
                    isValid: false,
                });

                mockCompanyModel.create.mockResolvedValue({
                    _id: '507f1f77bcf86cd799439011',
                    ...createDto,
                });

                await service.create(createDto);

                expect(mockCompanyModel.create).toHaveBeenCalledWith(expect.objectContaining({ legalStatus }));
            }
        });

    it('should create company with isValid true when create is called with isValid true', async () => {
            const createDto = new CreateCompanyDto({
                email: 'valid@example.com',
                password: 'Password123!',
                name: 'Valid Company',
                isValid: true,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(expect.objectContaining({ isValid: true }));
        });

    it('should create company with isValid false when create is called with isValid false', async () => {
            const createDto = new CreateCompanyDto({
                email: 'invalid@example.com',
                password: 'Password123!',
                name: 'Invalid Company',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(expect.objectContaining({ isValid: false }));
        });

    it('should throw when create encounters a database error', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                isValid: false,
            });

            const error = new Error('Duplicate key error');
            mockCompanyModel.create.mockRejectedValue(error);

            await expect(service.create(createDto)).rejects.toThrow('Duplicate key error');
            expect(mockCompanyModel.create).toHaveBeenCalledTimes(1);
        });

    it('should throw when create encounters validation errors', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                isValid: false,
            });

            const error = new Error('Validation error');
            mockCompanyModel.create.mockRejectedValue(error);

            await expect(service.create(createDto)).rejects.toThrow('Validation error');
        });

    it('should create company when create is called with a partial address', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                city: 'Paris',
                country: 'France',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    city: 'Paris',
                    country: 'France',
                }),
            );
        });

    it('should create company when create is called with a complete address', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                streetNumber: '10',
                streetName: 'Rue de Test',
                postalCode: '75001',
                city: 'Paris',
                country: 'France',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('update', () => {
    it('should update a company when update is called with a single field', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const updatedCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Updated Company',
            };

            mockExec.mockResolvedValue(updatedCompany);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: { ...updateDto, updatedAt: expect.any(Date) } },
                { new: true },
            );
            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should update a company when update is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
                email: 'updated@example.com',
                siretNumber: '98765432109876',
                isValid: true,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', ...updateDto });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                { $set: { ...updateDto, updatedAt: expect.any(Date) } },
                { new: true },
            );
        });

    it('should return void after successful update when findOneAndUpdate resolves', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(result).toBeUndefined();
        });

    it('should update company email when update is called with a new email', async () => {
            const updateDto = new UpdateCompanyDto({
                email: 'newemail@example.com',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { email: 'newemail@example.com', updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should update company password when update is called with a new password', async () => {
            const updateDto = new UpdateCompanyDto({
                password: 'NewPassword123!',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { password: 'NewPassword123!', updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should update company structureType when update is called with a new structureType', async () => {
            const updateDto = new UpdateCompanyDto({
                structureType: StructureType.Association,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                {
                    $set: {
                        structureType: StructureType.Association,
                        updatedAt: expect.any(Date),
                    },
                },
                expect.any(Object),
            );
        });

    it('should update company legalStatus when update is called with a new legalStatus', async () => {
            const updateDto = new UpdateCompanyDto({
                legalStatus: LegalStatus.SAS,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { legalStatus: LegalStatus.SAS, updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should update company isValid status when update is called with isValid value', async () => {
            const updateDto = new UpdateCompanyDto({
                isValid: true,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { isValid: true, updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should update company address fields when update is called with address data', async () => {
            const updateDto = new UpdateCompanyDto({
                streetNumber: '456',
                streetName: 'New Street',
                postalCode: '54321',
                city: 'New City',
                country: 'New Country',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { ...updateDto, updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should update all company fields when update is called with full update data', async () => {
            const updateDto = new UpdateCompanyDto({
                email: 'fullupdate@example.com',
                password: 'NewPassword123!',
                name: 'Fully Updated Company',
                siretNumber: '11111111111111',
                nafCode: '9999Z',
                structureType: StructureType.NGO,
                legalStatus: LegalStatus.OTHER,
                streetNumber: '999',
                streetName: 'Complete Street',
                postalCode: '99999',
                city: 'Complete City',
                country: 'Complete Country',
                isValid: true,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { ...updateDto, updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should include updatedAt timestamp when update is performed', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const beforeUpdate = new Date();
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            const callArgs = mockCompanyModel.findOneAndUpdate.mock.calls[0][1];
            expect(callArgs.$set.updatedAt).toBeInstanceOf(Date);
            expect(callArgs.$set.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });

    it('should only update non-deleted companies when update is attempted', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', deletedAt: { $exists: false } },
                expect.any(Object),
                expect.any(Object),
            );
        });

    it('should throw when update encounters a database error', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow('Database error');
        });

    it('should handle empty update DTO when update is called with empty data', async () => {
            const updateDto = new UpdateCompanyDto({});

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                { $set: { updatedAt: expect.any(Date) } },
                expect.any(Object),
            );
        });

    it('should set new: true option when update is called', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), {
                new: true,
            });
        });
    });

    describe('remove', () => {
    it('should delete a company when remove is called with a valid id', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
            expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledTimes(1);
            expect(mockExec).toHaveBeenCalledTimes(1);
        });

    it('should return void after successful deletion when remove resolves', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.remove('507f1f77bcf86cd799439011');

            expect(result).toBeUndefined();
        });

    it('should only delete non-deleted companies when remove is called', async () => {
            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439011');

            expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439011',
                deletedAt: { $exists: false },
            });
        });

    it('should handle deletion of non-existent company when remove is called with missing id', async () => {
            mockExec.mockResolvedValue(null);
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            await service.remove('507f1f77bcf86cd799439999');

            expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledWith({
                _id: '507f1f77bcf86cd799439999',
                deletedAt: { $exists: false },
            });
        });

    it('should throw when remove encounters a database error', async () => {
            const error = new Error('Database error');
            mockExec.mockRejectedValue(error);
            mockCompanyModel.findOneAndDelete.mockReturnValue({
                exec: mockExec,
            });

            await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledTimes(1);
        });

    it('should delete companies with different ids when remove is called for each id', async () => {
            const ids = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'];

            for (const id of ids) {
                mockExec.mockResolvedValue({ _id: id });
                mockCompanyModel.findOneAndDelete.mockReturnValue({
                    exec: mockExec,
                });

                await service.remove(id);

                expect(mockCompanyModel.findOneAndDelete).toHaveBeenCalledWith({
                    _id: id,
                    deletedAt: { $exists: false },
                });
            }
        });
    });

    describe('Integration scenarios', () => {
    it('should create and then find the created company when create then findOne are called', async () => {
            const createDto = new CreateCompanyDto({
                email: 'integration@example.com',
                password: 'Password123!',
                name: 'Integration Company',
                isValid: true,
            });

            const createdCompany = {
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            };

            mockCompanyModel.create.mockResolvedValue(createdCompany);
            mockExec.mockResolvedValue(createdCompany);
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            await service.create(createDto);
            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toEqual(createdCompany);
        });

    it('should create, update, and verify the updated company when create and update are called sequentially', async () => {
            const createDto = new CreateCompanyDto({
                email: 'update-test@example.com',
                password: 'Password123!',
                name: 'Update Test Company',
                isValid: false,
            });

            const updateDto = new UpdateCompanyDto({
                name: 'Updated Test Company',
                isValid: true,
            });

            mockCompanyModel.create.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

            const updatedCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'update-test@example.com',
                name: 'Updated Test Company',
                isValid: true,
            };

            mockExec.mockResolvedValue(updatedCompany);
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.create(createDto);
            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalled();
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

            mockExec
                .mockResolvedValueOnce(companiesBeforeDelete)
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011' })
                .mockResolvedValueOnce(companiesAfterDelete);

            mockCompanyModel.find.mockReturnValue({
                exec: mockExec,
            });
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
            mockCompanyModel.findOne.mockReturnValue({
                exec: mockExec,
            });

            const result = await service.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeNull();
        });

    it('should handle undefined values in update DTO when update is called with undefined fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: undefined,
                email: undefined,
            });

            mockExec.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });
            mockCompanyModel.findOneAndUpdate.mockReturnValue({
                exec: mockExec,
            });

            await service.update('507f1f77bcf86cd799439011', updateDto);

            expect(mockCompanyModel.findOneAndUpdate).toHaveBeenCalled();
        });

    it('should handle special characters in fields when create is called with special characters', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test+special@example.com',
                password: 'P@ssw0rd!#$',
                name: 'Test Company with \'quotes\' and "symbols"',
                isValid: false,
            });

            mockCompanyModel.create.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
            });

            await service.create(createDto);

            expect(mockCompanyModel.create).toHaveBeenCalledWith(createDto);
        });

    it('should handle concurrent operations when multiple create calls are executed concurrently', async () => {
            const createDto1 = new CreateCompanyDto({
                email: 'test1@example.com',
                password: 'Password123!',
                name: 'Test Company 1',
                isValid: false,
            });

            const createDto2 = new CreateCompanyDto({
                email: 'test2@example.com',
                password: 'Password123!',
                name: 'Test Company 2',
                isValid: false,
            });

            mockCompanyModel.create
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', ...createDto1 })
                .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439012', ...createDto2 });

            await Promise.all([service.create(createDto1), service.create(createDto2)]);

            expect(mockCompanyModel.create).toHaveBeenCalledTimes(2);
        });
    });
});
