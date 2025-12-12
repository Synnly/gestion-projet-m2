import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { CompanyService } from 'src/company/company.service';
import { GeoService } from 'src/common/geography/geo.service';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        private readonly paginationService: PaginationService,

        private readonly geoService: GeoService,
        @Inject(forwardRef(() => CompanyService)) private readonly companyService: CompanyService,
    ) {}

    /**
     * Create a new post document attached to the given company.
     *
     * Behaviour / notes:
     * - If the DTO does not include an address the company's address
     *   fields are concatenated and used for geocoding.
     * - The `GeoService` is used to geocode the address; when coordinates
     *   are returned they are stored on the created post as a GeoJSON
     *   `location` Point (`{ type: 'Point', coordinates: [lon, lat] }`).
     * - The created document is saved and then re-fetched with `populate`
     *   to return the selected company fields to callers.
     *
     * @param dto - Data required to create the post (validated `CreatePostDto`).
     * @param companyId - Company id as a string (MongoDB ObjectId)
     * @returns The created post with the `company` relation populated
     */
    async create(dto: CreatePostDto, companyId: string): Promise<Post> {
        let location: { type: 'Point'; coordinates: [number, number] } | null = null;
        const company = await this.companyService.findOne(companyId);
        if (!dto.adress) {
            const addressParts = [
                company?.streetNumber,
                company?.streetName,
                company?.postalCode,
                company?.city,
                company?.country,
            ].filter(Boolean);
            dto.adress = addressParts.join(' ');
        }

        const coordinates = await this.geoService.geocodeAddress(dto.adress);

        if (coordinates) {
            location = {
                type: 'Point',
                coordinates,
            };
        }

        const createdPost = new this.postModel({
            ...dto,
            company: new Types.ObjectId(companyId),
            location,
            isCoverLetterRequired: dto.isCoverLetterRequired,
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
     * Retrieve posts using pagination and dynamic filters.
     *
     * This method delegates the parsing of query parameters to
     * `QueryBuilder`, which returns a Mongoose `FilterQuery<Post>` that
     * implements the filtering semantics (global search, salary
     * overlap, keySkills matching, geolocation, etc.). The pagination
     * service executes the query with optional population and sorting.
     *
     * @param query - Pagination and filter parameters provided by the
     *                incoming HTTP request (`PaginationDto`).
     * @returns A `PaginationResult<Post>` containing paginated posts and
     *          metadata (total, page, limit, etc.).
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Post>> {
        const { page, limit, sort, ...filters } = query;
        // Build dynamic Mongo filters
        const qb = new QueryBuilder<Post>(filters as any, this.geoService);
        const filter = await qb.build();
        const sortQuery = qb.buildSort();

        const companyPopulate = {
            path: 'company',
            select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo location',
        };

        // Ensure sensible defaults if the DTO omitted values

        return this.paginationService.paginate(
            this.postModel,
            filter,
            page,
            limit,
            [companyPopulate], // populate with selected fields
            sortQuery,
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
