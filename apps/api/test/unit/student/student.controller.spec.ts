import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from '../../../src/student/student.controller';
import { StudentService } from '../../../src/student/student.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';

describe('StudentController', () => {
    let controller: StudentController;
    const mockService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
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
            password: 'StrongP@ss1',
            role: 'STUDENT',
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
});
