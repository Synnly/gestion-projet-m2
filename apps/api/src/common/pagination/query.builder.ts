import { FilterQuery, Types } from 'mongoose';

/**
 * Small helper that can be used to translate request parameters into
 * a Mongoose `FilterQuery<T>`.
 *
 * The implementation is intentionally minimal at the moment but provides
 * a single `build()` method that returns a `FilterQuery<T>`. It can be
 * extended later to support advanced parsing (date ranges, text search,
 * numeric ranges, etc.).
 */
export class QueryBuilder<T> {
    /**
     * Create a new QueryBuilder.
     *
     * @param params - Partial map of keys and values (typically from request query)
     */
    constructor(private readonly params: Partial<Record<keyof T | string, any>>) {}

    /**
     * Build a Mongoose filter object based on the provided params.
     *
     * @returns A `FilterQuery<T>` suitable for passing to `Model.find()`
     */
    build(): FilterQuery<T> {
        const mutableFilter: Record<string, unknown> = {};

        if (this.params.search) {
            const regex = {
                $regex: this.params.search as string,
                $options: 'i',
            };

            mutableFilter.$or = [
                { title: regex },
                { description: regex },
                { sector: regex },
                { duration: regex },
                { keySkills: regex },
            ];
        }

        if (this.params.sector) {
            mutableFilter.sector = {
                $regex: this.params.sector as string,
                $options: 'i',
            };
        }

        if (this.params.type) {
            mutableFilter.type = this.params.type;
        }

        if (this.params.duration) {
            mutableFilter.duration = {
                $regex: this.params.duration as string,
                $options: 'i',
            };
        }

        if (this.params.keyword) {
            mutableFilter.keySkills = {
                $regex: this.params.keyword as string,
                $options: 'i',
            };
        }

        if (this.params.companyName) {
            mutableFilter['company.name'] = {
                $regex: this.params.companyName as string,
                $options: 'i',
            };
        }

        mutableFilter.isVisible = true;

        const lat = this.params.cityLatitude as number | undefined;
        const lon = this.params.cityLongitude as number | undefined;
        const radiusKm = this.params.radiusKm as number | undefined;

        if (lat && lon && radiusKm) {
            mutableFilter['company.location'] = {
                $geoWithin: {
                    $centerSphere: [[lon, lat], radiusKm / 6371],
                },
            };
        }

        return mutableFilter as FilterQuery<T>;
    }

    buildSort() {
        switch (this.params.sort) {
            case 'dateAsc':
                return { createdAt: 1 };
            case 'dateDesc':
                return { createdAt: -1 };
            default:
                return {};
        }
    }
}
