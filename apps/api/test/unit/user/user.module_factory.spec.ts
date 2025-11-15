import 'reflect-metadata';

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
