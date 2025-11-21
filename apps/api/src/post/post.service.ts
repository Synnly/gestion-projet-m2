import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { QueryBuilder } from 'src/common/pagination/query.builder';
import { PaginationResult } from 'src/common/pagination/dto/paginationResult';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
        private readonly paginationService: PaginationService,
    ) {}

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
        return createdPost.save();
    }

    /**
     * Retrieves all active posts with pagination
     *
     * @returns Promise resolving to a paginated result of posts
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Post>> {
        const { page, limit } = query;
        const filter = new QueryBuilder(query).build();

        return this.paginationService.paginate(
            this.postModel,
            filter,
            page,
            limit,
            ['company'], // populate
        );
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
        return this.postModel.findById(id).populate('company').exec();
    }
}
