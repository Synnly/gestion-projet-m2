import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Forum } from './forum.schema';
import { PaginationResult } from 'client/src/types/internship.types';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { QueryBuilder } from '../common/pagination/query.builder';
import { Post } from '../post/post.schema';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';

@Injectable()
export class ForumService {
    constructor(
        @InjectModel('Forum') private readonly forumModel: Model<Forum>,
        private readonly paginationService: PaginationService,
        private readonly geoService: GeoService,
    ) {}

    /**
     * Create a new forum.
     * @param companyId
     * @returns The created forum.
     * @throws BadRequestException if a forum for the given company already exists.
     */
    async create(companyId?: Types.ObjectId): Promise<Forum> {
        if (await this.forumModel.findOne({ company: companyId })) {
            if (companyId) throw new BadRequestException(`Forum for company ${companyId} already exists.`);
            else throw new BadRequestException(`General forum already exists.`);
        }
        const forum = new this.forumModel({
            company: companyId,
            // topics: [],
        });
        return forum.save();
    }

    /**
     * Find a forum by company id.
     * @param companyId The company id to search for.
     * @returns The forum if found, otherwise null.
     */
    async findOneByCompanyId(companyId?: Types.ObjectId): Promise<Forum | null> {
        return (
            this.forumModel
                .findOne({ company: companyId })
                // .populate({
                //     path: 'topics',
                //     select: '_id author title description',
                // })
                .exec()
        );
    }

    /**
     * Retrieve forums using pagination and dynamic filters.
     *
     * This method delegates the parsing of query parameters to
     * `QueryBuilder`, which returns a Mongoose `FilterQuery<Forum>` that
     * implements the filtering semantics (global search, salary
     * overlap, keySkills matching, geolocation, etc.). The pagination
     * service executes the query with optional population and sorting.
     * @param query - Pagination and filter parameters provided by the incoming HTTP request (`PaginationDto`).
     * @returns A `PaginationResult<Forum>` containing paginated posts and metadata (total, page, limit, etc.).
     */
    async findAll(query: PaginationDto): Promise<PaginationResult<Forum>> {
        const { page, limit, sort, ...filters } = query;
        const qb = new QueryBuilder<Post>(filters as any, this.geoService);
        const filter = await qb.build();
        const sortQuery = qb.buildSort(sort);

        const companyPopulate = {
            path: 'company',
            select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo location',
        };

        return this.paginationService.paginate(this.forumModel, filter, page, limit, [companyPopulate], sortQuery);
    }
}
