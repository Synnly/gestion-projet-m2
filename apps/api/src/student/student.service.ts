import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
     * Create a list of new students record.
     * @param createStudentDtos The creation payload.
     */
    async createMany(dtos: CreateStudentDto[], addOnlyNew: boolean) {
        // If we need to ignore duplicates
        if (addOnlyNew) {
            const incomingEmails = dtos.map((dto) => dto.email);

            const existingStudents = await this.studentModel.find({
                email: { $in: incomingEmails },
            }).select('email');

            const existingEmails = new Set(existingStudents.map((s) => s.email));

            const newStudentsToCreate = dtos.filter(
                (dto) => !existingEmails.has(dto.email)
            );

            if (newStudentsToCreate.length === 0) {
                return { message: 'No new students to add', added: 0 };
            }

            // We inserts only new student (student with a new email)
            await this.studentModel.insertMany(newStudentsToCreate);
            
            return {
                message: 'Import successful (duplicates skipped)',
                added: newStudentsToCreate.length,
                skipped: existingEmails.size
            };
        }

        // We try to import all the students (an error is throw on a duplicate email)
        else {
            try {
                await this.studentModel.insertMany(dtos);
                return { message: 'All students imported successfully', added: dtos.length };
            } catch (error) {
                if (error.code === 11000) { // Duplicate(s) email(s)
                    // We try to find the duplicated email(s) from the error sent by MongoDB
                    const duplicatedValue = error.keyValue ? JSON.stringify(error.keyValue) : 'unknown';
                    
                    throw new ConflictException(
                        `Import failed. Duplicate entry found: ${duplicatedValue}`
                    );
                }
                throw error;
            }
        }
    }
    // async createMany(createStudentDtos: CreateStudentDto[]): Promise<void> {
    //     try {
    //         // insertMany is way faster than a loop on await create()
    //         await this.studentModel.insertMany(createStudentDtos); 
    //     } catch (error) {
    //         if (error.code === 11000) {
    //             throw new ConflictException('One or more students already exist (duplicate email).');
    //         }
    //         throw error;
    //     }
    // }



    /**
     * Update an existing student. If the student does not exist, create it.
     * @param id The student's id.
     * @param dto The update payload or create payload.
     */
    async update(id: string, dto: UpdateStudentDto | CreateStudentDto): Promise<void> {
        const student = await this.studentModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();

        if (student) {
            Object.assign(student, dto);
            await student.save();
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
