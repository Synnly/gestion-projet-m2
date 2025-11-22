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
     * @param companyId - The MongoDB ObjectId of the company as a string
     * @returns Promise resolving to void upon successful creation
     */
    async create(dto: CreatePostDto, companyId: string): Promise<Post> {
        const company = await this.companyModel.findOne({ _id: companyId, deletedAt: { $exists: false } });
        if (!company) throw new NotFoundException('Company not found, cannot create post');

        const createdPost = new this.postModel({
            ...dto,
            company: new Types.ObjectId(companyId),
        });
        return createdPost.save();
    }

    /**
     * Retrieves all active posts
     *
     * @returns Promise resolving to an array of all active posts
     */
    async findAll(): Promise<Post[]> {
        return await this.postModel.find({ deletedAt: { $exists: false } }).populate('company').exec();
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
     * Retrieves a single post by its unique identifier
     *
     * Only returns the post if it exists and has not been deleted
     *
     * @param id - The MongoDB ObjectId of the post as a string
     * @returns Promise resolving to the post if found and active, null otherwise
     */
    async findOne(id: string): Promise<Post | null> {
        return await this.postModel.findOne({ _id: id, deletedAt: { $exists: false } }).populate('company').exec();
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