import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';

import { CompanyController } from '../../../src/company/company.controller';
import { CompanyService } from '../../../src/company/company.service';
import { Company } from '../../../src/company/company.schema';
import { PostService } from '../../../src/post/post.service';
import { AuthService } from '../../../src/auth/auth.service';
import { S3Service } from '../../../src/s3/s3.service';

describe('CompanyModule', () => {
    let module: TestingModule;
    let companyService: CompanyService;
    let companyController: CompanyController;

    // --- MOCKS ---

    const mockCompanyModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        // ...
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockSchedulerRegistry = {
        addCronJob: jest.fn(),
        deleteCronJob: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const mockPostService = {
        findAllByCompany: jest.fn(),
        create: jest.fn(),
    };

    const mockAuthService = {
        logout: jest.fn(),
    };

    const mockS3Service = {
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [CompanyController],
            providers: [
                CompanyService,
                {
                    provide: getModelToken(Company.name),
                    useValue: mockCompanyModel,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: SchedulerRegistry,
                    useValue: mockSchedulerRegistry,
                },
                {
                    provide: JwtService, // For eventual Guards
                    useValue: mockJwtService,
                },
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
                {
                    provide: S3Service,
                    useValue: mockS3Service,
                },
            ],
        }).compile();

        companyService = module.get<CompanyService>(CompanyService);
        companyController = module.get<CompanyController>(CompanyController);
    });

    it('should be defined when module is instantiated', () => {
        expect(module).toBeDefined();
    });

    it('should provide CompanyService when module is instantiated', () => {
        expect(companyService).toBeDefined();
        expect(companyService).toBeInstanceOf(CompanyService);
    });

    it('should provide CompanyController when module is instantiated', () => {
        expect(companyController).toBeDefined();
        expect(companyController).toBeInstanceOf(CompanyController);
    });

    it('should export CompanyService when module is instantiated', () => {
        expect(companyService).toBeDefined();
    });
});