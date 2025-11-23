import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { PaginationDto } from 'src/common/pagination/dto/pagination.dto';
import { PaginationService } from 'src/common/pagination/pagination.service';
import { QueryBuilder } from 'src/common/pagination/query.builder';
import { PaginationResult } from 'src/common/pagination/dto/paginationResult';
import { CreationFailedError } from '../errors/creationFailedError';

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
     * Retrieves posts with pagination. Returns a paginated result with the
     * `company` field populated (selected fields) based on the provided query.
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Post>> {
        const { page, limit } = query;
        const filter = new QueryBuilder(query).build();

        const companyPopulate = {
            path: 'company',
            select:
                '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
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
