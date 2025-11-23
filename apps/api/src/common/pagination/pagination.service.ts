import { Injectable } from '@nestjs/common';
import { Model, FilterQuery } from 'mongoose';
import { PaginationResult } from './dto/paginationResult';

@Injectable()
export class PaginationService {
    async paginate<T>(
        model: Model<T>,
        filter: FilterQuery<T>,
        page: number,
        limit: number,
        populate?: Array<string | Record<string, any>>,
        sort?: string,
    ): Promise<PaginationResult<T>> {
        const skip = (page - 1) * limit;

        const query = model.find(filter).skip(skip).limit(limit);

        if (sort) query.sort(sort);
        if (populate) populate.forEach((p) => query.populate(p as any));

        const [items, total] = await Promise.all([query.lean<T[]>(), model.countDocuments(filter)]);

        return {
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        };
    }
}
