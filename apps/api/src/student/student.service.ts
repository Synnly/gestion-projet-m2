import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateStudentDto } from './dto/createStudent.dto';
import { Student } from './student.schema';
import { StudentUserDocument } from '../user/user.schema';
import { Role } from '../common/roles/roles.enum';
import { UpdateStudentDto } from './dto/updateStudent.dto';
import * as bcrypt from 'bcrypt';
import { generateRandomPassword } from '../common/utils/password.utils'; 
import { StudentLoginInfo } from './student.types';
import { MailerService } from '../mailer/mailer.service';
@Injectable()
/**
 * Service that handles student data operations.
 *
 * Provides methods to find, create, update and soft-delete student records in the database.
 */
export class StudentService {
    constructor(
        @InjectModel(Student.name) private readonly studentModel: Model<StudentUserDocument>,
        private readonly mailerService: MailerService
    ) {}

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
     * @throws {ConflictException} When a student with the same email already exists (handled in controller).
     */
    async create(dto: CreateStudentDto): Promise<void> {
        const rawPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);
        
        const studentData = {
            ...dto,
            role: Role.STUDENT,
            password: hashedPassword,
        };

        const newStudent = await this.studentModel.create(studentData);

        try {
            await this.mailerService.sendAccountCreationEmail(
                newStudent.email,
                rawPassword,
                newStudent.firstName,
                "Vous pouvez désormais accéder à la plateforme de gestion des stages."
            );
        } catch (error) {
            console.error(`Failed to send welcome email to ${newStudent.email}:`, error);
        }
        return;
    }

    /**
     * Create a list of new students record, then send a mail to every student created.
     * @param createStudentDtos The creation payload.
     * @param addOnlyNonConflictingRecords Boolean option to ignore already existing records (if true), and only create new students accounts.
     * @returns A response with the error or validation message, containing the number of students created (and skipped if addOnlyNonConflictingRecords is true).
     */
    async createMany(dtos: CreateStudentDto[], addOnlyNonConflictingRecords: boolean): Promise<{ added: number; skipped: number }> {
        // Check for already existing data
        const incomingEmails = dtos.map((dto) => dto.email);
        const incomingStudentNumbers = dtos.map((dto) => dto.studentNumber);

        const conflicts = await this.studentModel.find({
            $or: [
                { email: { $in: incomingEmails } },
                { studentNumber: { $in: incomingStudentNumbers } }
            ]
        });

        const existingEmails = new Set(conflicts.map((s) => s.email));
        const existingStudentNumbers = new Set(conflicts.map((s) => s.studentNumber));

        const conflictedEmailsInFile = incomingEmails.filter(email => existingEmails.has(email));
        const conflictedNumbersInFile = incomingStudentNumbers.filter(sn => existingStudentNumbers.has(sn));

        // We found duplicates and addOnlyNonConflictingRecords is false (we add every student or none if there's any error)
        if ((conflictedEmailsInFile.length > 0 || conflictedNumbersInFile.length > 0) && !addOnlyNonConflictingRecords) {
            let message: string[] = ['Import failed. Some data already exists in the database:'];
            if (conflictedEmailsInFile.length > 0) {
                message.push(`=> Existing emails: ${[...new Set(conflictedEmailsInFile)].join(', ')}`);
            }
            if (conflictedNumbersInFile.length > 0) {
                message.push(`=> Existing student numbers: ${[...new Set(conflictedNumbersInFile)].join(', ')}`);
            }
            throw new ConflictException(message);
        }

        // If addOnlyNonConflictingRecords is true, we won't try to insert already existing emails
        const newStudentsToCreateDtos = dtos.filter((dto) => 
            !existingEmails.has(dto.email) && !existingStudentNumbers.has(dto.studentNumber)
        );

        const studentsLogin: StudentLoginInfo[] = [];

        // Preparing records for mass insert
        if (newStudentsToCreateDtos.length > 0) {
            const studentsToInsert = await Promise.all(
                newStudentsToCreateDtos.map(async (dto) => {
                    const rawPassword = generateRandomPassword();
                    studentsLogin.push({
                        email: dto.email,
                        rawPassword: rawPassword,
                        firstName: dto.firstName,
                        lastName: dto.lastName
                    });
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(rawPassword, salt);

                    return {
                        ...dto,
                        role: Role.STUDENT,
                        password: hashedPassword,
                        isFirstTime: true // optionnal, default is true anyway
                    };
                })
            );

            try {
                await this.studentModel.insertMany(studentsToInsert);
            } catch(e) {
                throw e;
            }
            
            // Sending mails for each student created
            const emailResults = await Promise.allSettled(
                studentsLogin.map(async (loginMailInfo) => {
                    return this.mailerService.sendAccountCreationEmail(
                        loginMailInfo.email,
                        loginMailInfo.rawPassword,
                        loginMailInfo.firstName,
                        loginMailInfo.lastName,
                        "Vous pouvez désormais accéder à la plateforme de gestion des stages."
                    );
                })
            );

            // Logging eventual sending errors (silent in prod)
            emailResults.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Failed to send email to ${studentsLogin[index].email}:`, result.reason);
                }
            });
        }
        
        return {
            added: newStudentsToCreateDtos.length,
            skipped: dtos.length - newStudentsToCreateDtos.length,
        };
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