import { Expose, Exclude, Transform } from 'class-transformer';
import { Types } from 'mongoose';

/**
 * Data Transfer Object representing a Student returned by the API.
 *
 * Uses `class-transformer` decorators to control exposed fields.
 */
@Exclude()
export class StudentDto {
    /** The student's MongoDB ObjectId. */
    @Transform((params) => params.obj._id)
    @Expose()
    _id: Types.ObjectId;

    /** The student's email address. */
    @Expose()
    email: string;

    /** The student's first name. */
    @Expose()
    firstName: string;

    /** The student's last name. */
    @Expose()
    lastName: string;

    /** Student's unique institutional number */
    @Expose()
    studentNumber: string;

    /** Whether this account is the user's first time on the platform */
    @Expose()
    isFirstTime: boolean;

    @Expose()
    role: 'STUDENT';
    /**
     * Create a partial `StudentDto` instance.
     * @param partial Optional partial data to assign to the DTO.
     */
    constructor(partial?: Partial<StudentDto>) {
        Object.assign(this, partial);
    }
}
