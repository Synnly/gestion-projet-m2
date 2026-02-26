import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { UpdateCompanyDto } from './dto/updateCompany.dto';
import { Company } from './company.schema';
import { PostService } from '../post/post.service';
import { Post } from '../post/post.schema';
import { Application } from '../application/application.schema';
import { Forum } from '../forum/forum.schema';
import { Topic } from '../forum/topic/topic.schema';
import { Message } from '../forum/message/message.schema';
import { ForumService } from '../forum/forum.service';
import { NotificationService } from '../notification/notification.service';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginationResult } from '../common/pagination/dto/paginationResult';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { QueryBuilder } from '../common/pagination/query.builder';
import { GeoService } from '../common/geography/geo.service';
import { RefreshToken } from '../auth/refreshToken.schema';
import { Notification } from '../notification/notification.schema';

/**
 * Service handling business logic for company operations
 *
 * Provides comprehensive CRUD operations for managing company entities in the system.
 * Implements soft-delete pattern where companies are marked as deleted rather than removed.
 *
 * **Key Features:**
 * - Automatic password hashing via User schema pre-save hooks
 * - Soft delete support (uses deletedAt field)
 * - Discriminator pattern support (Company extends User schema)
 * - Immutable fields enforcement (email, SIRET cannot be updated)
 *
 * @see {@link Company} for the company schema definition
 * @see {@link UpdateCompanyDto} for update restrictions
 */
@Injectable()
export class CompanyService {
    private readonly logger = new Logger(CompanyService.name);

    /**
     * Creates a new CompanyService instance
     * @param companyModel - Injected Mongoose model for Company operations
     * @param postModel - Injected Mongoose model for Post operations
     * @param applicationModel - Injected Mongoose model for Application operations
     * @param forumModel - Injected Mongoose model for Forum operations
     * @param topicModel - Injected Mongoose model for Topic operations
     * @param messageModel - Injected Mongoose model for Message operations
     * @param postService - Injected PostService for managing related posts
     * @param forumService - Injected ForumService for managing related forums
     * @param paginationService - Injected PaginationService for handling pagination logic
     * @param geoService - Injected GeoService for geocoding addresses when needed
     */
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
        @InjectModel(Forum.name) private readonly forumModel: Model<Forum>,
        @InjectModel(Topic.name) private readonly topicModel: Model<Topic>,
        @InjectModel(Message.name) private readonly messageModel: Model<Message>,
        @InjectModel(Company.name) private readonly companyModel: Model<Company>,
        @Inject(forwardRef(() => PostService)) private readonly postService: PostService,
        @Inject(forwardRef(() => ForumService)) private readonly forumService: ForumService,
        private readonly notificationService: NotificationService,
        @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
        @InjectModel(RefreshToken.name) private readonly refreshTokenModel: Model<RefreshToken>,
        private readonly paginationService: PaginationService,
        private readonly geoService: GeoService,
    ) {}
    populateField = '_id title description duration startDate minSalary maxSalary sector keySkills adress type';

    /**
     * Retrieves all companies, even those that are soft-deleted, with pagination and optional filtering
     *
     * @returns Promise resolving to a paginated array of all active companies
     * ```
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Company>> {
        const { page, limit, sort, ...filters } = query;
        const qb = new QueryBuilder<Company>({ ...filters, showHidden: true } as any, this.geoService);
        const filter = await qb.build();
        const sortQuery = qb.buildSort(sort);

        return this.paginationService.paginate(
            this.companyModel,
            filter,
            page,
            limit,
            [
                {
                    path: 'posts',
                    select: this.populateField,
                },
            ],
            sortQuery,
        );
    }

    /**
     * Retrieves a single company by its unique identifier
     *
     * Only returns the company if it exists and is not soft-deleted.
     *
     * @param id - The MongoDB ObjectId of the company as a string
     * @returns Promise resolving to the company if found and active, null otherwise
     *
     * @example
     * ```typescript
     * const company = await companyService.findOne('507f1f77bcf86cd799439011');
     * if (company) {
     *   console.log(`Found company: ${company.name}`);
     * }
     * ```
     */
    async findOne(id: string): Promise<Company | null> {
        return this.companyModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate({
                path: 'posts',
                select: this.populateField,
            })
            .exec();
    }

    /**
     * Creates a new company in the database.
     *
     * The password provided in the DTO will be automatically hashed by the User schema
     * pre-save hook before storage. Email and SIRET number are set during creation
     * and cannot be modified later.
     *
     * @param dto - The complete company data required for creation
     * @returns Promise resolving to void upon successful creation
     *
     * @throws May throw validation errors if required fields are missing or invalid
     *
     * @example
     * ```typescript
     * await companyService.create({
     *   email: 'company@example.com',
     *   password: 'SecurePass123!',
     *   siretNumber: '12345678901234',
     *   name: 'My Company',
     *   role: Role.COMPANY
     * });
     * ```
     */
    async create(dto: CreateCompanyDto): Promise<void> {
        await this.companyModel.create({ ...dto });
        return;
    }

    /**
     * Updates an existing company's data with partial information
     *
     * This method uses `save()` instead of `findOneAndUpdate()` to ensure that Mongoose
     * pre-save hooks are triggered, particularly for password hashing. The validation
     * is disabled during save to avoid issues with Mongoose discriminator pattern
     * requiring all base schema fields.
     *
     * **Important Notes:**
     * - Email and SIRET number cannot be updated (not included in UpdateCompanyDto)
     * - Password will be automatically hashed if provided
     * - Only provided fields will be updated (partial update support)
     * - Soft-deleted companies cannot be updated
     *
     * @param id - The MongoDB ObjectId of the company to update
     * @param dto - Partial company data with fields to update
     * @returns Promise resolving to void upon successful update
     * @throws NotFoundException if any of the post IDs provided do not exist
     * @throws BadRequestException if any of the post IDs provided are invalid
     * @example
     * ```typescript
     * await companyService.update('507f1f77bcf86cd799439011', {
     *   name: 'Updated Company Name',
     *   city: 'Paris'
     * });
     * ```
     */
    async update(id: string, dto: UpdateCompanyDto | CreateCompanyDto): Promise<void> {
        // Try to find an active (non-deleted) company
        const company = await this.companyModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();

        if (company) {
            const wasValid = company.isValid ?? false;

            // Validate that all provided post IDs exist
            for (const postId of dto.posts ?? []) {
                let post: Post | null | undefined = undefined;
                try {
                    post = await this.postService.findOne(postId);
                } catch (error) {
                    throw new BadRequestException('Invalid post ID: ' + postId);
                }
                if (post === null) throw new NotFoundException('Post with id ' + postId + ' not found');
            }

            // Update existing active company
            Object.assign(company, dto);
            // keep previous behavior: trigger pre-save hooks, but skip full validation to avoid discriminator issues
            await company.save({ validateBeforeSave: false });

            if (!wasValid && company.isValid === true) {
                const existingForum = await this.forumService.findOneByCompanyId(company._id.toString());
                if (!existingForum) {
                    await this.forumService.create(company._id);
                }
            }

            return;
        }

        // If no active company found, create a new one.
        await this.companyModel.create({ ...(dto as CreateCompanyDto) });
        return;
    }

    /**
     * Soft deletes a company from the database. Also marks related notifications and refresh tokens as deleted, and
     * deletes associated posts. May be slow for companies with many posts due to sequential deletion of posts
     *
     * @param id - The MongoDB ObjectId of the company to delete
     * @returns Promise resolving to void upon successful deletion
     *
     * @example
     * ```typescript
     * await companyService.remove('507f1f77bcf86cd799439011');
     * ```
     *
     * @remarks
     * Consider implementing soft-delete logic if you need to maintain audit trails
     * or allow data recovery. This operation is irreversible.
     */
    async remove(id: string): Promise<void> {
        const updated = await this.companyModel
            .findOneAndUpdate({ _id: id, deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } })
            .exec();

        if (!updated) {
            throw new NotFoundException('Company not found or already deleted');
        }

        await this.notificationModel.updateMany({ userId: id }, { $set: { deletedAt: new Date() } }).exec();
        await this.refreshTokenModel.updateOne({ userId: id }, { $set: { expiresAt: new Date() } }).exec();
        for (const postId of updated.posts ?? []) {
            await this.postService.delete(postId.toString());
        }
        return;
    }

    /**
     * Soft deletes all companies from the database. Also marks all notifications and refresh tokens as deleted, and
     * deletes all associated posts. May be slow due to sequential deletion of posts
     *
     * @remarks This method may be very slow if there are many companies and posts, as it deletes posts sequentially.
     * Use with caution in production environments. Consider removing students BEFORE companies to avoid sending mails
     * and improve performance.
     *
     * @returns Promise resolving to void upon successful deletion of all companies
     */
    async removeAll(): Promise<void> {
        const companies = await this.companyModel.find({ deletedAt: { $exists: false } }).exec();
        const companyIds = companies.map((company) => company._id.toString());
        const companyPosts = companies.reduce(
            (acc, company) => {
                acc[company._id.toString()] = company.posts?.map((post) => post.toString()) ?? [];
                return acc;
            },
            {} as Record<string, string[]>,
        );

        if (Object.values(companyPosts).some((posts) => posts.length > 0)) {
            await this.notificationModel
                .updateMany({ userId: { $in: companyIds } }, { $set: { deletedAt: new Date() } })
                .exec();
            await this.refreshTokenModel
                .updateMany({ userId: { $in: companyIds } }, { $set: { expiresAt: new Date() } })
                .exec();
        }

        for (const companyId in companyPosts) {
            for (const postId of companyPosts[companyId]) {
                await this.postService.delete(postId);
            }
        }
        await this.companyModel
            .updateMany({ deletedAt: { $exists: false } }, { $set: { deletedAt: new Date() } })
            .exec();
        return;
    }

    /**
     * Restores a soft-deleted company account
     *
     * This method removes the deletedAt timestamp, effectively restoring the company account.
     * The company can only be restored if it was soft-deleted within the last 30 days.
     *
     * @param id - The MongoDB ObjectId of the company to restore
     * @returns Promise resolving to void upon successful restoration
     * @throws NotFoundException if the company doesn't exist or wasn't soft-deleted
     * @throws BadRequestException if the 30-day restoration period has expired
     *
     * @example
     * ```typescript
     * await companyService.restore('507f1f77bcf86cd799439011');
     * ```
     */
    async restore(id: string): Promise<void> {
        const company = await this.companyModel.findOne({ _id: id, deletedAt: { $exists: true } }).exec();

        if (!company) {
            throw new NotFoundException('Company not found or not deleted');
        }

        // Check if the company was deleted more than 30 days ago
        const deletedAt = company.deletedAt;
        if (!deletedAt) {
            throw new NotFoundException('Company not found or not deleted');
        }

        const now = new Date();
        const daysSinceDeletion = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceDeletion >= 30) {
            throw new BadRequestException(
                'La période de restauration de 30 jours a expiré. Votre compte sera définitivement supprimé prochainement.',
            );
        }

        await this.companyModel.updateOne({ _id: id }, { $unset: { deletedAt: 1 } }).exec();

        this.logger.log(`Company ${company.name} (${id}) restored successfully`);
        return;
    }

    /**
     * Checks if a company account is pending deletion
     * Returns deletion info if the account is soft-deleted
     *
     * @param id - The MongoDB ObjectId of the company
     * @returns Object with deletion status and days remaining, or null if not deleted
     */
    async checkDeletionStatus(id: string): Promise<{ isDeleted: boolean; daysRemaining?: number; deletedAt?: Date }> {
        const company = await this.companyModel.findOne({ _id: id }).exec();

        if (!company) {
            throw new NotFoundException('Company not found');
        }

        if (!company.deletedAt) {
            return { isDeleted: false };
        }

        const now = new Date();
        const daysSinceDeletion = Math.floor((now.getTime() - company.deletedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysSinceDeletion);

        return {
            isDeleted: true,
            daysRemaining,
            deletedAt: company.deletedAt,
        };
    }

    /**
     * Updates the public profile fields of a company
     *
     * Allows a company to update their publicly visible profile information. Only the fields
     * specified in the DTO will be updated; other fields remain unchanged. The update is performed
     * directly on the database using `updateOne` for efficiency.
     *
     * **Updatable Fields:**
     * - description: Public company description
     * - emailContact: Public contact email for students
     * - telephone: Public phone number
     * - website: Company website URL
     * - streetNumber, streetName, postalCode, city, country: Address information
     *
     * @param companyId - The MongoDB ObjectId of the company as a string
     * @param dto - Partial DTO containing the fields to update
     * @returns Promise resolving to void upon successful update
     * @throws NotFoundException if the company with the provided ID does not exist or update fails
     *
     * @example
     * ```typescript
     * await companyService.updatePublicProfile('507f1f77bcf86cd799439011', {
     *   description: 'We are a tech startup focused on AI solutions',
     *   website: 'https://mycompany.com',
     *   city: 'Paris'
     * });
     * ```
     */
    async updatePublicProfile(companyId: string, dto: UpdateCompanyDto): Promise<void> {
        const result = await this.companyModel.findOne({ _id: companyId });
        if (!result) {
            throw new NotFoundException('Company not found');
        }
        await this.companyModel.updateOne({ _id: companyId }, { $set: dto }).exec();
    }

    /**
     * Retrieves companies pending validation with pagination
     * Uses PaginationService for standardized pagination
     * Includes companies that are:
     * - Not valid (isValid: false)
     * - Either not rejected OR rejected but modified after rejection (modifiedAt exists)
     * @param query - Pagination parameters (page, limit)
     * @returns Promise resolving to paginated result with companies and metadata
     */
    async findPendingValidation(query: PaginationDto): Promise<PaginationResult<Company>> {
        const { page, limit } = query;
        const filter = {
            deletedAt: { $exists: false },
            isValid: false,
            $or: [
                { 'rejected.isRejected': { $ne: true } },
                {
                    'rejected.isRejected': true,
                    'rejected.modifiedAt': { $exists: true },
                },
            ],
        };

        return this.paginationService.paginate(this.companyModel, filter, page, limit, undefined, '-1');
    }

    /**
     * Checks if a company is valid
     * @param companyId The company identifier
     * @returns Promise resolving to true if the company is valid, false otherwise
     */
    async isValid(companyId: string): Promise<boolean> {
        const company = await this.companyModel.findOne({ _id: companyId, deletedAt: { $exists: false } }).exec();
        if (!company) {
            throw new NotFoundException(`Company with id ${companyId} not found`);
        }
        return company.isValid ?? false;
    }

    /**
     * Cron job that runs every day at 0:00 AM to permanently delete companies that have been soft-deleted for more than 30 days.
     * Also deletes all related data: posts, applications, forums, topics, and messages.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCompanyCleanupCron() {
        this.logger.debug('Starting company cleanup cron job');

        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - 30);
        const companiesToDelete = await this.companyModel
            .find({
                deletedAt: { $lte: dateLimite },
            })
            .select('_id name');

        const companyIds = companiesToDelete.map((c) => c._id);

        if (companyIds.length === 0) {
            this.logger.debug('No companies to clean up');
            return;
        }

        const postsToDelete = await this.postModel.find({ company: { $in: companyIds } }).select('_id title');
        const postIds = postsToDelete.map((p) => p._id);

        if (postIds.length > 0) {
            const applicationsToDelete = await this.applicationModel
                .find({ post: { $in: postIds } })
                .populate('student', '_id')
                .populate('post', 'title')
                .select('student post')
                .lean()
                .exec();

            for (const application of applicationsToDelete) {
                try {
                    await this.notificationService.create({
                        userId: application.student._id,
                        message: `Votre candidature pour le poste "${application.post.title}" a été supprimée car l'entreprise a été définitivement supprimée.`,
                    });
                } catch (error) {
                    this.logger.error(
                        `Failed to send notification to student ${application.student._id} for deleted application`,
                        error,
                    );
                }
            }

            const deletedApplications = await this.applicationModel.deleteMany({
                post: { $in: postIds },
            });
            this.logger.log(
                `${deletedApplications.deletedCount} deleted applications (${applicationsToDelete.length} notifications sent)`,
            );
        }

        if (postIds.length > 0) {
            const deletedPosts = await this.postModel.deleteMany({ _id: { $in: postIds } });
            this.logger.log(`${deletedPosts.deletedCount} deleted posts`);
        }

        const forumsToDelete = await this.forumModel.find({ company: { $in: companyIds } }).select('_id');
        const forumIds = forumsToDelete.map((f) => f._id);

        if (forumIds.length > 0) {
            const topicsToDelete = await this.topicModel.find({ forumId: { $in: forumIds } }).select('_id');
            const topicIds = topicsToDelete.map((t) => t._id);

            if (topicIds.length > 0) {
                const deletedMessages = await this.messageModel.deleteMany({ topicId: { $in: topicIds } });
                this.logger.log(`${deletedMessages.deletedCount} deleted messages`);

                const deletedTopics = await this.topicModel.deleteMany({ _id: { $in: topicIds } });
                this.logger.log(`${deletedTopics.deletedCount} deleted topics`);
            }

            const deletedForums = await this.forumModel.deleteMany({ _id: { $in: forumIds } });
            this.logger.log(`${deletedForums.deletedCount} deleted forums`);
        }

        const generalForum = await this.forumModel.findOne({ company: { $exists: false } }).select('_id');
        if (generalForum) {
            const generalTopics = await this.topicModel.find({ forumId: generalForum._id }).select('_id messages');
            const generalTopicIds = generalTopics.map((t) => t._id);

            if (generalTopicIds.length > 0) {
                const companyMessagesInGeneral = await this.messageModel
                    .find({ topicId: { $in: generalTopicIds }, authorId: { $in: companyIds } })
                    .select('_id topicId');

                if (companyMessagesInGeneral.length > 0) {
                    const companyMessageIds = companyMessagesInGeneral.map((m) => m._id);

                    const deletedGeneralMessages = await this.messageModel.deleteMany({
                        _id: { $in: companyMessageIds },
                    });
                    this.logger.log(
                        `${deletedGeneralMessages.deletedCount} company messages deleted from general forum`,
                    );

                    await this.topicModel.updateMany(
                        { _id: { $in: generalTopicIds } },
                        { $pull: { messages: { $in: companyMessageIds } } },
                    );

                    for (const topic of generalTopics) {
                        const remaining = await this.messageModel.countDocuments({ topicId: topic._id });
                        await this.topicModel.updateOne({ _id: topic._id }, { nbMessages: remaining });
                    }

                    const totalMessages = await this.messageModel.countDocuments({
                        topicId: { $in: generalTopicIds },
                    });
                    await this.forumModel.updateOne({ _id: generalForum._id }, { nbMessages: totalMessages });
                }
            }
        }

        const deletedCompanies = await this.companyModel.deleteMany({ _id: { $in: companyIds } });
        this.logger.log(`Company cleanup completed: ${deletedCompanies.deletedCount} companies deleted`);
    }
}
