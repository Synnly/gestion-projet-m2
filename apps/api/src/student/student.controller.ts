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
    ParseArrayPipe,
} from '@nestjs/common';
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
import { OwnerGuard } from 'src/s3/owner.guard';
import { StudentOwnerGuard } from '../common/roles/studentOwner.guard';

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
     * @param dtos An array of CreateStudentDto objects.
     */
    @Post('/import')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async import(
        @Body(new ParseArrayPipe({ items: CreateStudentDto, whitelist: true }))
        dtos: CreateStudentDto[],
        @Query('addOnlyNew', new ParseBoolPipe({ optional: true })) 
        addOnlyNew: boolean = false,
    ) {
        // await this.studentService.createMany(dtos);
        // return { message: `${dtos.length} students imported successfully` };
        return await this.studentService.createMany(dtos, addOnlyNew);
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
