import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from '../../../src/seed/seed.service';
import { AdminService } from '../../../src/admin/admin.service';
import { ForumService } from '../../../src/forum/forum.service';
import * as fs from 'fs';

// Mock fs and crypto modules
jest.mock('fs', () => ({
    writeFileSync: jest.fn(),
}));
jest.mock('crypto', () => ({
    randomBytes: jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('mocked_password'),
    }),
}));

describe('SeedService', () => {
    let service: SeedService;
    let adminService: jest.Mocked<AdminService>;
    let forumService: jest.Mocked<ForumService>;

    const mockAdminService = {
        count: jest.fn(),
        create: jest.fn(),
    };

    const mockForumService = {
        findOneByCompanyId: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SeedService,
                { provide: AdminService, useValue: mockAdminService },
                { provide: ForumService, useValue: mockForumService },
            ],
        }).compile();

        service = module.get<SeedService>(SeedService);
        adminService = module.get(AdminService);
        forumService = module.get(ForumService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('run', () => {
        it('should create admin and credentials file if no admin exists', async () => {
            adminService.count.mockResolvedValue(0);
            forumService.findOneByCompanyId.mockResolvedValue({} as any); // Forum exists

            await service.run();

            expect(adminService.count).toHaveBeenCalled();
            expect(adminService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'admin@admin.admin',
                    password: 'mocked_password',
                }),
            );

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                'ADMIN-CREDENTIALS.txt',
                expect.stringContaining('mocked_password'),
            );
        });

        it('should not create admin if admin already exists', async () => {
            adminService.count.mockResolvedValue(1);
            forumService.findOneByCompanyId.mockResolvedValue({} as any); // Forum exists

            await service.run();

            expect(adminService.count).toHaveBeenCalled();
            expect(adminService.create).not.toHaveBeenCalled();

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should create general forum if it does not exist', async () => {
            adminService.count.mockResolvedValue(1); // Admin exists
            forumService.findOneByCompanyId.mockResolvedValue(null);

            await service.run();

            expect(forumService.findOneByCompanyId).toHaveBeenCalled();
            expect(forumService.create).toHaveBeenCalled();
        });

        it('should not create general forum if it already exists', async () => {
            adminService.count.mockResolvedValue(1); // Admin exists
            forumService.findOneByCompanyId.mockResolvedValue({} as any);

            await service.run();

            expect(forumService.findOneByCompanyId).toHaveBeenCalled();
            expect(forumService.create).not.toHaveBeenCalled();
        });
    });
});
