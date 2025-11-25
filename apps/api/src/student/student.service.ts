import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStudentDto } from './dto/createStudent.dto';
import { Student } from './student.schema';
import { StudentUserDocument } from '../user/user.schema';
import { Role } from '../common/roles/roles.enum';
import { UpdateStudentDto } from './dto/updateStudent.dto';

@Injectable()
/**
 * Service that handles student data operations.
 *
 * Provides methods to find, create, update and soft-delete student records in the database.
 */
export class StudentService {
    constructor(@InjectModel(Student.name) private readonly studentModel: Model<StudentUserDocument>) {}

    /**
     * Find all students that are not soft-deleted.
     * @returns A promise resolving to an array of `Student` documents.
     */
    async findAll(): Promise<Student[]> {
        return this.studentModel.find({ deletedAt: { $exists: false } }).exec();
    }

    /**
     * Find a single student by id if not soft-deleted.
     * @param id The student's id.
     * @returns The `Student` document or null if not found.
     */
    async findOne(id: string): Promise<Student | null> {
        return this.studentModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
    }

    /**
     * Create a new student record.
     * @param dto The creation payload.
     */
    async create(dto: CreateStudentDto): Promise<void> {
        await this.studentModel.create({ ...dto, role: Role.STUDENT });
        return;
    }

    /**
     * Update an existing student. If the student does not exist, create it.
     * @param id The student's id.
     * @param dto The update payload or create payload.
     */
    async update(id: string, dto: UpdateStudentDto | CreateStudentDto): Promise<void> {
        const student = await this.studentModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();

        if (student) {
            Object.assign(student, dto);
            await student.save({ validateBeforeSave: false });
            return;
        }

        await this.studentModel.create({ ...(dto as CreateStudentDto), role: Role.STUDENT });
        return;
    }

    /**
     * Soft-delete a student by setting `deletedAt`.
     * @param id The student's id.
     * @throws NotFoundException if the student does not exist or is already deleted.
     */
    async remove(id: string): Promise<void> {
        const updated = await this.studentModel
            .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } })
            .exec();

        if (!updated) throw new NotFoundException('Student not found or already deleted');
        return;
    }
}
