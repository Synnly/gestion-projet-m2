import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AdminService } from '../../../src/admin/admin.service';
import { Admin } from '../../../src/admin/admin.schema';
import { CreateAdminDto } from '../../../src/admin/dto/createAdminDto';

describe('AdminService', () => {
    let service: AdminService;
    let model: any;

    const mockExec = jest.fn();

    // Mock class for the Model
    class MockAdminModel {
        save: any;
        constructor(public data: any) {
            this.save = jest.fn().mockResolvedValue(this.data);
        }
        static countDocuments = jest.fn().mockReturnValue({ exec: mockExec });
        static find = jest.fn().mockReturnValue({ exec: mockExec });
        static findById = jest.fn().mockReturnValue({ exec: mockExec });
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminService,
                {
                    provide: getModelToken(Admin.name),
                    useValue: MockAdminModel,
                },
            ],
        }).compile();

        service = module.get<AdminService>(AdminService);
        model = module.get(getModelToken(Admin.name));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('count', () => {
        it('should return the count of admins', async () => {
            mockExec.mockResolvedValue(5);

            const result = await service.count();
            expect(result).toBe(5);
            expect(MockAdminModel.countDocuments).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return an array of admins', async () => {
            const admins = [{ email: 'admin@test.com' }];
            mockExec.mockResolvedValue(admins);

            const result = await service.findAll();
            expect(result).toEqual(admins);
            expect(MockAdminModel.find).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a single admin', async () => {
            const admin = { email: 'admin@test.com' };
            mockExec.mockResolvedValue(admin);

            const result = await service.findOne('someId');
            expect(result).toEqual(admin);
            expect(MockAdminModel.findById).toHaveBeenCalledWith('someId');
        });

        it('should return null if admin not found', async () => {
            mockExec.mockResolvedValue(null);

            const result = await service.findOne('someId');
            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new admin', async () => {
            const dto: CreateAdminDto = {
                email: 'newadmin@test.com',
                password: 'Password123!Password123!Password123!',
            };

            await service.create(dto);
        });
    });
});
