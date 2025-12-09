import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from '../../../src/student/student.service';
import { Student } from '../../../src/student/student.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { ConflictException } from '@nestjs/common';
import { MailerService } from '../../../src/mailer/mailer.service'; // 1. Import du service

describe('StudentService', () => {
    let service: StudentService;
    let mailerService: MailerService;

    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        insertMany: jest.fn(),
    } as any;

    const mockMailerService = {
        sendAccountCreationEmail: jest.fn().mockResolvedValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudentService,
                { provide: getModelToken(Student.name), useValue: mockModel },
                { provide: MailerService, useValue: mockMailerService },
            ],
        }).compile();

        service = module.get<StudentService>(StudentService);
        mailerService = module.get<MailerService>(MailerService);
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


    describe('createMany', () => {
        const dtos = [
            { email: 'new1@test.com', studentNumber: '1', firstName: 'A', lastName: 'B' },
            { email: 'exist@test.com', studentNumber: '2', firstName: 'C', lastName: 'D' },
        ];

        it('should insert all students if no duplicates found (Strict Mode)', async () => {
            mockModel.find.mockResolvedValue([]); 
            mockModel.insertMany.mockResolvedValue(dtos);

            const result = await service.createMany(dtos, false);

            expect(mockModel.find).toHaveBeenCalledWith({ email: { $in: ['new1@test.com', 'exist@test.com'] } });
            expect(mockModel.insertMany).toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).toHaveBeenCalledTimes(2);
            expect(result.added).toBe(2);
        });

        it('should throw ConflictException if duplicates found (Strict Mode)', async () => {
            mockModel.find.mockResolvedValue([{ email: 'exist@test.com' }]);

            await expect(service.createMany(dtos, false)).rejects.toThrow(ConflictException);
            
            expect(mockModel.insertMany).not.toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).not.toHaveBeenCalled();
        });

        it('should skip duplicates and insert only new ones (Filter Mode)', async () => {
            mockModel.find.mockResolvedValue([{ email: 'exist@test.com' }]);
            
            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany).toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                added: 1,
                skipped: 1
            });
        });

        it('should return "added: 0" if all exist (Filter Mode)', async () => {
            mockModel.find.mockResolvedValue([
                { email: 'new1@test.com' },
                { email: 'exist@test.com' }
            ]);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany).not.toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).not.toHaveBeenCalled();
            expect(result.added).toBe(0);
            expect(result.skipped).toBe(2);
        });
    });
});
