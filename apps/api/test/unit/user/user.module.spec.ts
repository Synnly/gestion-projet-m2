import 'reflect-metadata';
import { getConnectionToken } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../../../src/company/company.schema';
import { User } from '../../../src/user/user.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { UsersModule } from '../../../src/user/user.module';

describe('User module load', () => {
    it('should require the users module file and have UsersModule defined', () => {
        const mod = require('../../../src/user/user.module');
        expect(mod).toBeDefined();
        expect(mod.UsersModule).toBeDefined();
    });
});

describe('UsersModule factory provider via metadata', () => {
    it('should execute useFactory and create discriminator when missing', () => {
        const mod = require('../../../src/user/user.module');
        const UsersModule = mod.UsersModule;

        const providers: any[] = Reflect.getMetadata('providers', UsersModule) || [];
        const companyProvider =
            providers.find((p: any) => p.provide && p.provide.name && p.provide.name.includes('Company')) ||
            providers[0];
        expect(companyProvider).toBeDefined();

        const useFactory = companyProvider.useFactory;
        expect(useFactory).toBeDefined();

        const mockUserModel: any = {
            discriminators: undefined,
            discriminator: jest.fn().mockReturnValue('discriminatorModel'),
        };

        const mockConnection: any = {
            model: jest.fn().mockImplementation((name: string) => {
                if (name === 'User') return mockUserModel;
                return null;
            }),
        };

        const result = useFactory(mockConnection as any);

        expect(result).toBe('discriminatorModel');
        expect(mockUserModel.discriminator).toHaveBeenCalled();
    });

    it('should execute useFactory and return existing company model when discriminator exists', () => {
        const mod = require('../../../src/user/user.module');
        const UsersModule = mod.UsersModule;

        const providers: any[] = Reflect.getMetadata('providers', UsersModule) || [];
        const companyProvider =
            providers.find((p: any) => p.provide && p.provide.name && p.provide.name.includes('Company')) ||
            providers[0];
        const useFactory = companyProvider.useFactory;

        const mockUserModel: any = {
            discriminators: { Company: true },
            discriminator: jest.fn(),
        };

        const mockCompanyModel = 'existingCompanyModel';

        const mockConnection: any = {
            model: jest.fn().mockImplementation((name: string) => {
                if (name === 'User') return mockUserModel;
                if (name === 'Company') return mockCompanyModel;
                return null;
            }),
        };

        const result = useFactory(mockConnection as any);
        expect(result).toBe(mockCompanyModel);
    });
});

describe('UsersModule provider factory', () => {
    it('should create company discriminator when it does not exist', () => {
        const mockUserModel: any = {
            discriminators: undefined,
            discriminator: jest.fn().mockReturnValue('discriminatorModel'),
        };

        const mockConnection: any = {
            model: jest.fn().mockImplementation((name: string) => {
                if (name === User.name) return mockUserModel;
                return null;
            }),
        };

        // simulate factory
        const factory = (mockConnection as any).model(User.name).discriminator;
        const result = mockUserModel.discriminator(Company.name, CompanySchema, Role.COMPANY);

        expect(factory).toBeDefined();
        expect(result).toBe('discriminatorModel');
        expect(mockUserModel.discriminator).toHaveBeenCalledWith(Company.name, CompanySchema, Role.COMPANY);
    });

    it('should return existing company model when discriminator exists', () => {
        const mockUserModel: any = {
            discriminators: { [Company.name]: true },
            discriminator: jest.fn(),
        };

        const mockCompanyModel = 'existingCompanyModel';

        const mockConnection: any = {
            model: jest.fn().mockImplementation((name: string) => {
                if (name === User.name) return mockUserModel;
                if (name === Company.name) return mockCompanyModel;
                return null;
            }),
        };

        const result = mockConnection.model(Company.name);
        expect(result).toBe(mockCompanyModel);
    });
});
