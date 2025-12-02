import { Injectable } from '@nestjs/common';
import { Application, ApplicationDocument } from './application.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ApplicationService {
    constructor(@InjectModel('Application') private readonly applicationModel: Model<ApplicationDocument>) {}

    /** Fields to populate when retrieving related Post documents */
    readonly postFieldsToPopulate: string =
        '_id title description duration startDate minSalary maxSalary sector keySkills adress type';

    /** Fields to populate when retrieving related Student documents */
    readonly studentFieldsToPopulate: string = '_id firstName lastName email';

    /**
     * Retrieve all applications that have not been soft-deleted and populate related Post and Student fields.
     * @returns A promise that resolves to an array of Application documents
     */
    async findAll(): Promise<Application[]> {
        return this.applicationModel
            .find({ deletedAt: { $exists: false } })
            .populate([
                { path: 'post', select: this.postFieldsToPopulate },
                { path: 'student', select: this.studentFieldsToPopulate },
            ])
            .exec();
    }

    /**
     * Retrieve a single application by its ID, ensuring it has not been soft-deleted, and populate related Post and
     * Student fields.
     * @param id - The unique identifier of the application
     * @returns A promise that resolves to the Application document or null if not found
     */
    async findOne(id: string): Promise<Application | null> {
        return this.applicationModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate([
                { path: 'post', select: this.postFieldsToPopulate },
                { path: 'student', select: this.studentFieldsToPopulate },
            ])
            .exec();
    }
}
