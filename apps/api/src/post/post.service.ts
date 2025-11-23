import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { CreationFailedError } from '../errors/creationFailedError';

@Injectable()
export class PostService {
    constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

    /**
     * Creates a new post in the database
     *
     * @param dto - The complete post data required for creation
     * @param companyId - The MongoDB ObjectId of the company as a string
     * @returns Promise resolving to void upon successful creation
     */
    async create(dto: CreatePostDto, companyId: string): Promise<Post> {
        const createdPost = new this.postModel({
            ...dto,
            company: new Types.ObjectId(companyId),
        });

        const saved = await createdPost.save();

        const populatedPost = await this.postModel
            .findById(saved._id)
            .populate({
                path: 'company',
                select:
                    '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();

        if (!populatedPost) {
            throw new CreationFailedError('Post was not created successfully');
        }

        return populatedPost;
    }
    /**
     * Retrieves all active posts
     *
     * @returns Promise resolving to an array of all active posts
     */
    async findAll(): Promise<Post[]> {
        return this.postModel
            .find()
            .populate({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();
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
        return this.postModel
            .findById(id)
            .populate({
                path: 'company',
                select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
            })
            .exec();
    }
}
