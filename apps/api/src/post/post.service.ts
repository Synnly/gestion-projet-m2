import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';
import { Model } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';

@Injectable()
export class PostService {
    constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

    /**
     * Creates a new post in the database
     *
     * @param dto - The complete post data required for creation
     * @returns Promise resolving to void upon successful creation
     */
    async create(dto: CreatePostDto): Promise<Post> {
        const createdPost = new this.postModel(dto);
        return createdPost.save();
    }

    /**
     * Retrieves all active posts
     *
     * @returns Promise resolving to an array of all active posts
     */
    async findAll(): Promise<Post[]> {
        const posts = await this.postModel.find().exec();
        for (const post of posts) await post.populate('company');
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
        const post = await this.postModel.findById(id).exec();
        if (post) await post.populate('company');
        return post;
    }
}
