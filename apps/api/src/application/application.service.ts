import { Injectable, NotFoundException } from '@nestjs/common';
import { Application, ApplicationDocument } from './application.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateApplicationDto } from './dto/createApplication.dto';
import { PostService } from '../post/post.service';
import { StudentService } from '../student/student.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ApplicationService {
    /**
     * Creates a new ApplicationService instance
     * @param applicationModel - Injected Mongoose model for Application operations
     * @param postService - Injected PostService for managing related posts
     * @param studentService - Injected StudentService for managing related students
     * @param s3Service - Injected S3Service for handling S3 operations
     */
    constructor(
        @InjectModel('Application') private readonly applicationModel: Model<ApplicationDocument>,
        private readonly postService: PostService,
        private readonly studentService: StudentService,
        private readonly s3Service: S3Service,
    ) {}

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

    /**
     * Create a new application for a student applying to a post.
     * Generates presigned URLs for uploading CV and optional cover letter.
     * @param studentId The ID of the student applying
     * @param postId The ID of the post being applied to
     * @param dto Data transfer object containing CV and cover letter extensions
     * @returns An object containing presigned upload URLs for CV and cover letter
     */
    async create(
        studentId: Types.ObjectId,
        postId: Types.ObjectId,
        dto: CreateApplicationDto,
    ): Promise<{ cvUrl: string; lmUrl: string | undefined }> {
        const student = await this.studentService.findOne(studentId.toString());
        const post = await this.postService.findOne(postId.toString());

        // Validate existence of student and post
        if (!student) throw new NotFoundException(`Student with id ${studentId} not found`);
        if (!post) throw new NotFoundException(`Post with id ${postId} not found`);

        // Generate presigned URLs for CV and cover letter uploads
        const objectname: string = `${studentId.toString()}_${postId.toString()}`;
        const cv = await this.s3Service.generatePresignedUploadUrl(
            `${objectname}.${dto.cvExtension}`,
            'cv',
            studentId.toString(),
        );
        let lm: { fileName: string; uploadUrl?: string } | undefined = undefined;
        if (dto?.lmExtension) {
            lm = await this.s3Service.generatePresignedUploadUrl(
                `${objectname}.${dto.lmExtension}`,
                'lm',
                studentId.toString(),
            );
        }

        const data = {
            student: student,
            post: post,
            cv: cv.fileName,
            coverLetter: lm?.fileName,
        };

        const application = new this.applicationModel(data);

        return { cvUrl: cv.uploadUrl, lmUrl: lm?.uploadUrl };
    }
}
