import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Post } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { Company } from 'src/company/company.schema';

@Injectable()
export class PostService { 
    constructor(
        @InjectModel(Post.name)
        private readonly postModel: Model<Post>,

        @Inject(getModelToken(Company.name))
        private readonly companyModel: Model<Company>,
    ) {}


    /**
     * Creates a new post in the database
     *
     * @param dto - The complete post data required for creation
     * @param userId - The id of the company (or admin) creating the post
     * @returns Promise resolving to void upon successful creation
     */
    async create(dto: CreatePostDto, userId: string) {
        const company = await this.companyModel.findOne({ _id: userId });

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
        const posts = this.postModel.find().exec();
        return posts;
    }

    /**
     * Retrieves a single post by its unique identifier
     *
     * Only returns the post if it exists
     *
     * @param id - The MongoDB ObjectId of the post as a string
     * @returns Promise resolving to the post if found and active, null otherwise
     */
    async findOne(id: string): Promise<Post | null> {
        const post = this.postModel.findById(id).exec();
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
     * 
     */
    async remove(id: string): Promise<void> {
        await this.postModel.deleteOne({ _id: id})
        // await this.postModel.findOneAndDelete({ _id: id}).exec(); // Utilise s'il faut retourner l'annonce
        return;
    }
}