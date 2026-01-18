import {
    BadRequestException,
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseBoolPipe,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    ValidationPipe,
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
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe';
import { FileTypeValidationPipe } from '../common/pipes/file-type-validation.pipe';
import { StudentEditGuard } from '../common/roles/studentEdit.guard';

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
     * @param file A JSON or CSV file containing a list of CreateStudentDto objects.
     * @param skipExistingRecords Boolean option to ignore already existing records (if true), and only create new students accounts.
     * @throws {BadRequestException} When the file is not uploaded or in the wrong format.
     * @returns A response containing the number of created and skipped students (always 0 if skipExistingRecords is false).
     */
    @Post('/import')
    @UseInterceptors(FileInterceptor('file'))
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async import(
        @UploadedFile(FileSizeValidationPipe, FileTypeValidationPipe) file: Express.Multer.File,
        @Query('skipExistingRecords', new ParseBoolPipe({ optional: true }))
        skipExistingRecords: boolean = false,
    ): Promise<{ added: number; skipped: number }> {
        const rawData = await this.studentService.parseFileContent(file);
        const validStudentDtos: CreateStudentDto[] = [];
        let skippedByController = 0;

        const emailSet = new Set<string>();
        const studentNumberSet = new Set<string>();

        const validationPipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

        for (const item of rawData) {
            // Checking for duplicate records inside the file
            const email = item.email ? String(item.email).toLowerCase().trim() : null;
            const studentNumber = item.studentNumber ? String(item.studentNumber).trim() : null;

            if ((email && emailSet.has(email)) || (studentNumber && studentNumberSet.has(studentNumber))) {
                skippedByController++;
                continue;
            }

            const dto = plainToInstance(CreateStudentDto, item);
            try {
                await validationPipe.transform(dto, { type: 'body', metatype: CreateStudentDto });

                if (email) emailSet.add(email);
                if (studentNumber) studentNumberSet.add(studentNumber);

                validStudentDtos.push(dto);
            } catch (e) {
                // Failed verification
                skippedByController++;
                // We continue anyway (maybe we should log the error)
            }
        }

        const serviceResult = await this.studentService.createMany(validStudentDtos, skipExistingRecords);

        return {
            added: serviceResult.added,
            skipped: serviceResult.skipped + skippedByController,
        };
    }

    /**
     * Update an existing student or create it if it does not exist.
     * Requires admin role.
     * @param studentId The id of the student to update.
     * @param dto The update payload.
     */
    @Put('/:studentId')
    @UseGuards(AuthGuard, RolesGuard, StudentEditGuard)
    @Roles(Role.ADMIN, Role.STUDENT)
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
