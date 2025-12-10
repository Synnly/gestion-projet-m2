import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    HttpCode,
    HttpStatus,
    Put,
    NotFoundException,
    ValidationPipe,
    UseGuards,
    ConflictException,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Query,
    ParseBoolPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStudentDto } from './dto/createStudent.dto';
import { StudentService } from './student.service';
import { StudentDto } from './dto/student.dto';
import { ParseObjectIdPipe } from '../validators/parseObjectId.pipe';
import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../common/roles/roles.guard';
import { Roles } from '../common/roles/roles.decorator';
import { Role } from '../common/roles/roles.enum';
import { UpdateStudentDto } from './dto/updateStudent.dto';
import { StudentOwnerGuard } from '../common/roles/studentOwner.guard';
import { parse } from 'csv-parse/sync';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';

@Controller('/api/students')
/**
 * Controller for student-related endpoints.
 *
 * Exposes REST endpoints to create, read, update and delete student resources.
 */
export class StudentController {
    constructor(private readonly studentService: StudentService) {}

    /**
     * Return a list of all students.
     * @returns An array of `StudentDto` objects.
     */
    @Get('')
    @UseGuards(AuthGuard, RolesGuard)
    @HttpCode(HttpStatus.OK)
    @Roles(Role.COMPANY, Role.ADMIN)
    async findAll(): Promise<StudentDto[]> {
        const students = await this.studentService.findAll();
        return students.map((s) => plainToInstance(StudentDto, s, { excludeExtraneousValues: true }));
    }

    /**
     * Return a single student by id.
     * @param studentId The id of the student to retrieve.
     * @returns The `StudentDto` for the requested student.
     * @throws {NotFoundException} When no student matches the provided id.
     */
    @Get('/:studentId')
    @UseGuards(AuthGuard, RolesGuard, StudentOwnerGuard)
    @Roles(Role.COMPANY, Role.ADMIN, Role.STUDENT)
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('studentId', ParseObjectIdPipe) studentId: string): Promise<StudentDto> {
        const student = await this.studentService.findOne(studentId);
        if (!student) throw new NotFoundException(`Student with id ${studentId} not found`);
        return plainToInstance(StudentDto, student, { excludeExtraneousValues: true });
    }

    /**
     * Create a new student.
     * @param dto The `CreateStudentDto` payload used to create the student.
     * @throws {ConflictException} When a student with the same email already exists.
     * @throws {Error} For other unexpected errors during creation.
     */
    @Post('')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: CreateStudentDto,
    ) {
        try {
            await this.studentService.create(dto);
        } catch (error) {
            if ((error as any).code === 11000) {
                throw new ConflictException(`Student with email ${dto.email} already exists`);
            }
            throw error;
        }
    }

    /**
     * Import a list of students via a JSON array.
     * @param file A JSON file containing a list of CreateStudentDto objects.
     * @param skipExistingRecords Boolean option to ignore already existing records (if true), and only create new students accounts.
     * @throws {BadRequestException} When the file is not uploaded or in the wrong format.
     * @returns A response with the error or validation message, containing the number of students created (and skipped if skipExistingRecords is true).
     */
    @Post('/import')
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async import(
        @UploadedFile() file: Express.Multer.File,
        @Query('skipExistingRecords', new ParseBoolPipe({ optional: true })) 
        skipExistingRecords: boolean = false,
    ) : Promise<{ added: number; skipped: number }> {        
        if (!file) throw new BadRequestException('File is required');

        // File format verification
        const allowedMimeTypes = [
            'application/json',
            'text/csv',
            'application/vnd.ms-excel',
            'text/plain'
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('File must be a JSON or CSV');
        }

        let studentDtos: CreateStudentDto[];

        try {
            let rawData: any[];

            // Parsing JSON
            if (file.mimetype === 'application/json') {
                rawData = JSON.parse(file.buffer.toString());
                if (!Array.isArray(rawData)) throw new BadRequestException('JSON content must be an array');
            } else {
                // Parsing CSV
                // To deal with accents, we detect the encoded format of the csv file and convert it to utf-8 if needed.
                const detectedEncoding = chardet.detect(file.buffer);
                const decodedContent = iconv.decode(file.buffer, detectedEncoding || 'utf-8');

                rawData = parse(decodedContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    delimiter: [',', ';', '\t'], 
                    relax_quotes: true,
                });
            }

            // Checking for duplicate records inside the file
            const emailSet = new Set<string>();
            const studentNumberSet = new Set<string>();
            const duplicateEmails: string[] = [];
            const duplicateStudentNumbers: string[] = [];

            for (const item of rawData) {
                const email = item.email?.toLowerCase();
                const studentNumber = item.studentNumber;

                // Verifying duplicate emails
                if (email && emailSet.has(email)) {
                    if (!duplicateEmails.includes(email)) duplicateEmails.push(email);
                }
                emailSet.add(email);

                // Verifying duplicate studentNumbers
                if (studentNumber && studentNumberSet.has(studentNumber)) {
                    if (!duplicateStudentNumbers.includes(studentNumber)) duplicateStudentNumbers.push(studentNumber);
                }
                studentNumberSet.add(studentNumber);
            }

            if (duplicateEmails.length > 0 || duplicateStudentNumbers.length > 0) {
                let message: string[] = ['Import aborted due to duplicates within the file:'];
                if (duplicateEmails.length > 0) {
                    message.push(`- Duplicate emails: ${duplicateEmails.join(', ')}`);
                }
                if (duplicateStudentNumbers.length > 0) {
                    message.push(`- Duplicate student numbers: ${duplicateStudentNumbers.join(', ')}`);
                }
                throw new BadRequestException(message);
            }

            const validationPipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });  
            studentDtos = plainToInstance(CreateStudentDto, rawData);  

            for (const [index, dto] of studentDtos.entries()) {
                try {
                    await validationPipe.transform(dto, { type: 'body', metatype: CreateStudentDto });
                } catch (e) {
                    if (e instanceof BadRequestException) {
                        const error = `Validation failed at student with email '${dto.email || 'unknown'}' (row #${index+1}) :`;
                        const response = e.getResponse() as any;
                        throw new BadRequestException([error, response.message]);
                    }
                    throw e;
                }
            }  
        } catch (e) {
            if (e instanceof BadRequestException) throw e;
            if (e.code === 'CSV_INVALID_OPTION' || e.message.includes('CSV')) {
                throw new BadRequestException('Invalid CSV file format');
            }
            throw new BadRequestException('Invalid file format');
        }

        return await this.studentService.createMany(studentDtos, skipExistingRecords);
    }


    /**
     * Update an existing student or create it if it does not exist.
     * Requires admin role.
     * @param studentId The id of the student to update.
     * @param dto The update payload.
     */
    @Put('/:studentId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(
        @Param('studentId', ParseObjectIdPipe) studentId: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
        dto: UpdateStudentDto | CreateStudentDto,
    ) {
        await this.studentService.update(studentId, dto);
    }

    /**
     * Soft-delete a student by id. Requires admin role.
     * @param studentId The id of the student to remove.
     * @throws {NotFoundException} When the student does not exist or is already deleted.
     */
    @Delete('/:studentId')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('studentId', ParseObjectIdPipe) studentId: string) {
        await this.studentService.remove(studentId);
    }
}
