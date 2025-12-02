import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from '../../../src/student/student.service';
import { Student } from '../../../src/student/student.schema';
import { Role } from '../../../src/common/roles/roles.enum';

describe('StudentService', () => {
    let service: StudentService;
    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [StudentService, { provide: getModelToken(Student.name), useValue: mockModel }],
        }).compile();

        service = module.get<StudentService>(StudentService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll calls model.find with deletedAt filter', async () => {
        const expected = [{ email: 'a@b.c' }];
        mockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue(expected) });

        const res = await service.findAll();
        expect(mockModel.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
        expect(res).toEqual(expected);
    });

    it('findOne returns result from model.findOne', async () => {
        const expected = { _id: '1', email: 'a@b.c' };
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(expected) });

        const res = await service.findOne('1');
        expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', deletedAt: { $exists: false } });
        expect(res).toEqual(expected);
    });

    it('create calls model.create with role STUDENT', async () => {
        const dto = { email: 'x@y.z' } as any;
        mockModel.create.mockResolvedValue(undefined);

        await service.create(dto);
        expect(mockModel.create).toHaveBeenCalledWith({ ...dto, role: Role.STUDENT });
    });

    it('update updates existing student when found', async () => {
        const saveMock = jest.fn().mockResolvedValue(undefined);
        const studentDoc: any = { save: saveMock };
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(studentDoc) });

        await service.update('1', { email: 'new@e.mail' } as any);
        expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', deletedAt: { $exists: false } });
        expect(saveMock).toHaveBeenCalled();
    });

    it('update creates when student not found', async () => {
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
        mockModel.create.mockResolvedValue(undefined);

        await service.update('1', { email: 'new@e.mail' } as any);
        expect(mockModel.create).toHaveBeenCalledWith({ email: 'new@e.mail', role: Role.STUDENT });
    });

    it('update assigns properties to found student', async () => {
        const saveMock = jest.fn().mockResolvedValue(undefined);
        const studentDoc: any = { email: 'old@mail', save: saveMock };
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(studentDoc) });

        await service.update('1', { email: 'updated@mail' } as any);
        expect(studentDoc.email).toBe('updated@mail');
        expect(saveMock).toHaveBeenCalled();
    });

    it('remove resolves when document updated', async () => {
        mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: '1' }) });

        await expect(service.remove('1')).resolves.toBeUndefined();
        expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: '1', deletedAt: { $exists: false } },
            { $set: { deletedAt: expect.any(Date) } },
        );
    });

    it('remove calls findOneAndUpdate and throws when not found', async () => {
        mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        await expect(service.remove('1')).rejects.toThrow();
        expect(mockModel.findOneAndUpdate).toHaveBeenCalled();
    });
});
