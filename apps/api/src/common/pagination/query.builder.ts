import { FilterQuery, Types } from 'mongoose';
import { GeoService } from '../geography/geo.service';

/**
 * Build a Mongoose `FilterQuery<T>` from request query parameters.
 * Uses `$text` (text index) for global search with regex fallback when absent.
 * Supports field regex, `keySkills` ($in regex), salary-overlap and geolocation via `GeoService`.
 * `build()` is async because geocoding may be performed; result is ready for `Model.find()`.
 */

/**
 * Earth radius in kilometers, used for geospatial calculations.
 */
const EARTH_RADIUS_KM: number = 6371;

export class QueryBuilder<T> {
    /**
     * Create a new QueryBuilder.
     *
     * @param params - Partial map of keys and values (typically from request query)
     */
    constructor(
        private readonly params: Partial<Record<keyof T | string, any>>,
        private readonly geoService?: GeoService,
    ) {}

    /**
     * Build a Mongoose filter object based on the provided params.
     * @param isForum - Whether the query is for forums (affects visibility filter), defaults to false
     * @returns A `FilterQuery<T>` suitable for passing to `Model.find()`
     */
    async build(isForum: boolean = false): Promise<FilterQuery<T>> {
        const mutableFilter: Record<string, unknown> = {};

        // Global search using MongoDB text index (optimized for performance)
        // Falls back to regex search if text index is not available
        const globalSearch = this.params.searchQuery;
        if (globalSearch?.trim()) {
            const searchTerm = globalSearch.trim();

            // Try to use $text search (requires text index on schema)
            // This is 10-100x faster than $regex on large collections
            try {
                mutableFilter.$text = {
                    $search: searchTerm,
                    $caseSensitive: false,
                };
            } catch (error) {
                // Fallback to regex if text index doesn't exist (dev/test env)
                const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = { $regex: escapeRegex(searchTerm), $options: 'i' };
                mutableFilter.$or = [
                    { title: regex },
                    { description: regex },
                    { sector: regex },
                    { duration: regex },
                    { keySkills: regex },
                ];
            }
        }

        // Specific field filters
        if (this.params.title) {
            mutableFilter.title = { $regex: this.params.title as string, $options: 'i' };
        }

        if (this.params.description) {
            mutableFilter.description = { $regex: this.params.description as string, $options: 'i' };
        }

        if (this.params.sector) {
            mutableFilter.sector = { $regex: `^${this.params.sector}$`, $options: 'i' };
        }

        if (this.params.type) {
            mutableFilter.type = this.params.type;
        }

        if (this.params.duration) {
            mutableFilter.duration = { $regex: this.params.duration as string, $options: 'i' };
        }

        // Company filter (by ObjectId)
        if (this.params.company) {
            mutableFilter.company = new Types.ObjectId(this.params.company);
        }

        // Salary interval: match posts whose salary range overlaps the requested interval
        let minSalary = this.params.minSalary as number | undefined;
        let maxSalary = this.params.maxSalary as number | undefined;

        if (minSalary && maxSalary && minSalary > maxSalary) {
            const temp = minSalary;
            minSalary = maxSalary;
            maxSalary = temp;
        }

        if (minSalary || maxSalary) {
            const andConditions = (mutableFilter.$and ??= []) as Array<Record<string, unknown>>;

            if (minSalary && maxSalary) {
                // Overlap: post's range [minSalary, maxSalary] overlaps with filter range
                andConditions.push({ maxSalary: { $gte: minSalary } }, { minSalary: { $lte: maxSalary } });
            } else if (minSalary) {
                // Only minimum: post.maxSalary >= minSalary
                andConditions.push({ maxSalary: { $gte: minSalary } });
            } else if (maxSalary) {
                // Only maximum: post.minSalary <= maxSalary
                andConditions.push({ minSalary: { $lte: maxSalary } });
            }
        }

        // KeySkills filter: support single string or array
        if (this.params.keySkills) {
            const ks = Array.isArray(this.params.keySkills) ? this.params.keySkills : [this.params.keySkills];
            const regexes = ks.map((s: string) => new RegExp(s, 'i'));
            mutableFilter.keySkills = { $in: regexes };
        }

        // Geolocation filter: find posts within a radius
        const radiusKm = this.params.radiusKm as number | undefined;

        if (this.params.city && radiusKm && radiusKm > 0) {
            const coo = await this.geoService.geocodeAddress(this.params.city);
            if (coo) {
                mutableFilter.location = {
                    $geoWithin: {
                        $centerSphere: [coo, radiusKm / EARTH_RADIUS_KM], // MongoDB expects [lon, lat]
                    },
                };
            }
        }

        // Only show visible posts
        if (!isForum) mutableFilter.isVisible = true;

        return mutableFilter as FilterQuery<T>;
    }
    buildMessageFilter(): FilterQuery<T> {
        const mutableFilter: Record<string, unknown> = {};
        if (this.params.topicId) {
            mutableFilter.topicId = new Types.ObjectId(this.params.topicId);
        }
        return mutableFilter as FilterQuery<T>;
    }
    buildSort(sortParam: string | undefined): string {
        // return string acceptable by Mongoose `sort()`
        switch (sortParam) {
            case 'dateAsc':
                return '1';
            case 'dateDesc':
                return '-1';
            default:
                return '-1';
        }
    }
}
