import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from './post.schema';
import { Model, Types } from 'mongoose';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost';
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
     * Create a new post document attached to the given company.
     *
     * @param dto - Data required to create the post (validated `CreatePostDto`)
     * @param companyId - Company id as a string (MongoDB ObjectId)
     * @returns The created post with the `company` relation populated
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
     * Retrieve a single post by id.
     *
     * The `company` relation is populated when present. The method returns
     * `null` when no document matches the provided id.
     *
     * @param id - Post id (MongoDB ObjectId as string)
     * @returns The post document with `company` populated, or `null` if not found
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
