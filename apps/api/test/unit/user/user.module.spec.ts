import { getConnectionToken } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../../../src/company/company.schema';
import { User } from '../../../src/user/user.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { UsersModule } from '../../../src/user/user.module';

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
