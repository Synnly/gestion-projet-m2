import { Inject, Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Post } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { Company } from '../company/company.schema';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { UpdatePostDto } from './dto/updatePost';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { QueryBuilder } from 'src/common/pagination/query.builder';
import { PaginationResult } from 'src/common/pagination/dto/paginationResult';
import { CreationFailedError } from '../errors/creationFailedError';

@Injectable()
export class PostService implements OnModuleInit { 
    private readonly logger = new Logger(PostService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly paginationService: PaginationService,
        
        @InjectModel(Post.name)
        private readonly postModel: Model<Post>,

        @Inject(getModelToken(Company.name))
        private readonly companyModel: Model<Company>,
    ) {}


    /**
     * Create a new post document attached to the given company.
     *
     * @param dto - Data required to create the post (validated `CreatePostDto`)
     * @param companyId - Company id as a string (MongoDB ObjectId)
     * @returns The created post with the `company` relation populated
     */
    async create(dto: CreatePostDto, companyId: string): Promise<Post> {
        const company = await this.companyModel.findOne({ _id: companyId, deletedAt: { $exists: false } });
        if (!company) throw new NotFoundException('Company not found, cannot create post');

        const createdPost = new this.postModel({
            ...dto,
            company: new Types.ObjectId(companyId),
        });

        const saved = await createdPost.save();

        const populatedPost = await this.postModel
            .findById(saved._id)
            .populate({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();

        if (!populatedPost) {
            throw new CreationFailedError('Post was not created successfully');
        }

        return populatedPost;
    }

    /**
     * Retrieve posts using pagination.
     *
     * The returned `PaginationResult` contains posts where the `company`
     * relation is populated with a selected set of fields.
     *
     * @param query - Pagination parameters (page and limit)
     * @returns A `PaginationResult<Post>` containing items and metadata
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Post>> {
        const { page, limit, ...rest } = query;
        const filter = new QueryBuilder(rest).build();

        const companyPopulate = {
            path: 'company',
            select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
        };

        return this.paginationService.paginate(
            this.postModel,
            filter,
            page,
            limit,
            [companyPopulate], // populate with selected fields
        );
    }

    /**
     * Updates an existing post for a given company.
     * Ensures the post belongs to the company before updating.
     *
     * @param dto - Partial post data for update
     * @param companyId - Company id as a string (MongoDB ObjectId)
     * @param postId - Post id as a string (MongoDB ObjectId)
     * @returns The updated post populated with its company
     */
    async update(dto: UpdatePostDto, companyId: string, postId: string): Promise<Post> {

        const updated = await this.postModel
            .findOneAndUpdate({ _id: postId, company: new Types.ObjectId(companyId) }, { $set: dto }, { new: true })
            .populate({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();

        if (!updated) {
            throw new NotFoundException('Post not found or does not belong to this company');
        }

        return updated;
    }


    /**
     * Retrieves all active posts made by a specific company (or admin)
     *
     * @returns Promise resolving to an array of all active posts, not set as "deleted"
     */
    async findAllByCompany(companyId: string): Promise<Post[]> {
        return await this.postModel.find({ companyId: new Types.ObjectId(companyId), deletedAt: { $exists: false }  }).exec(); 
    }
    /**
     * Retrieves all posts made by a specific company, including soft-deleted posts.
     * This function should only be used for internal operations, not for user-facing features.
     */
    async findAllByCompanyEvenIfDeleted(companyId: string): Promise<Post[]> {
        return await this.postModel.find({ company: new Types.ObjectId(companyId) }).exec(); 
    }

    /**
     * Retrieve a single post by id.
     *
     * Only returns the post if it exists and has not been deleted.
     * The `company` relation is populated when present. The method returns
     * `null` when no document matches the provided id.
     *
     * @param id - Post id (MongoDB ObjectId as string)
     * @returns The post document with `company` populated, or `null` if not found
     */
    async findOne(id: string): Promise<Post | null> {
        return await this.postModel
            .findOne({ _id: id, deletedAt: { $exists: false } })
            .populate({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();
    }

    /**
     * Retrieves a single post by its unique identifier
     *
     * We shouldn't use this function for anything else than verification.
     * No user should see a deleted post.
     *
     * @param id - The MongoDB ObjectId of the post as a string
     * @returns Promise resolving to the post if found and active, null otherwise
     */
    async findOneEvenIfDeleted(id: string): Promise<Post | null> {
        return await this.postModel.findOne({ _id: id }).populate('company').exec();
    }


    /**
     * Permanently removes a post from the database
     *
     * This performs a hard delete operation, removing the post document entirely.
     *
     * @param id - The MongoDB ObjectId of the company to delete
     * @returns Promise resolving to void upon successful deletion
     * 
     * @example
     * ```typescript
     * await postService.remove('507f1f77bcf86cd799439011');
     * ```
     */
    async remove(id: string): Promise<void> {
        // Set the post as "deleted" for 30 days, before being deleted from the database
        const updated = await this.postModel
            .findOneAndUpdate(
                { _id: id, deletedAt: { $exists: false } },
                { $set: { deletedAt: new Date() } },
            )
            .exec();

        if (!updated) {
            throw new NotFoundException('Post not found or already deleted');
        }
        return;
    }

    
    /**
     * Sets all posts made by a specific company as "deleted"
     * 
     * @param companyId - The MongoDB ObjectId of a company
     * @returns Promise resolving to void upon successful deletion
     */
    async removeAllByCompany(companyId: string): Promise<void> {
        await this.postModel.updateMany(
            { company: new Types.ObjectId(companyId), deletedAt: { $exists: false } },
            { $set: { deletedAt: new Date() } }
        ).exec();
        return;
    }

    
    /**
     * Deletes permanently all posts made by a specific company
     * 
     * @returns Promise resolving to void upon successful deletion
     */
    async hardDeleteAllByCompany(companyId: string): Promise<void> {
        await this.postModel.deleteMany({ company: new Types.ObjectId(companyId) }).exec();  
        return;
    }
    
    
    
    /**
     * Scheduled function: automatically checks everyday for expired soft-deleted companies to delete from the database
     */
    onModuleInit() {
        const cronTime = this.configService.get<string>('CLEANUP_CRON', '0 3 * * *');
        this.logger.log(`Planning posts cleanup with pattern : "${cronTime}"`);

        // We manually create the job
        const job = new CronJob(cronTime, () => {
            this.deleteExpired();
        });

        // We add the job to the registry and we start it
        this.schedulerRegistry.addCronJob('deleteExpiredPosts', job);
        job.start();
    }


    /**
     * Removes all soft-deleted posts from the database completely
     * 
     * @returns Promise resolving to void upon successful deletion
     */
    async deleteExpired(): Promise<void> {
        this.logger.log('Auto-cleanup of soft-deleted posts...');
        const retentionDays = this.configService.get<number>('SOFT_DELETE_RETENTION_DAYS', 30);

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - retentionDays);

        // Delete all soft-deleted posts in a single operation  
        const result = await this.postModel.deleteMany({
            deletedAt: { $lte: expirationDate }
        }).exec();

        if (result.deletedCount === 0) {
            this.logger.log('Posts cleanup completed: no post to delete.');
            return;
        }

        const c = result.deletedCount;
        this.logger.log(`Posts cleanup completed: ${c} soft-deleted post${c > 1 ? 's' : ''} ha${c > 1 ? 've' : 's'} been permanently deleted.`);
    }
}