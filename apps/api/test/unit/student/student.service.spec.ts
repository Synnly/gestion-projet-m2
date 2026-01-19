import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from '../../../src/student/student.service';
import { Student } from '../../../src/student/student.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { MailerService } from '../../../src/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

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

    const TEST_MAX_ROWS = 1000;
    const TEST_MAX_SIZE = 2 * 1024 * 1024;
    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'IMPORT_MAX_SIZE_BYTES') return TEST_MAX_SIZE; // 2 Mo
            if (key === 'IMPORT_MAX_ROWS') return TEST_MAX_ROWS; // 1000 records
            return null;
        }),
    };

    const mockMailerService = {
        sendAccountCreationEmail: jest.fn().mockResolvedValue(true),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudentService,
                { provide: getModelToken(Student.name), useValue: mockModel },
                { provide: ConfigService, useValue: mockConfigService },
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

    it('create calls model.create with role STUDENT and sends email', async () => {
        const dto = { email: 'x@y.z' } as any;

        const mockCreatedStudent = {
            email: 'x@y.z',
            firstName: 'Test',
            role: Role.STUDENT,
        } as any;

        mockModel.create.mockResolvedValue(mockCreatedStudent);

        await service.create(dto);
        expect(mockModel.create).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'x@y.z',
                role: Role.STUDENT,
                password: expect.any(String),
            }),
        );

        expect(mockMailerService.sendAccountCreationEmail).toHaveBeenCalledWith(
            'x@y.z',
            expect.any(String),
            'Test',
            expect.any(String),
        );
    });

    it('update updates existing student when found', async () => {
        const saveMock = jest.fn().mockResolvedValue(undefined);
        const studentDoc: any = { save: saveMock, set: jest.fn() };
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(studentDoc) });

        await service.update('1', { email: 'new@e.mail' } as any);
        expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', deletedAt: { $exists: false } });
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
            { email: 'new3@test.com', studentNumber: '3', firstName: 'E', lastName: 'F' },
            { email: 'new4@test.com', studentNumber: 'exist_num', firstName: 'G', lastName: 'H' },
        ];
        const existingStudentEmail = { email: 'exist@test.com', studentNumber: '99', firstName: 'Z' };
        const existingStudentNumber = { email: 'unique@db.com', studentNumber: 'exist_num', firstName: 'Y' };

        it('should insert all students if no duplicates found (Strict Mode)', async () => {
            mockModel.find.mockResolvedValue([]);
            mockModel.insertMany.mockResolvedValue(dtos);

            const result = await service.createMany(dtos, false);

            expect(mockModel.find).toHaveBeenCalledWith({
                $or: [
                    { email: { $in: dtos.map((d) => d.email) } },
                    { studentNumber: { $in: dtos.map((d) => d.studentNumber) } },
                ],
            });
            expect(mockModel.insertMany).toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).toHaveBeenCalledTimes(4);
            expect(result.added).toBe(4);
        });

        it('should throw ConflictException if any conflict found (Strict Mode)', async () => {
            mockModel.find.mockResolvedValue([existingStudentEmail]);

            await expect(service.createMany(dtos, false)).rejects.toThrow(ConflictException);

            expect(mockModel.insertMany).not.toHaveBeenCalled();
        });

        it('should skip duplicates and insert only new ones (Filter Mode - Email conflict)', async () => {
            mockModel.find.mockResolvedValue([existingStudentEmail]);

            const expectedToInsert = dtos.filter((d) => d.email !== 'exist@test.com');
            mockModel.insertMany.mockResolvedValue(expectedToInsert);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany).toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).toHaveBeenCalledTimes(3);
            expect(result).toEqual({
                added: 3,
                skipped: 1,
            });
        });

        it('should return "added: 0" if all exist (Filter Mode)', async () => {
            const allConflicts = dtos.map((d) => ({ email: d.email, studentNumber: d.studentNumber }));
            mockModel.find.mockResolvedValue(allConflicts);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany).not.toHaveBeenCalled();
            expect(mockMailerService.sendAccountCreationEmail).not.toHaveBeenCalled();
            expect(result.added).toBe(0);
            expect(result.skipped).toBe(4);
        });

        it('should skip email conflict and insert the rest (Skip Mode)', async () => {
            mockModel.find.mockResolvedValue([existingStudentEmail]);

            const expectedToInsert = dtos.filter((d) => d.email !== 'exist@test.com');
            mockModel.insertMany.mockResolvedValue(expectedToInsert);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany.mock.calls[0][0].length).toBe(3);
            expect(result).toEqual({ added: 3, skipped: 1 });
        });

        it('should skip studentNumber conflict and insert the rest (Skip Mode)', async () => {
            mockModel.find.mockResolvedValue([existingStudentNumber]);

            const expectedToInsert = dtos.filter((d) => d.studentNumber !== 'exist_num');
            mockModel.insertMany.mockResolvedValue(expectedToInsert);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany.mock.calls[0][0].length).toBe(3);
            expect(result).toEqual({ added: 3, skipped: 1 });
        });

        it('should skip both email and studentNumber conflicts (Skip Mode)', async () => {
            mockModel.find.mockResolvedValue([existingStudentEmail, existingStudentNumber]);

            const expectedToInsert = dtos.filter(
                (d) => d.email !== 'exist@test.com' && d.studentNumber !== 'exist_num',
            );
            mockModel.insertMany.mockResolvedValue(expectedToInsert);

            const result = await service.createMany(dtos, true);

            expect(mockModel.insertMany.mock.calls[0][0].length).toBe(2);
            expect(result).toEqual({ added: 2, skipped: 2 });
        });
    });

    describe('parseFileContent', () => {
        const createMockFile = (content: any, mimetype: string): Express.Multer.File => ({
            fieldname: 'file',
            originalname: 'test',
            encoding: '7bit',
            mimetype,
            buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)),
            size: 100,
            stream: null as any,
            destination: '',
            filename: '',
            path: '',
        });

        it('should parse valid JSON array', async () => {
            const data = [{ email: 'test@test.com' }];
            const file = createMockFile(data, 'application/json');

            const result = await service.parseFileContent(file);
            expect(result).toEqual(data);
        });

        it('should throw BadRequestException if JSON is not an array', async () => {
            const data = { email: 'test@test.com' };
            const file = createMockFile(data, 'application/json');

            await expect(service.parseFileContent(file)).rejects.toThrow(BadRequestException);
            await expect(service.parseFileContent(file)).rejects.toThrow('JSON content must be an array');
        });

        it('should parse valid CSV content', async () => {
            const csvContent = 'email,firstName\ntest@test.com,John';
            const file = createMockFile(csvContent, 'text/csv');

            const result = await service.parseFileContent(file);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    email: 'test@test.com',
                    firstName: 'John',
                }),
            );
        });

        it('should throw BadRequestException if parsing fails (Invalid JSON syntax)', async () => {
            const file = {
                mimetype: 'application/json',
                buffer: Buffer.from('{ invalid json '),
            } as any;

            await expect(service.parseFileContent(file)).rejects.toThrow(BadRequestException);
            await expect(service.parseFileContent(file)).rejects.toThrow('Invalid file format');
        });

        it(`should throw BadRequestException if content exceeds max rows (${TEST_MAX_ROWS})`, async () => {
            const largeData = Array.from({ length: TEST_MAX_ROWS + 1 }, (_, i) => ({ email: `u${i}@t.com` }));
            const file = createMockFile(largeData, 'application/json');

            await expect(service.parseFileContent(file)).rejects.toThrow(BadRequestException);
            await expect(service.parseFileContent(file)).rejects.toThrow(/too many records/);
        });

        it(`should accept content with EXACTLY max rows (${TEST_MAX_ROWS})`, async () => {
            const limitData = Array.from({ length: TEST_MAX_ROWS }, (_, i) => ({ email: `u${i}@t.com` }));
            const file = createMockFile(limitData, 'application/json');

            const result = await service.parseFileContent(file);
            expect(result).toHaveLength(TEST_MAX_ROWS);
        });
    });
});
