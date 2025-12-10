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
        const createJSONMockFile = (content: any, mimetype = 'application/json') => ({
            fieldname: 'file',
            originalname: 'students.json',
            encoding: '7bit',
            mimetype,
            buffer: Buffer.from(JSON.stringify(content)),
            size: 100,
        } as Express.Multer.File);
        
        const createCSVMockFile = (content: string, mimetype = 'text/csv'): Express.Multer.File => ({
            fieldname: 'file',
            originalname: 'students.csv',
            encoding: '7bit',
            mimetype,
            buffer: Buffer.from(content),
            size: content.length,
            stream: null as any,
            destination: '',
            filename: '',
            path: '',
        } as Express.Multer.File);


        it('should be protected with ADMIN role', () => {
            const roles = Reflect.getMetadata('roles', controller.import);

            expect(roles).toBeDefined(); 
            expect(roles).toContain(Role.ADMIN);
        });

        it('should throw BadRequestException if file is undefined', async () => {
            await expect(controller.import(undefined as any)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if mimetype is not JSON nor CSV', async () => {
            const file = createJSONMockFile([], 'image/png');
            await expect(controller.import(file)).rejects.toThrow('File must be a JSON or CSV');
        });

        it('should throw BadRequestException if content is not an array', async () => {
            const file = createJSONMockFile({ email: 'test@test.com' });
            await expect(controller.import(file)).rejects.toThrow('JSON content must be an array');
        });

        it('should throw BadRequestException if JSON is invalid', async () => {
            const file = {
                mimetype: 'application/json',
                buffer: Buffer.from('{ bad json '),
            } as any;
            await expect(controller.import(file)).rejects.toThrow('Invalid file format');
        });

        it('should throw BadRequestException if DTO validation fails (invalid email)', async () => {
            const invalidData = [{
                firstName: 'Toto',
                lastName: 'Test',
                email: 'invalid-email'
            }];
            const file = createJSONMockFile(invalidData);

            await expect(controller.import(file)).rejects.toThrow(BadRequestException);
        });

        it('should call service.createMany with correct params on success', async () => {
            const validData = [{
                firstName: 'Toto',
                lastName: 'Test',
                email: 'toto@univ.fr',
                studentNumber: '1'
            }];
            const file = createJSONMockFile(validData);
            
            mockService.createMany.mockResolvedValue({ added: 1, skipped: 0 });

            await controller.import(file); 
            expect(mockService.createMany).toHaveBeenCalledWith(expect.any(Array), false);

            await controller.import(file, true); 
            expect(mockService.createMany).toHaveBeenCalledWith(expect.any(Array), true);

            await controller.import(file, false);
            expect(mockService.createMany).toHaveBeenCalledWith(expect.any(Array), false);
        });

        it('should successfully import a valid CSV file (comma separated)', async () => {
            const csvContent = `firstName,lastName,studentNumber,email
                                John,Doe,123,john.doe@test.com
                                Jane,Smith,456,jane.smith@test.com`;
            
            const file = createCSVMockFile(csvContent, 'text/csv');
            
            mockService.createMany.mockResolvedValue({ added: 2, skipped: 0 });

            const result = await controller.import(file, false);

            expect(mockService.createMany).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ email: 'john.doe@test.com', firstName: 'John' }),
                    expect.objectContaining({ email: 'jane.smith@test.com', firstName: 'Jane' }),
                ]),
                false
            );
            expect(result).toEqual({ added: 2, skipped: 0 });
        });

        it('should successfully import a valid CSV file (semicolon separated / Excel style)', async () => {
            const csvContent = `firstName;lastName;studentNumber;email
                                Alice;Wonder;789;alice@test.com`;
            
            const file = createCSVMockFile(csvContent, 'application/vnd.ms-excel'); 
            
            mockService.createMany.mockResolvedValue({ added: 1, skipped: 0 });

            await controller.import(file, false);

            expect(mockService.createMany).toHaveBeenCalledWith(
                [expect.objectContaining({ email: 'alice@test.com', studentNumber: '789' })],
                false
            );
        });

        it('should throw BadRequestException for unsupported file type', async () => {
            const file = createCSVMockFile('%PDF-1.5...', 'application/pdf');
            
            await expect(controller.import(file)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if DTO validation fails in CSV (e.g., missing email)', async () => {
            const invalidCsvContent = `firstName,lastName,studentNumber,email
                                       Alice,Wonder,123,not-an-email`;
                
            const file = createCSVMockFile('text/csv', invalidCsvContent);

            await expect(controller.import(file)).rejects.toThrow(BadRequestException);

            expect(mockService.createMany).not.toHaveBeenCalled();
        });
    });
});
