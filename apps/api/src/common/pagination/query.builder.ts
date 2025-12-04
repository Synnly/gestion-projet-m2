import { FilterQuery, Types } from 'mongoose';
import { GeoService } from '../geography/geo.service';

/**
 * QueryBuilder<T>
 *
 * Utility class used to convert HTTP query parameters into a valid
 * Mongoose `FilterQuery<T>` object. It is designed for the `Post`
 * search system and supports:
 *
 * Text search
 * - Global search across: `title`, `description`, `sector`, `duration`, `keySkills`
 * - Field-specific regex filters: `title`, `description`, `duration`
 * - Exact (case-insensitive) match for `sector`
 * - Flexible `keySkills` matching using an array of case-insensitive regexes
 *
 * Company filtering
 * - By company ObjectId (`company`)
 * - By company name (`companyName`, regex-based — requires populated data)
 *
 * Salary filtering
 * - Interval-overlap logic using `minSalary` and `maxSalary`
 * - Returns any post whose salary range intersects the requested interval
 *
 * Geolocation filtering
 * - Uses `$geoWithin` with `$centerSphere`
 * - Requires `location` field as GeoJSON Point `[longitude, latitude]`
 * - Parameters: `cityLatitude`, `cityLongitude`, `radiusKm`
 *
 */

export class QueryBuilder<T> {
    /**
     * Create a new QueryBuilder.
     *
     * @param params - Partial map of keys and values (typically from request query)
     */
    constructor(
        private readonly params: Partial<Record<keyof T | string, any>>,
        private readonly geoService: GeoService,
    ) {}

    /**
     * Build a Mongoose filter object based on the provided params.
     *
     * @returns A `FilterQuery<T>` suitable for passing to `Model.find()`
     */
    async build(): Promise<FilterQuery<T>> {
        const mutableFilter: Record<string, unknown> = {};

        // Global search across common text fields
        const globalSearch = this.params.searchQuery;
        if (globalSearch?.trim()) {
            const regex = { $regex: globalSearch.trim(), $options: 'i' };
            mutableFilter.$or = [
                { title: regex },
                { description: regex },
                { sector: regex },
                { duration: regex },
                { keySkills: regex },
            ];
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
            mutableFilter.company = this.params.company;
        }

        // Salary interval: match posts whose salary range overlaps the requested interval
        const minSalary = this.params.minSalary as number | undefined;
        const maxSalary = this.params.maxSalary as number | undefined;

        if (minSalary !== undefined || maxSalary !== undefined) {
            const andConditions = (mutableFilter.$and ??= []) as Array<Record<string, unknown>>;

            if (minSalary !== undefined && maxSalary !== undefined) {
                // Overlap: post's range [minSalary, maxSalary] overlaps with filter range
                andConditions.push({ maxSalary: { $gte: minSalary } }, { minSalary: { $lte: maxSalary } });
            } else if (minSalary !== undefined) {
                // Only minimum: post.maxSalary >= minSalary
                andConditions.push({ maxSalary: { $gte: minSalary } });
            } else if (maxSalary !== undefined) {
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

        // Filter by company name (via populated field - requires lookup/aggregation for better performance)
        if (this.params.companyName) {
            mutableFilter['company.name'] = {
                $regex: this.params.companyName as string,
                $options: 'i',
            };
        }

        // Geolocation filter: find posts within a radius
        // on demande plutot la ville et la distance en km autour de la ville
        // puis on utilise ces infos pour faire un $geoWithin
        // avec geoService pour recuperer les coordonnees de la ville
        // passé en parametre

        const radiusKm = this.params.radiusKm as number | undefined;

        if (this.params.city !== undefined && radiusKm !== undefined && radiusKm > 0) {
            // geocodeAddress returns Promise<[lon, lat] | null>
            const coo = await this.geoService.geocodeAddress(this.params.city);

            if (coo) {
                mutableFilter.location = {
                    $geoWithin: {
                        $centerSphere: [coo, radiusKm / 6371], // MongoDB expects [lon, lat]
                    },
                };
            }
        }

        // Only show visible posts
        mutableFilter.isVisible = true;

        return mutableFilter as FilterQuery<T>;
    }

    buildSort() {
        // return string acceptable by Mongoose `sort()`
        switch (this.params.sort) {
            case 'dateAsc':
                return 'createdAt';
            case 'dateDesc':
                return '-createdAt';
            default:
                return '-createdAt';
        }
    }
}
