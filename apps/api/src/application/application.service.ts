import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateApplicationDto } from './dto/createApplication.dto';
import { PostService } from '../post/post.service';
import { StudentService } from '../student/student.service';
import { S3Service } from '../s3/s3.service';
import { PaginationService } from '../common/pagination/pagination.service';
import { ApplicationQueryBuilder } from '../common/pagination/applicationQuery.builder';
import { ApplicationPaginationDto } from 'src/common/pagination/dto/applicationPagination.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ApplicationService {
    /**
     * Creates a new ApplicationService instance
     * @param applicationModel - Injected Mongoose model for Application operations
     * @param postService - Injected PostService for managing related posts
     * @param studentService - Injected StudentService for managing related students
     * @param s3Service - Injected S3Service for handling S3 operations
     * @param paginationService - Injected PaginationService for managing pagination
     */
    constructor(
        @InjectModel('Application') private readonly applicationModel: Model<ApplicationDocument>,
        private readonly postService: PostService,
        private readonly studentService: StudentService,
        private readonly s3Service: S3Service,
        private readonly paginationService: PaginationService,
        private readonly notificationService: NotificationService,
    ) {}

    /** Fields to populate when retrieving related Post documents */
    readonly postFieldsToPopulate: string =
        '_id title description duration startDate minSalary maxSalary sector keySkills adress type company';

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
    async findOne(id: Types.ObjectId): Promise<Application | null> {
        return this.applicationModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate([
                { path: 'post', select: this.postFieldsToPopulate, populate: { path: 'company', select: '_id name' } },
                { path: 'student', select: this.studentFieldsToPopulate },
            ])
            .exec();
    }

    /**
     * Create a new application for a student applying to a post.
     * Generates presigned URLs for uploading CV and optional cover letter.
     * Send a notification to the post's company about the new application.
     * @param studentId The ID of the student applying
     * @param postId The ID of the post being applied to
     * @param dto Data transfer object containing CV and cover letter extensions
     * @returns An object containing presigned upload URLs for CV and cover letter
     * @throws NotFoundException if the student or post does not exist
     * @throws ConflictException if an application already exists for the student and post
     */
    async create(
        studentId: Types.ObjectId,
        postId: Types.ObjectId,
        dto: CreateApplicationDto,
    ): Promise<{ cvUrl: string; lmUrl: string | undefined }> {
        // Validate existence of student
        const student = await this.studentService.findOne(studentId.toString());
        if (!student) throw new NotFoundException(`Student with id ${studentId.toString()} not found`);

        // Validate existence of post
        const post = await this.postService.findOne(postId.toString());
        if (!post) throw new NotFoundException(`Post with id ${postId.toString()} not found`);

        // Check for existing application to prevent duplicates
        const application = await this.applicationModel
            .findOne({ student: studentId, post: postId, deletedAt: { $exists: false } })
            .exec();
        if (application) {
            throw new ConflictException('Application already exists for this student and post');
        }

        // Generate presigned URLs for CV and cover letter uploads
        const objectname: string = `${studentId.toString()}`;
        const cv = await this.s3Service.generatePresignedUploadUrl(
            `${objectname}.${dto.cvExtension}`,
            'cv',
            studentId.toString(),
            postId.toString(),
        );
        let lm: { fileName: string; uploadUrl?: string } | undefined = undefined;
        if (dto?.lmExtension) {
            lm = await this.s3Service.generatePresignedUploadUrl(
                `${objectname}.${dto.lmExtension}`,
                'lm',
                studentId.toString(),
                postId.toString(),
            );
        }

        const newApplication = await new this.applicationModel({
            student: student,
            post: post,
            cv: cv.fileName,
            coverLetter: lm?.fileName,
        }).save();
        await this.postService.addApplication(postId.toString(), newApplication._id.toString());

        try {
            await this.notificationService.create({
                userId: post.company._id,
                message: `Vous avez reçu une nouvelle candidature pour le poste : ${post.title}`,
                returnLink: `/posts/${post._id}/applications`,
            });
        } catch (error) {
            console.error('Failed to send notification for new application:', error);
        }

        return { cvUrl: cv.uploadUrl, lmUrl: lm?.uploadUrl };
    }

    /**
     * Update the status of an existing application.
     * Send a notification to the student about the status update.
     * @param id The unique identifier of the application
     * @param status The new status to set for the application
     * @returns A promise that resolves when the update is complete
     * @throws NotFoundException if the application does not exist
     */
    async updateStatus(id: Types.ObjectId, status: ApplicationStatus): Promise<void> {
        const application = await this.applicationModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate([
                { path: 'post', select: 'title _id' },
                { path: 'student', select: '_id' },
            ])
            .exec();
        if (!application) throw new NotFoundException(`Application with id ${id} not found`);

        application.status = status;
        await application.save();

        try {
            await this.notificationService.create({
                userId: application.student._id,
                message: `Le statut de votre candidature pour le poste : ${application.post.title} a été mis à jour.`,
                returnLink: `/students/${application.student._id}/applications`,
            });
        } catch (error) {
            console.error('Failed to send notification for application status update:', error);
        }
    }

    /**
     * Retrieve all applications for a post that have not been soft-deleted and populate related Post and Student fields.
     * @param postId Post id for the applications
     * @param query Pagination and filter parameters provided by the
     *                incoming HTTP request (`PaginationDto`).
     */
    async findByPostPaginated(postId: Types.ObjectId, query: ApplicationPaginationDto) {
        const { page, limit, ...rest } = query;
        const filterQuery = { post: postId, ...rest };
        const finalFilterQuery =
            filterQuery.status === ApplicationStatus.Pending
                ? { ...filterQuery, status: [ApplicationStatus.Pending, ApplicationStatus.Read] }
                : filterQuery;
        const applicationQueryBuilder = new ApplicationQueryBuilder<ApplicationDocument>(finalFilterQuery);
        const sort = applicationQueryBuilder.buildSort();

        const builtFilter = { ...applicationQueryBuilder.build(), deletedAt: { $exists: false } };

        const populateOptions = [{ path: 'student', select: this.studentFieldsToPopulate }];

        return this.paginationService.paginate(this.applicationModel, builtFilter, page, limit, populateOptions, sort);
    }

    /**
     * Return apply with studentId and postId.
     * @param studentId The id of student
     * @param postId The id of post
     * @returns A promise with the application or null if not found
     */
    async getApplicationByStudentAndPost(
        studentId: Types.ObjectId,
        postId: Types.ObjectId,
    ): Promise<Application | null> {
        return await this.applicationModel
            .findOne({
                student: studentId,
                post: postId,
                deletedAt: { $exists: false },
            })
            .populate([
                { path: 'post', select: this.postFieldsToPopulate },
                { path: 'student', select: this.studentFieldsToPopulate },
            ])
            .exec();
    }

    /**
     * Return paginated applications for a given student.
     * @param studentId Student identifier.
     * @param page Page number (1-based).
     * @param limit Items per page (capped server-side).
     * @returns Paginated applications and pagination metadata.
     */
    async findByStudent(
        studentId: Types.ObjectId,
        page = 1,
        limit = 10,
        status?: ApplicationStatus,
        searchQuery?: string,
    ): Promise<{ data: Application[]; total: number; limit: number; page: number }> {
        // > 0 && <= 50
        const safeLimit = Math.min(Math.max(limit, 1), 50);
        // > 0
        const safePage = Math.max(page, 1);

        const skip = (safePage - 1) * safeLimit;

        const baseMatch: any = { student: studentId, deletedAt: { $exists: false } };

        const matchStage: any[] = [{ $match: baseMatch }];

        // filtre searchQuery
        const searchStage =
            typeof searchQuery === 'string' && searchQuery.trim().length > 0
                ? {
                      $or: [
                          { 'post.title': { $regex: searchQuery, $options: 'i' } },
                          { 'post.company.name': { $regex: searchQuery, $options: 'i' } },
                      ],
                  }
                : null;

        // filtre status
        if (status) {
            matchStage.push({ $match: { status } });
        }

        const pipeline: any[] = [
            ...matchStage,
            {
                $lookup: {
                    from: 'posts',
                    localField: 'post',
                    foreignField: '_id',
                    as: 'post',
                },
            },
            { $unwind: '$post' },
            {
                $lookup: {
                    from: 'companies',
                    localField: 'post.company',
                    foreignField: '_id',
                    as: 'post.company',
                },
            },
            { $unwind: { path: '$post.company', preserveNullAndEmptyArrays: true } },
        ];

        if (searchStage) {
            pipeline.push({ $match: searchStage });
        }

        pipeline.push({ $sort: { createdAt: -1 } });

        pipeline.push({
            $facet: {
                data: [{ $skip: skip }, { $limit: safeLimit }],
                totalCount: [{ $count: 'count' }],
            },
        });

        const agg = await this.applicationModel.aggregate(pipeline).exec();
        const facet = agg[0] || { data: [], totalCount: [] };
        const total = facet.totalCount[0]?.count ?? 0;
        const data = facet.data as Application[];

        return { data, total, limit: safeLimit, page: safePage };
    }
}
