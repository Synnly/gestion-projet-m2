import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { StudentService } from '../../../src/student/student.service';
import { Student } from '../../../src/student/student.schema';
import { Application } from '../../../src/application/application.schema';
import { Role } from '../../../src/common/roles/roles.enum';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MailerService } from '../../../src/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';
import { GeoService } from '../../../src/common/geography/geo.service';
import { PaginationService } from '../../../src/common/pagination/pagination.service';
import { CreateStudentDto } from 'src/student/dto/createStudent.dto';
import { Notification } from '../../../src/notification/notification.schema';
import { RefreshToken } from '../../../src/auth/refreshToken.schema';

describe('StudentService', () => {
    let service: StudentService;
    let mailerService: MailerService;

    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findOneAndUpdate: jest.fn(),
        insertMany: jest.fn(),
        aggregate: jest.fn(),
        deleteMany: jest.fn(),
    } as any;

    const mockApplicationModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
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

    const mockGeoService = {
        geocodeAddress: jest.fn().mockResolvedValue([2.3522, 48.8566]),
    };

    const mockPaginationService = {
        paginate: jest.fn(),
    };

    const mockNotificationModel = {
        updateMany: jest.fn(),
    };

    const mockRefreshTokenModel = {
        updateMany: jest.fn(),
        updateOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudentService,
                { provide: getModelToken(Student.name), useValue: mockModel },
                { provide: getModelToken(Application.name), useValue: mockApplicationModel },
                {
                    provide: getModelToken(Notification.name),
                    useValue: mockNotificationModel,
                },
                {
                    provide: getModelToken(RefreshToken.name),
                    useValue: mockRefreshTokenModel,
                },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: MailerService, useValue: mockMailerService },
                {
                    provide: GeoService,
                    useValue: mockGeoService,
                },
                {
                    provide: PaginationService,
                    useValue: mockPaginationService,
                },
            ],
        }).compile();

        service = module.get<StudentService>(StudentService);
        mailerService = module.get<MailerService>(MailerService);
        jest.clearAllMocks();

        mockNotificationModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
        mockRefreshTokenModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
        mockRefreshTokenModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ acknowledged: true }) });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll calls paginationService.paginate with deletedAt filter', async () => {
        const query = { page: 1, limit: 10 } as any;
        const expected = {
            data: [{ email: 'a@b.c' }],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
        };
        mockPaginationService.paginate.mockResolvedValue(expected);

        const res = await service.findAll(query);
        expect(mockPaginationService.paginate).toHaveBeenCalled();
        expect(res).toEqual(expected);
    });

    it('findAllForAdmin returns all students including soft-deleted ones', async () => {
        const query = { page: 1, limit: 10 } as any;
        const expected = {
            data: [
                { email: 'a@b.c', deletedAt: null },
                { email: 'd@e.f', deletedAt: new Date() },
            ],
            total: 2,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
        };
        mockPaginationService.paginate.mockResolvedValue(expected);

        const res = await service.findAllForAdmin(query);
        expect(mockPaginationService.paginate).toHaveBeenCalled();
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

    it('create logs error and continues when mailer fails', async () => {
        const dto = { email: 'x@y.z' } as any;

        const mockCreatedStudent = {
            email: 'x@y.z',
            firstName: 'Test',
            role: Role.STUDENT,
        } as any;

        mockModel.create.mockResolvedValue(mockCreatedStudent);
        mockMailerService.sendAccountCreationEmail.mockRejectedValue(new Error('Mail error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await service.create(dto);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send welcome email to x@y.z:', expect.any(Error));

        consoleErrorSpy.mockRestore();
    });

    it('update updates existing student when found', async () => {
        const saveMock = jest.fn().mockResolvedValue(undefined);
        const studentDoc: any = { save: saveMock, set: jest.fn() };
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(studentDoc) });

        await service.update('1', { email: 'new@e.mail' } as any);
        expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', deletedAt: { $exists: false } });
        expect(saveMock).toHaveBeenCalled();
    });

    it('update returns undefined when student not found', async () => {
        mockModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

        const result = await service.update('1', { email: 'new@e.mail' } as any);

        expect(result).toBeUndefined();
        expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '1', deletedAt: { $exists: false } });
    });

    describe('remove', () => {
        const STUDENT_ID = '507f1f77bcf86cd799439011';

        beforeEach(() => {
            mockApplicationModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
            mockNotificationModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
            mockRefreshTokenModel.updateOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
        });

        it('should resolve to undefined when student is found and soft-deleted', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: STUDENT_ID }) });

            await expect(service.remove(STUDENT_ID)).resolves.toBeUndefined();
        });

        it('should call findOneAndUpdate with correct filter and soft-delete payload', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: STUDENT_ID }) });

            await service.remove(STUDENT_ID);

            expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: STUDENT_ID, deletedAt: { $exists: false } },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should soft-delete related applications after student is deleted', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: STUDENT_ID }) });

            await service.remove(STUDENT_ID);

            expect(mockApplicationModel.updateMany).toHaveBeenCalledWith(
                { student: STUDENT_ID },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should soft-delete related notifications after student is deleted', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: STUDENT_ID }) });

            await service.remove(STUDENT_ID);

            expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
                { userId: STUDENT_ID },
                { $set: { deletedAt: expect.any(Date) } },
            );
        });

        it('should expire the refresh token after student is deleted', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: STUDENT_ID }) });

            await service.remove(STUDENT_ID);

            expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
                { userId: STUDENT_ID },
                { $set: { expiresAt: expect.any(Date) } },
            );
        });

        it('should throw NotFoundException with correct message when student not found', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.remove(STUDENT_ID)).rejects.toThrow(NotFoundException);
            await expect(service.remove(STUDENT_ID)).rejects.toThrow('Student not found or already deleted');
        });

        it('should not update related models when student is not found', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            await expect(service.remove(STUDENT_ID)).rejects.toThrow();

            expect(mockApplicationModel.updateMany).not.toHaveBeenCalled();
            expect(mockNotificationModel.updateMany).not.toHaveBeenCalled();
            expect(mockRefreshTokenModel.updateOne).not.toHaveBeenCalled();
        });

        it('should throw when findOneAndUpdate encounters a database error', async () => {
            mockModel.findOneAndUpdate.mockReturnValue({
                exec: jest.fn().mockRejectedValue(new Error('Database error')),
            });

            await expect(service.remove(STUDENT_ID)).rejects.toThrow('Database error');
            expect(mockModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });
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

        it('should rethrow error when insertMany fails', async () => {
            mockModel.find.mockResolvedValue([]);
            mockModel.insertMany.mockRejectedValue(new Error('Database error'));

            await expect(service.createMany(dtos, false)).rejects.toThrow('Database error');
        });

        it('should log errors when sending emails fails for some students', async () => {
            mockModel.find.mockResolvedValue([]);
            mockModel.insertMany.mockResolvedValue(dtos);
            mockMailerService.sendAccountCreationEmail
                .mockResolvedValueOnce(true)
                .mockRejectedValueOnce(new Error('Email error'))
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.createMany(dtos, false);

            expect(result.added).toBe(4);
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to send email to'),
                expect.any(Error),
            );

            consoleErrorSpy.mockRestore();
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

        it('should throw BadRequestException with "Invalid CSV file format" for CSV_INVALID_OPTION error', async () => {
            const csvContent = 'email,firstName\ntest@test.com,John';
            const file = createMockFile(csvContent, 'text/csv');

            // Mock csv-parse to throw CSV_INVALID_OPTION error
            const csvParse = require('csv-parse/sync');
            const originalParse = csvParse.parse;
            const csvError: any = new Error('CSV parsing error');
            csvError.code = 'CSV_INVALID_OPTION';
            csvParse.parse = jest.fn().mockImplementation(() => {
                throw csvError;
            });

            await expect(service.parseFileContent(file)).rejects.toThrow(BadRequestException);
            await expect(service.parseFileContent(file)).rejects.toThrow('Invalid CSV file format');

            // Restore original
            csvParse.parse = originalParse;
        });

        it('should throw BadRequestException with "Invalid CSV file format" for error with CSV in message', async () => {
            const csvContent = 'email,firstName\ntest@test.com,John';
            const file = createMockFile(csvContent, 'text/csv');

            // Mock csv-parse to throw error with CSV in message
            const csvParse = require('csv-parse/sync');
            const originalParse = csvParse.parse;
            csvParse.parse = jest.fn().mockImplementation(() => {
                throw new Error('CSV Record inconsistency');
            });

            await expect(service.parseFileContent(file)).rejects.toThrow(BadRequestException);
            await expect(service.parseFileContent(file)).rejects.toThrow('Invalid CSV file format');

            // Restore original
            csvParse.parse = originalParse;
        });
    });

    describe('checkConflicts', () => {
        const dtos: CreateStudentDto[] = [
            {
                email: 'new1@test.com',
                firstName: 'New1',
                lastName: 'User1',
                studentNumber: 'NEW001',
            },
            {
                email: 'new2@test.com',
                firstName: 'New2',
                lastName: 'User2',
                studentNumber: 'NEW002',
            },
        ];

        it('should throw ConflictException with email conflicts when skipExistingRecords is false', async () => {
            const existingStudent = {
                email: 'new1@test.com',
                studentNumber: 'EXISTING',
            };
            mockModel.find.mockResolvedValue([existingStudent]);

            try {
                await service.checkConflicts(dtos, false);
                fail('Should have thrown ConflictException');
            } catch (error) {
                expect(error).toBeInstanceOf(ConflictException);
                const responseMessage = Array.isArray(error.response.message)
                    ? error.response.message.join(' ')
                    : error.response.message;
                expect(responseMessage).toContain('Existing emails');
                expect(responseMessage).toContain('new1@test.com');
            }
        });

        it('should throw ConflictException with student number conflicts when skipExistingRecords is false', async () => {
            const existingStudent = {
                email: 'different@test.com',
                studentNumber: 'NEW001',
            };
            mockModel.find.mockResolvedValue([existingStudent]);

            try {
                await service.checkConflicts(dtos, false);
                fail('Should have thrown ConflictException');
            } catch (error) {
                expect(error).toBeInstanceOf(ConflictException);
                const responseMessage = Array.isArray(error.response.message)
                    ? error.response.message.join(' ')
                    : error.response.message;
                expect(responseMessage).toContain('Existing student numbers');
                expect(responseMessage).toContain('NEW001');
            }
        });

        it('should throw ConflictException with both email and student number conflicts', async () => {
            const existingStudents = [
                { email: 'new1@test.com', studentNumber: 'EXISTING1' },
                { email: 'different@test.com', studentNumber: 'NEW002' },
            ];
            mockModel.find.mockResolvedValue(existingStudents);

            try {
                await service.checkConflicts(dtos, false);
                fail('Should have thrown ConflictException');
            } catch (error) {
                expect(error).toBeInstanceOf(ConflictException);
                const responseMessage = Array.isArray(error.response.message)
                    ? error.response.message.join(' ')
                    : error.response.message;
                expect(responseMessage).toContain('Existing emails');
                expect(responseMessage).toContain('Existing student numbers');
                expect(responseMessage).toContain('new1@test.com');
                expect(responseMessage).toContain('NEW002');
            }
        });

        it('should filter out conflicts when skipExistingRecords is true', async () => {
            const existingStudents = [{ email: 'new1@test.com', studentNumber: 'EXISTING' }];
            mockModel.find.mockResolvedValue(existingStudents);

            const result = await service.checkConflicts(dtos, true);

            expect(result).toHaveLength(1);
            expect(result[0].email).toBe('new2@test.com');
        });

        it('should return all dtos when no conflicts exist', async () => {
            mockModel.find.mockResolvedValue([]);

            const result = await service.checkConflicts(dtos, false);

            expect(result).toHaveLength(2);
            expect(result).toEqual(dtos);
        });
    });

    describe('handleCron', () => {
        it('should do nothing when no students to delete', async () => {
            mockModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([]),
            });

            await service.handleCron();

            expect(mockModel.find).toHaveBeenCalled();
            expect(mockApplicationModel.deleteMany).not.toHaveBeenCalled();
            expect(mockModel.deleteMany).not.toHaveBeenCalled();
        });

        it('should delete students and related applications when students older than 30 days exist', async () => {
            const studentId1 = 'student1';
            const studentId2 = 'student2';

            mockModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ _id: studentId1 }, { _id: studentId2 }]),
            });

            mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 5 });
            mockModel.deleteMany.mockResolvedValue({ deletedCount: 2 });

            await service.handleCron();

            expect(mockModel.find).toHaveBeenCalledWith({
                deletedAt: { $lte: expect.any(Date) },
            });

            expect(mockApplicationModel.deleteMany).toHaveBeenCalledWith({
                student: { $in: [studentId1, studentId2] },
            });

            expect(mockModel.deleteMany).toHaveBeenCalledWith({
                _id: { $in: [studentId1, studentId2] },
            });
        });

        it('should handle the full cleanup process correctly', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);

            const studentsToDelete = [{ _id: 'oldStudent1' }, { _id: 'oldStudent2' }, { _id: 'oldStudent3' }];

            mockModel.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(studentsToDelete),
            });

            mockApplicationModel.deleteMany.mockResolvedValue({ deletedCount: 10 });
            mockModel.deleteMany.mockResolvedValue({ deletedCount: 3 });

            await service.handleCron();

            expect(mockApplicationModel.deleteMany).toHaveBeenCalled();
            expect(mockModel.deleteMany).toHaveBeenCalled();
        });
    });
});
