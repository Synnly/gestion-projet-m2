import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Post } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { Company } from 'src/company/company.schema';

@Injectable()
export class PostService { 
    private readonly logger = new Logger(PostService.name);

    constructor(
        private readonly configService: ConfigService,

        @InjectModel(Post.name)
        private readonly postModel: Model<Post>,

        @Inject(getModelToken(Company.name))
        // @InjectModel(Company.name)
        private readonly companyModel: Model<Company>,
    ) {}


    /**
     * Creates a new post in the database
     *
     * @param dto - The complete post data required for creation
     * @param userId - The id of the company (or admin) creating the post
     * @returns Promise resolving to the created post
     */
    async create(dto: CreatePostDto, userId: string) {
        // We check that the company exists and it has not been soft-deleted
        const company = await this.companyModel.findOne({ _id: userId, deletedAt: { $exists: false } });

        if (!company) throw new NotFoundException('Company not found');

        const createdPost = new this.postModel({
            ...dto,
            companyId: company._id,
        });

        return createdPost.save();
    }

    /**
     * Retrieves all active posts
     *
     * @returns Promise resolving to an array of all active posts
     */
    async findAll(): Promise<Post[]> {
        const posts = await this.postModel.find({ deletedAt: { $exists: false } }).exec();
        return posts;
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
        return await this.postModel.find({ companyId: new Types.ObjectId(companyId) }).exec(); 
    }

    /**
     * Retrieves a single post by its unique identifier
     *
     * Only returns the post if it exists and has not been deleted
     *
     * @param id - The MongoDB ObjectId of the post as a string
     * @returns Promise resolving to the post if found and active, null otherwise
     */
    async findOne(id: string): Promise<Post | null> {
        const post = await this.postModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
        return post;
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
        const post = await this.postModel.findOne({ _id: id }).exec();
        return post;
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
            { companyId: new Types.ObjectId(companyId), deletedAt: { $exists: false } },
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
        await this.postModel.deleteMany({ companyId: new Types.ObjectId(companyId) }).exec();  
        return;
    }
    
    /**
     * Removes all soft-deleted posts from the database completely
     * 
     * @returns Promise resolving to void upon successful deletion
     */
    async deleteExpiredPosts(): Promise<void> {
        const retentionDays = this.configService.get<number>('SOFT_DELETE_RETENTION_DAYS', 30);

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() - retentionDays);

        // Delete all soft-deleted posts in a single operation  
        const result = await this.postModel.deleteMany({
            deletedAt: { $lte: expirationDate }
        }).exec();

        if (result.deletedCount > 0) {
            const c = result.deletedCount;
            this.logger.log(
                `${c} soft-deleted post${c > 1 ? 's' : ''} ha${c > 1 ? 've' : 's'} been permanently deleted.`
            );
        }
    }
}