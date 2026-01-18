import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from '../../../src/company/company.controller';
import { CompanyService } from '../../../src/company/company.service';
import { CreateCompanyDto } from '../../../src/company/dto/createCompany.dto';
import { UpdateCompanyDto } from '../../../src/company/dto/updateCompany.dto';
import { CompanyDto } from '../../../src/company/dto/company.dto';
import { StructureType, LegalStatus } from '../../../src/company/company.schema';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../src/common/roles/roles.enum';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('CompanyController', () => {
    let controller: CompanyController;
    let service: CompanyService;
    let rolesGuard: RolesGuard;
    let reflector: Reflector;

    const mockCompanyService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        findPendingValidation: jest.fn(),
        isValid: jest.fn(),
    };

    const mockReflector = {
        getAllAndOverride: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
        decode: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'JWT_SECRET') return 'test-secret';
            return null;
        }),
    };

    const createMockExecutionContext = (user?: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as any;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CompanyController],
            providers: [
                {
                    provide: CompanyService,
                    useValue: mockCompanyService,
                },
                {
                    provide: Reflector,
                    useValue: mockReflector,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                RolesGuard,
            ],
        }).compile();

        controller = module.get<CompanyController>(CompanyController);
        service = module.get<CompanyService>(CompanyService);
        rolesGuard = module.get<RolesGuard>(RolesGuard);
        reflector = module.get<Reflector>(Reflector);

        jest.clearAllMocks();
    });

    it('should be defined when controller is instantiated', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of 2 CompanyDto when findAll is called with 2 existing companies in database', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test Company',
                    siretNumber: '12345678901234',
                    isValid: true,
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'test2@example.com',
                    name: 'Test Company 2',
                    isValid: false,
                },
            ];

            mockCompanyService.findAll.mockResolvedValue(companies);

            const result = await controller.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(CompanyDto);
            expect(result[0]._id).toBe('507f1f77bcf86cd799439011');
            expect(result[1]._id).toBe('507f1f77bcf86cd799439012');
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return CompanyDto[] when called and map data', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test Company',
                    posts: [{ _id: 'p1', title: 'Post 1' }],
                },
            ];

            mockCompanyService.findAll.mockResolvedValue(companies);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(CompanyDto);
            expect(result[0].posts).toBeDefined();
        });

        it('should return an empty array when findAll is called with no companies existing in database', async () => {
            mockCompanyService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(result).toEqual([]);
            expect(service.findAll).toHaveBeenCalledTimes(1);
        });

        it('should return company with all optional fields when findAll is called with company containing all optional fields in database', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
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

            mockCompanyService.findAll.mockResolvedValue(companies);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0].siretNumber).toBe('12345678901234');
            expect(result[0].nafCode).toBe('6202A');
            expect(result[0].structureType).toBe(StructureType.PrivateCompany);
            expect(result[0].legalStatus).toBe(LegalStatus.SARL);
            expect(result[0].streetNumber).toBe('10');
            expect(result[0].streetName).toBe('Rue de Test');
            expect(result[0].postalCode).toBe('75001');
            expect(result[0].city).toBe('Paris');
            expect(result[0].country).toBe('France');
            expect(result[0].isValid).toBe(true);
        });

        it('should return all companies when findAll is called with existing companies', async () => {
            const mockCompanies = [{ id: '1', name: 'TestCo' }];
            mockCompanyService.findAll.mockResolvedValue(mockCompanies);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(CompanyDto);
        });

        it('should return company with only required fields when findAll is called with company containing minimal fields in database', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test Company',
                    isValid: false,
                },
            ];

            mockCompanyService.findAll.mockResolvedValue(companies);

            const result = await controller.findAll();

            expect(result).toHaveLength(1);
            expect(result[0]._id).toBe('507f1f77bcf86cd799439011');
            expect(result[0].email).toBe('test@example.com');
            expect(result[0].name).toBe('Test Company');
            expect(result[0].siretNumber).toBeUndefined();
            expect(result[0].nafCode).toBeUndefined();
        });
    });

    describe('findOne', () => {
        it('should return a CompanyDto when findOne is called with valid existing company id', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                isValid: true,
            };

            mockCompanyService.findOne.mockResolvedValue(company);

            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeInstanceOf(CompanyDto);
            expect(result._id).toBe('507f1f77bcf86cd799439011');
            expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(service.findOne).toHaveBeenCalledTimes(1);
        });

        it('should return a company when findOne is called with existing company id', async () => {
            const mockCompany = { id: '1', name: 'TestCo' };
            mockCompanyService.findOne.mockResolvedValue(mockCompany);

            const result = await controller.findOne('1');

            expect(result).toBeInstanceOf(CompanyDto);
        });

        it('should throw NotFoundException when findOne is called with non-existing company id', async () => {
            mockCompanyService.findOne.mockResolvedValue(null);

            await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException with message when findOne is called with non-existing company id', async () => {
            mockCompanyService.findOne.mockResolvedValue(null);

            await expect(controller.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
            await expect(controller.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
                'Company with id 507f1f77bcf86cd799439011 not found',
            );
            expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        });

        it('should return company with all optional fields when findOne is called with company containing all fields', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
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

            mockCompanyService.findOne.mockResolvedValue(company);

            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result.siretNumber).toBe('12345678901234');
            expect(result.nafCode).toBe('6202A');
            expect(result.structureType).toBe(StructureType.PrivateCompany);
            expect(result.legalStatus).toBe(LegalStatus.SARL);
            expect(result.isValid).toBe(true);
        });

        it('should return company with only required fields when findOne is called with company containing minimal fields', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                isValid: false,
            };

            mockCompanyService.findOne.mockResolvedValue(company);

            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result._id).toBe('507f1f77bcf86cd799439011');
            expect(result.email).toBe('test@example.com');
            expect(result.name).toBe('Test Company');
            expect(result.siretNumber).toBeUndefined();
            expect(result.isValid).toBe(false);
        });

        it('should throw NotFoundException when findOne is called with id returning undefined from service', async () => {
            mockCompanyService.findOne.mockResolvedValue(undefined);

            await expect(controller.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create company successfully when create is called with minimal required fields', async () => {
            const createDto = new CreateCompanyDto({
                email: 'test@example.com',
                password: 'Password123!',
                name: 'Test Company',
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create company successfully when create is called with all fields populated', async () => {
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

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
            expect(service.create).toHaveBeenCalledTimes(1);
        });

        it('should create company successfully when create is called with structureType Administration', async () => {
            const createDto = new CreateCompanyDto({
                email: 'admin@example.com',
                password: 'Password123!',
                name: 'Admin Company',
                structureType: StructureType.Administration,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with structureType Association', async () => {
            const createDto = new CreateCompanyDto({
                email: 'assoc@example.com',
                password: 'Password123!',
                name: 'Association',
                structureType: StructureType.Association,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with structureType PublicCompanyOrSEM', async () => {
            const createDto = new CreateCompanyDto({
                email: 'public@example.com',
                password: 'Password123!',
                name: 'Public Company',
                structureType: StructureType.PublicCompanyOrSEM,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with structureType MutualCooperative', async () => {
            const createDto = new CreateCompanyDto({
                email: 'coop@example.com',
                password: 'Password123!',
                name: 'Cooperative',
                structureType: StructureType.MutualCooperative,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with structureType NGO', async () => {
            const createDto = new CreateCompanyDto({
                email: 'ngo@example.com',
                password: 'Password123!',
                name: 'NGO',
                structureType: StructureType.NGO,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus EURL', async () => {
            const createDto = new CreateCompanyDto({
                email: 'eurl@example.com',
                password: 'Password123!',
                name: 'EURL Company',
                legalStatus: LegalStatus.EURL,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus SA', async () => {
            const createDto = new CreateCompanyDto({
                email: 'sa@example.com',
                password: 'Password123!',
                name: 'SA Company',
                legalStatus: LegalStatus.SA,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus SAS', async () => {
            const createDto = new CreateCompanyDto({
                email: 'sas@example.com',
                password: 'Password123!',
                name: 'SAS Company',
                legalStatus: LegalStatus.SAS,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus SNC', async () => {
            const createDto = new CreateCompanyDto({
                email: 'snc@example.com',
                password: 'Password123!',
                name: 'SNC Company',
                legalStatus: LegalStatus.SNC,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus SCP', async () => {
            const createDto = new CreateCompanyDto({
                email: 'scp@example.com',
                password: 'Password123!',
                name: 'SCP Company',
                legalStatus: LegalStatus.SCP,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus SASU', async () => {
            const createDto = new CreateCompanyDto({
                email: 'sasu@example.com',
                password: 'Password123!',
                name: 'SASU Company',
                legalStatus: LegalStatus.SASU,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with legalStatus OTHER', async () => {
            const createDto = new CreateCompanyDto({
                email: 'other@example.com',
                password: 'Password123!',
                name: 'Other Company',
                legalStatus: LegalStatus.OTHER,
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with isValid set to true', async () => {
            const createDto = new CreateCompanyDto({
                email: 'valid@example.com',
                password: 'Password123!',
                name: 'Valid Company',
                isValid: true,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with optional address fields', async () => {
            const createDto = new CreateCompanyDto({
                email: 'address@example.com',
                password: 'Password123!',
                name: 'Address Company',
                streetNumber: '123',
                streetName: 'Main Street',
                postalCode: '12345',
                city: 'Test City',
                country: 'Test Country',
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });

        it('should create company successfully when create is called with partial address fields', async () => {
            const createDto = new CreateCompanyDto({
                email: 'partial@example.com',
                password: 'Password123!',
                name: 'Partial Address Company',
                city: 'Test City',
                isValid: false,
            });

            mockCompanyService.create.mockResolvedValue(undefined);

            await controller.create(createDto);

            expect(service.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('update', () => {
        it('should update company successfully when update is called with single field', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
            expect(service.update).toHaveBeenCalledTimes(1);
        });

        it('should update company successfully when update is called with multiple fields', async () => {
            const updateDto = new UpdateCompanyDto({
                name: 'Updated Company',
                email: 'updated@example.com',
                siretNumber: '98765432109876',
                isValid: true,
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company email successfully when update is called with new email', async () => {
            const updateDto = new UpdateCompanyDto({
                email: 'newemail@example.com',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company password successfully when update is called with new password', async () => {
            const updateDto = new UpdateCompanyDto({
                password: 'NewPassword123!',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company structureType successfully when update is called with new structureType', async () => {
            const updateDto = new UpdateCompanyDto({
                structureType: StructureType.Association,
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company legalStatus successfully when update is called with new legalStatus', async () => {
            const updateDto = new UpdateCompanyDto({
                legalStatus: LegalStatus.SAS,
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company isValid status successfully when update is called with new isValid value', async () => {
            const updateDto = new UpdateCompanyDto({
                isValid: true,
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company address fields successfully when update is called with new address fields', async () => {
            const updateDto = new UpdateCompanyDto({
                streetNumber: '456',
                streetName: 'New Street',
                postalCode: '54321',
                city: 'New City',
                country: 'New Country',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company siretNumber successfully when update is called with new siretNumber', async () => {
            const updateDto = new UpdateCompanyDto({
                siretNumber: '11111111111111',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update company nafCode successfully when update is called with new nafCode', async () => {
            const updateDto = new UpdateCompanyDto({
                nafCode: '1234Z',
            });

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });

        it('should update all company fields successfully when update is called with complete update data', async () => {
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

            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.update('507f1f77bcf86cd799439011', updateDto);

            expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
        });
    });

    describe('remove', () => {
        it('should delete company successfully when remove is called with valid id', async () => {
            mockCompanyService.remove.mockResolvedValue(undefined);

            await controller.remove('507f1f77bcf86cd799439011');

            expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
            expect(service.remove).toHaveBeenCalledTimes(1);
        });

        it('should delete company successfully when remove is called with different id', async () => {
            mockCompanyService.remove.mockResolvedValue(undefined);

            await controller.remove('507f1f77bcf86cd799439999');

            expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439999');
        });
    });

    describe('RolesGuard integration', () => {
        describe('findAll - no role required', () => {
            it('should allow access successfully when canActivate is called without authentication', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext();
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should allow access successfully when canActivate is called with USER role', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext({ role: Role.STUDENT });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should allow access successfully when canActivate is called with COMPANY role', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext({ role: Role.COMPANY });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should allow access successfully when canActivate is called with ADMIN role', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext({ role: Role.ADMIN });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });
        });

        describe('findOne - no role required', () => {
            it('should allow access successfully when canActivate is called without specific role', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext({ role: Role.STUDENT });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });
        });

        describe('create - no role required', () => {
            it('should allow any user to create company', () => {
                mockReflector.getAllAndOverride.mockReturnValue(undefined);

                const context = createMockExecutionContext();
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });
        });

        describe('update - requires COMPANY or ADMIN role', () => {
            it('should allow COMPANY role to update successfully when canActivate is called with COMPANY role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.COMPANY });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should allow ADMIN role to update successfully when canActivate is called with ADMIN role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.ADMIN });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should deny USER role when canActivate is called with USER role for update', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.STUDENT });

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('Access denied');
            });

            it('should deny access when user has no role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({});

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('User role not found');
            });

            it('should deny access when canActivate is called and user is not authenticated', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext(undefined);

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('User role not found');
            });
        });

        describe('remove - requires COMPANY or ADMIN role', () => {
            it('should allow COMPANY role to delete successfully when canActivate is called with COMPANY role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.COMPANY });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should allow ADMIN role to delete successfully when canActivate is called with ADMIN role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.ADMIN });
                const result = rolesGuard.canActivate(context);

                expect(result).toBe(true);
            });

            it('should deny USER role when canActivate is called with USER role for delete', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({ role: Role.STUDENT });

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('Access denied');
            });

            it('should deny access when user has no role', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext({});

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('User role not found');
            });

            it('should deny access when canActivate is called and user is null for delete', () => {
                mockReflector.getAllAndOverride.mockReturnValue([Role.COMPANY, Role.ADMIN]);

                const context = createMockExecutionContext(null);

                expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
                expect(() => rolesGuard.canActivate(context)).toThrow('User role not found');
            });
        });
    });

    describe('Edge cases and error scenarios', () => {
        describe('findOne edge cases', () => {
            it('should throw error when findOne is called and service throws database error', async () => {
                mockCompanyService.findOne.mockRejectedValue(new Error('Database error'));

                await expect(controller.findOne('507f1f77bcf86cd799439011')).rejects.toThrow('Database error');
            });
        });

        describe('create edge cases', () => {
            it('should throw error when create is called and service throws creation error', async () => {
                const createDto = new CreateCompanyDto({
                    email: 'test@example.com',
                    password: 'Password123!',
                    name: 'Test Company',
                    isValid: false,
                });

                mockCompanyService.create.mockRejectedValue(new Error('Creation failed'));

                await expect(controller.create(createDto)).rejects.toThrow('Creation failed');
            });

            it('should throw ConflictException when create fails with duplicate key error (code 11000)', async () => {
                const createDto = new CreateCompanyDto({
                    email: 'dup@example.com',
                    password: 'Password123!',
                    name: 'Dup Company',
                });

                const dupErr: any = new Error('Duplicate');
                dupErr.code = 11000;
                mockCompanyService.create.mockRejectedValue(dupErr);

                await expect(controller.create(createDto)).rejects.toThrow(
                    'Company with email dup@example.com already exists',
                );
            });

            it('should create company successfully when create is called with empty optional strings', async () => {
                const createDto = new CreateCompanyDto({
                    email: 'empty@example.com',
                    password: 'Password123!',
                    name: 'Empty Fields Company',
                    siretNumber: '',
                    nafCode: '',
                    streetNumber: '',
                    streetName: '',
                    postalCode: '',
                    city: '',
                    country: '',
                    isValid: false,
                });

                mockCompanyService.create.mockResolvedValue(undefined);

                await controller.create(createDto);

                expect(service.create).toHaveBeenCalledWith(createDto);
            });
        });

        describe('update edge cases', () => {
            it('should throw error when update is called and service throws update error', async () => {
                const updateDto = new UpdateCompanyDto({
                    name: 'Updated Company',
                });

                mockCompanyService.update.mockRejectedValue(new Error('Update failed'));

                await expect(controller.update('507f1f77bcf86cd799439011', updateDto)).rejects.toThrow('Update failed');
            });

            it('should update successfully when update is called with empty object', async () => {
                const updateDto = new UpdateCompanyDto({});

                mockCompanyService.update.mockResolvedValue(undefined);

                await controller.update('507f1f77bcf86cd799439011', updateDto);

                expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
            });

            it('should update company isValid to false successfully when update is called with isValid false', async () => {
                const updateDto = new UpdateCompanyDto({
                    isValid: false,
                });

                mockCompanyService.update.mockResolvedValue(undefined);

                await controller.update('507f1f77bcf86cd799439011', updateDto);

                expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
            });
        });

        describe('remove edge cases', () => {
            it('should throw error when remove is called and service throws deletion error', async () => {
                mockCompanyService.remove.mockRejectedValue(new Error('Deletion failed'));

                await expect(controller.remove('507f1f77bcf86cd799439011')).rejects.toThrow('Deletion failed');
            });
        });

        describe('findAll edge cases', () => {
            it('should throw error when findAll is called and service throws database error', async () => {
                mockCompanyService.findAll.mockRejectedValue(new Error('Database error'));

                await expect(controller.findAll()).rejects.toThrow('Database error');
            });

            it('should return companies successfully when findAll is called with undefined optional fields', async () => {
                const companies = [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        email: 'test@example.com',
                        name: 'Test Company',
                        siretNumber: undefined,
                        nafCode: undefined,
                        structureType: undefined,
                        legalStatus: undefined,
                        streetNumber: undefined,
                        streetName: undefined,
                        postalCode: undefined,
                        city: undefined,
                        country: undefined,
                        isValid: undefined,
                    },
                ];

                mockCompanyService.findAll.mockResolvedValue(companies);

                const result = await controller.findAll();

                expect(result).toHaveLength(1);
                expect(result[0].siretNumber).toBeUndefined();
                expect(result[0].isValid).toBeUndefined();
            });
        });
    });

    describe('Integration scenarios', () => {
        it('should create and find company successfully when performing create then findOne operations', async () => {
            const createDto = new CreateCompanyDto({
                email: 'integration@example.com',
                password: 'Password123!',
                name: 'Integration Company',
                isValid: true,
            });

            const createdCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'integration@example.com',
                name: 'Integration Company',
                isValid: true,
            };

            mockCompanyService.create.mockResolvedValue(undefined);
            mockCompanyService.findOne.mockResolvedValue(createdCompany);

            await controller.create(createDto);
            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result._id).toBe('507f1f77bcf86cd799439011');
            expect(result.email).toBe('integration@example.com');
        });

        it('should create update and verify company successfully when performing create update findOne operations', async () => {
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

            const updatedCompany = {
                _id: '507f1f77bcf86cd799439011',
                email: 'update-test@example.com',
                name: 'Updated Test Company',
                isValid: true,
            };

            mockCompanyService.create.mockResolvedValue(undefined);
            mockCompanyService.update.mockResolvedValue(undefined);
            mockCompanyService.findOne.mockResolvedValue(updatedCompany);

            await controller.create(createDto);
            await controller.update('507f1f77bcf86cd799439011', updateDto);
            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result.name).toBe('Updated Test Company');
            expect(result.isValid).toBe(true);
        });

        it('should verify company is not in list successfully when performing findAll remove findAll operations', async () => {
            const companiesBeforeDelete = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'delete-test@example.com',
                    name: 'Delete Test Company',
                    isValid: false,
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'keep@example.com',
                    name: 'Keep Company',
                    isValid: false,
                },
            ];

            const companiesAfterDelete = [
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'keep@example.com',
                    name: 'Keep Company',
                    isValid: false,
                },
            ];

            mockCompanyService.findAll.mockResolvedValueOnce(companiesBeforeDelete);
            mockCompanyService.remove.mockResolvedValue(undefined);
            mockCompanyService.findAll.mockResolvedValueOnce(companiesAfterDelete);

            const beforeDelete = await controller.findAll();
            expect(beforeDelete).toHaveLength(2);

            await controller.remove('507f1f77bcf86cd799439011');

            const afterDelete = await controller.findAll();
            expect(afterDelete).toHaveLength(1);
            expect(afterDelete[0]._id).toBe('507f1f77bcf86cd799439012');
        });

        it('should handle deletion successfully when remove is called with non-existent company id', async () => {
            mockCompanyService.remove.mockResolvedValue(undefined);

            await controller.remove('507f1f77bcf86cd799999999');

            expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799999999');
        });
    });

    describe('DTO validation scenarios', () => {
        it('should accept all StructureType enum values successfully when create is called with each enum value', async () => {
            for (const structureType of Object.values(StructureType)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${structureType}@example.com`,
                    password: 'Password123!',
                    name: `Test ${structureType}`,
                    structureType: structureType,
                    isValid: false,
                });

                mockCompanyService.create.mockResolvedValue(undefined);

                await controller.create(createDto);

                expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ structureType }));
            }
        });

        it('should accept all LegalStatus enum values successfully when create is called with each enum value', async () => {
            for (const legalStatus of Object.values(LegalStatus)) {
                const createDto = new CreateCompanyDto({
                    email: `test-${legalStatus}@example.com`,
                    password: 'Password123!',
                    name: `Test ${legalStatus}`,
                    legalStatus: legalStatus,
                    isValid: false,
                });

                mockCompanyService.create.mockResolvedValue(undefined);

                await controller.create(createDto);

                expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ legalStatus }));
            }
        });
    });

    describe('Response transformation', () => {
        it('should transform company entities to DTOs successfully when findAll is called', async () => {
            const companies = [
                {
                    _id: '507f1f77bcf86cd799439011',
                    email: 'test1@example.com',
                    password: 'hashedPassword1',
                    name: 'Company 1',
                    isValid: true,
                },
                {
                    _id: '507f1f77bcf86cd799439012',
                    email: 'test2@example.com',
                    password: 'hashedPassword2',
                    name: 'Company 2',
                    isValid: false,
                },
            ];

            mockCompanyService.findAll.mockResolvedValue(companies);

            const result = await controller.findAll();

            expect(result.every((company) => company instanceof CompanyDto)).toBe(true);
            expect(result).toHaveLength(2);
        });

        it('should transform company entity to DTO successfully when findOne is called', async () => {
            const company = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                password: 'hashedPassword',
                name: 'Test Company',
                isValid: true,
            };

            mockCompanyService.findOne.mockResolvedValue(company);

            const result = await controller.findOne('507f1f77bcf86cd799439011');

            expect(result).toBeInstanceOf(CompanyDto);
        });

        it('mapToDto should map posts to PostDto when called directly', () => {
            const company: any = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                name: 'Test Company',
                posts: [{ _id: 'p1', title: 'Post 1', description: 'd' }],
            };

            // Call private method via bracket access
            const dto = (controller as any).mapToDto(company);

            expect(dto).toBeInstanceOf(CompanyDto);
            expect(dto.posts).toBeDefined();
            expect(dto.posts[0]).toBeDefined();
        });
    });

    describe('findPendingValidation', () => {
        it('should return paginated pending companies when called with valid query', async () => {
            const mockPaginatedResult = {
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'Pending Company 1',
                        email: 'pending1@test.com',
                        isValid: false,
                    },
                    {
                        _id: '507f1f77bcf86cd799439012',
                        name: 'Pending Company 2',
                        email: 'pending2@test.com',
                        isValid: false,
                    },
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockCompanyService.findPendingValidation.mockResolvedValue(mockPaginatedResult);

            const query = { page: 1, limit: 10 } as any;
            const result = await controller.findPendingValidation(query);

            expect(service.findPendingValidation).toHaveBeenCalledWith(query);
            expect(result.data).toHaveLength(2);
            expect(result.total).toBe(2);
            expect(result.data[0]).toBeInstanceOf(CompanyDto);
        });

        it('should transform all companies to CompanyDto', async () => {
            const mockPaginatedResult = {
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        name: 'Company 1',
                        email: 'c1@test.com',
                        password: 'hashed',
                        isValid: false,
                    },
                ],
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            };

            mockCompanyService.findPendingValidation.mockResolvedValue(mockPaginatedResult);

            const query = { page: 1, limit: 10 } as any;
            const result = await controller.findPendingValidation(query);

            expect(result.data.every((company) => company instanceof CompanyDto)).toBe(true);
        });

        it('should handle empty results', async () => {
            const mockPaginatedResult = {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                hasNext: false,
                hasPrev: false,
            };

            mockCompanyService.findPendingValidation.mockResolvedValue(mockPaginatedResult);

            const query = { page: 1, limit: 10 } as any;
            const result = await controller.findPendingValidation(query);

            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
        });
    });

    describe('validateCompany', () => {
        it('should call service.update with isValid=true when validateCompany is called', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: 'Test reason' };
            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.validateCompany(companyId, dto);

            expect(service.update).toHaveBeenCalledWith(companyId, {
                isValid: true,
                rejected: { isRejected: false, rejectionReason: undefined, rejectedAt: undefined, modifiedAt: undefined },
            });
        });

        it('should not throw error when company exists', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: undefined };
            mockCompanyService.update.mockResolvedValue(undefined);

            await expect(controller.validateCompany(companyId, dto)).resolves.not.toThrow();
        });

        it('should propagate errors from service', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: undefined };
            mockCompanyService.update.mockRejectedValue(new NotFoundException('Company not found'));

            await expect(controller.validateCompany(companyId, dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('rejectCompany', () => {
        it('should call service.update with isValid=false when rejectCompany is called', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: 'Invalid SIRET' };
            mockCompanyService.update.mockResolvedValue(undefined);

            await controller.rejectCompany(companyId, dto);

            expect(service.update).toHaveBeenCalledWith(companyId, expect.objectContaining({
                isValid: false,
                rejected: expect.objectContaining({
                    isRejected: true,
                    rejectionReason: 'Invalid SIRET',
                }),
            }));
            
            // Verify rejectedAt is a Date
            const callArgs = (service.update as jest.Mock).mock.calls[0][1];
            expect(callArgs.rejected.rejectedAt).toBeInstanceOf(Date);
        });

        it('should not throw error when company exists', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: 'Test rejection' };
            mockCompanyService.update.mockResolvedValue(undefined);

            await expect(controller.rejectCompany(companyId, dto)).resolves.not.toThrow();
        });

        it('should propagate errors from service', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            const dto = { rejectionReason: 'Test rejection' };
            mockCompanyService.update.mockRejectedValue(new NotFoundException('Company not found'));

            await expect(controller.rejectCompany(companyId, dto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('isValid', () => {
        it('should return { isValid: true } when company is valid', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            mockCompanyService.isValid.mockResolvedValue(true);

            const result = await controller.isValid(companyId);

            expect(service.isValid).toHaveBeenCalledWith(companyId);
            expect(result).toEqual({ isValid: true });
        });

        it('should return { isValid: false } when company is not valid', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            mockCompanyService.isValid.mockResolvedValue(false);

            const result = await controller.isValid(companyId);

            expect(service.isValid).toHaveBeenCalledWith(companyId);
            expect(result).toEqual({ isValid: false });
        });

        it('should propagate NotFoundException when company does not exist', async () => {
            const companyId = '507f1f77bcf86cd799439011';
            mockCompanyService.isValid.mockRejectedValue(new NotFoundException('Company with id 507f1f77bcf86cd799439011 not found'));

            await expect(controller.isValid(companyId)).rejects.toThrow(NotFoundException);
            await expect(controller.isValid(companyId)).rejects.toThrow('Company with id 507f1f77bcf86cd799439011 not found');
        });

        it('should call service with correct companyId', async () => {
            const companyId = '507f1f77bcf86cd799439012';
            mockCompanyService.isValid.mockResolvedValue(true);

            await controller.isValid(companyId);

            expect(service.isValid).toHaveBeenCalledTimes(1);
            expect(service.isValid).toHaveBeenCalledWith(companyId);
        });
    });
});
