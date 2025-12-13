import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from '../../../src/student/student.controller';
import { StudentService } from '../../../src/student/student.service';
import { BadRequestException, NotFoundException, ConflictException, PayloadTooLargeException } from '@nestjs/common';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Role } from '../../../src/common/roles/roles.enum';
import { ConfigService } from '@nestjs/config';

describe('StudentController', () => {
    let controller: StudentController;
    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        createMany: jest.fn(),
        parseFileContent: jest.fn(),
    } as any;

    const TEST_MAX_ROWS = 1000; 
    const TEST_MAX_SIZE = 2 * 1024 * 1024;
    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'IMPORT_MAX_SIZE_BYTES') return TEST_MAX_SIZE; // 2 Mo
            if (key === 'IMPORT_MAX_ROWS') return TEST_MAX_ROWS; // 1000 records
            return null;
        }),
    };;

    beforeEach(async () => {
        const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
        const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StudentController],
            providers: [
                { provide: StudentService, useValue: mockService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(RolesGuard)
            .useValue(mockRolesGuard)
            .compile();

        controller = module.get<StudentController>(StudentController);
        jest.clearAllMocks();
    });

    it('findAll returns mapped DTOs', async () => {
        mockService.findAll.mockResolvedValue([{ email: 'a@b.c' }]);
        const res = await controller.findAll();
        expect(res).toHaveLength(1);
        expect(res[0]).toHaveProperty('email', 'a@b.c');
    });

    it('findOne throws NotFoundException when no student', async () => {
        mockService.findOne.mockResolvedValue(null);
        await expect(controller.findOne('1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('create calls service.create and handles duplicate error', async () => {
        mockService.create.mockRejectedValueOnce({ code: 11000 });
        await expect(controller.create({ email: 'a' } as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('findOne returns mapped DTO when student exists', async () => {
        const student = { _id: '1', email: 'a@b.c', firstName: 'F', lastName: 'L' } as any;
        mockService.findOne.mockResolvedValue(student);
        const res = await controller.findOne('1');
        expect(res).toHaveProperty('email', 'a@b.c');
        expect(res).toHaveProperty('firstName', 'F');
    });

    it('create success calls service.create', async () => {
        mockService.create.mockResolvedValue(undefined);
        const dto = {
            email: 'ok@example.com',
            firstName: 'A',
            lastName: 'B',
        } as any;
        await expect(controller.create(dto)).resolves.toBeUndefined();
        expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('create rethrows non-duplicate errors', async () => {
        mockService.create.mockRejectedValueOnce(new Error('boom'));
        await expect(controller.create({ email: 'a' } as any)).rejects.toThrow('boom');
    });

    it('update calls studentService.update', async () => {
        mockService.update.mockResolvedValue(undefined);
        const dto = { email: 'u@example.com' } as any;
        await controller.update('1', dto);
        expect(mockService.update).toHaveBeenCalledWith('1', dto);
    });

    it('remove calls studentService.remove', async () => {
        mockService.remove.mockResolvedValue(undefined);
        await controller.remove('1');
        expect(mockService.remove).toHaveBeenCalledWith('1');
    });

    describe('import', () => {
        const mockFile = {
            fieldname: 'file',
            originalname: 'students.json',
            encoding: '7bit',
            mimetype: 'application/json',
            buffer: Buffer.from('[]'),
            size: 100,
        } as Express.Multer.File;

        it('should be protected with ADMIN role', () => {
            const roles = Reflect.getMetadata('roles', controller.import);
            expect(roles).toBeDefined();
            expect(roles).toContain(Role.ADMIN);
        });

        it('should throw BadRequestException if parseFileContent throws (e.g. invalid JSON)', async () => {
            mockService.parseFileContent.mockRejectedValue(new BadRequestException('Invalid file format'));
            
            await expect(controller.import(mockFile)).rejects.toThrow('Invalid file format');
        });

        it('should throw BadRequestException if content parsed is not an array (logic from service)', async () => {
            mockService.parseFileContent.mockRejectedValue(new BadRequestException('JSON content must be an array'));
            
            await expect(controller.import(mockFile)).rejects.toThrow('JSON content must be an array');
        });

        it('should SKIP invalid DTOs (e.g. invalid email) and return skipped count', async () => {
            const invalidData = [{ firstName: 'Toto', lastName: 'Test', email: 'invalid-email' }];
            
            mockService.parseFileContent.mockResolvedValue(invalidData);
            
            mockService.createMany.mockResolvedValue({ added: 0, skipped: 0 });

            const result = await controller.import(mockFile);

            expect(mockService.createMany).toHaveBeenCalledWith([], false); 
            expect(result).toEqual({ added: 0, skipped: 1 });
        });

        it('should SKIP duplicates found within the file itself', async () => {
            const duplicateData = [
                { email: 'a@a.com', studentNumber: '1', firstName: 'John', lastName: 'Doe' }, 
                { email: 'a@a.com', studentNumber: '2', firstName: 'Jane', lastName: 'Doe' }
            ];
            
            mockService.parseFileContent.mockResolvedValue(duplicateData);
            
            mockService.createMany.mockResolvedValue({ added: 1, skipped: 0 });

            const result = await controller.import(mockFile);

            expect(mockService.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ email: 'a@a.com', studentNumber: '1' })]), 
                false
            );
            expect(mockService.createMany.mock.calls[0][0]).toHaveLength(1);

            expect(result).toEqual({ added: 1, skipped: 1 });
        });

        it('should call service.createMany with correct params on success', async () => {
            const validData = [{
                firstName: 'Toto',
                lastName: 'Test',
                email: 'toto@univ.fr',
                studentNumber: '1'
            }];
            
            mockService.parseFileContent.mockResolvedValue(validData);
            mockService.createMany.mockResolvedValue({ added: 1, skipped: 0 });

            await controller.import(mockFile); 

            expect(mockService.createMany).toHaveBeenCalledWith(expect.any(Array), false);
        });

        it('should throw BadRequestException if service throws "Too many records"', async () => {
            mockService.parseFileContent.mockRejectedValue(
                new BadRequestException('File contains too many records')
            );

            await expect(controller.import(mockFile)).rejects.toThrow(/too many records/);
            expect(mockService.createMany).not.toHaveBeenCalled();
        });
    });
});
