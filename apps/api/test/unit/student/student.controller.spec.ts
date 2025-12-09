import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from '../../../src/student/student.controller';
import { StudentService } from '../../../src/student/student.service';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Role } from '../../../src/common/roles/roles.enum';

describe('StudentController', () => {
    let controller: StudentController;
    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        createMany: jest.fn(),
    } as any;

    beforeEach(async () => {
        const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
        const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [StudentController],
            providers: [{ provide: StudentService, useValue: mockService }],
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
        const createMockFile = (content: any, mimetype = 'application/json') => ({
            fieldname: 'file',
            originalname: 'students.json',
            encoding: '7bit',
            mimetype,
            buffer: Buffer.from(JSON.stringify(content)),
            size: 100,
        } as Express.Multer.File);

        it('should throw BadRequestException if file is undefined', async () => {
            await expect(controller.import(undefined as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if mimetype is not JSON nor CSV', async () => {
            const file = createMockFile([], 'image/png');
            await expect(controller.import(file)).rejects.toThrow('File must be a JSON or CSV');
        });

        it('should throw BadRequestException if content is not an array', async () => {
            const file = createMockFile({ email: 'test@test.com' });
            await expect(controller.import(file)).rejects.toThrow('JSON content must be an array');
        });

        it('should throw BadRequestException if JSON is invalid', async () => {
            const file = {
                mimetype: 'application/json',
                buffer: Buffer.from('{ bad json '),
            } as any;
            await expect(controller.import(file)).rejects.toThrow('Invalid JSON file format');
        });

        it('should throw BadRequestException if DTO validation fails (invalid email)', async () => {
            const invalidData = [{
                firstName: 'Toto',
                lastName: 'Test',
                email: 'invalid-email'
            }];
            const file = createMockFile(invalidData);

            await expect(controller.import(file)).rejects.toThrow(BadRequestException);
        });

        it('should call service.createMany with correct params on success', async () => {
            const validData = [{
                firstName: 'Toto',
                lastName: 'Test',
                email: 'toto@univ.fr',
                studentNumber: '1'
            }];
            const file = createMockFile(validData);
            
            mockService.createMany.mockResolvedValue({ added: 1 });

            await controller.import(file, true);

            expect(mockService.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([expect.objectContaining({ email: 'toto@univ.fr' })]), 
                true
            );
        });

        it('should be protected with ADMIN role', () => {
            const roles = Reflect.getMetadata('roles', controller.import);

            expect(roles).toBeDefined(); 
            expect(roles).toContain(Role.ADMIN);
        });
    });
});
