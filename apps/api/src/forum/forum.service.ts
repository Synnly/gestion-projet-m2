import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Forum } from './forum.schema';
import { PaginationDto } from '../common/pagination/dto/pagination.dto';
import { QueryBuilder } from '../common/pagination/query.builder';
import { PaginationService } from '../common/pagination/pagination.service';
import { GeoService } from '../common/geography/geo.service';
import { CompanyService } from '../company/company.service';
import { PaginationResult } from '../common/pagination/dto/paginationResult';

@Injectable()
export class ForumService {
    constructor(
        @InjectModel(Forum.name) private readonly forumModel: Model<Forum>,
        private readonly paginationService: PaginationService,
        private readonly geoService: GeoService,
        @Inject(forwardRef(() => CompanyService)) private readonly companyService: CompanyService,
    ) {}

    private readonly companyFields =
        '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo';

    /**
     * Create a new forum.
     * @param companyId The company id for which to create the forum. If not provided, creates the general forum.
     * @returns The created forum.
     * @throws BadRequestException if a forum for the given company already exists, or if the company does not exist.
     */
    async create(companyId?: Types.ObjectId): Promise<Forum> {
        if (await this.forumModel.findOne({ company: companyId })) {
            if (companyId) throw new BadRequestException(`Forum for company ${companyId} already exists.`);
            else throw new BadRequestException(`General forum already exists.`);
        }

        // Company forum
        if (companyId) {
            const company = await this.companyService.findOne(companyId.toString());
            if (!company) throw new BadRequestException(`Company ${companyId} does not exist.`);

            const forum = new this.forumModel({
                company: companyId,
                companyName: company.name,
                topics: [],
            });
            return forum.save();
        }

        // General forum
        const forum = new this.forumModel({
            topics: [],
        });
        return forum.save();
    }

    /**
     * Find a forum by company id.
     * @param companyId The company id to search for.
     * @returns The forum if found, otherwise null.
     */
    async findOneByCompanyId(companyId?: string): Promise<Forum | null> {
        return await this.forumModel
            .findOne({ company: companyId })
            .populate({
                path: 'topics',
                select: '_id author title description nbMessages',
                populate: {
                    path: 'author',
                    select: 'firstName lastName name email logo',
                    options: { strictPopulate: false }
                }
            })
            .populate({
                path: 'company',
                select: this.companyFields,
            })
            .lean()
            .exec();
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
        const qb = new QueryBuilder<Forum>(filters as any, this.geoService);
        const filter = await qb.build(true);
        const sortQuery = qb.buildSort(sort);

        const companyPopulate = {
            path: 'company',
            select: '_id name siretNumber nafCode structureType legalStatus streetNumber streetName postalCode city country logo',
        };

        const topicsPopulate = {
            path: 'topics',
            select: '_id author title description',
        }

        return this.paginationService.paginate(this.forumModel, filter, page, limit, [companyPopulate, topicsPopulate], sortQuery);
    }
}
