import { FilterQuery, Types } from 'mongoose';
import { GeoService } from '../geography/geo.service';
import { buildFuzzyRegex, tokenizeSearchQuery } from '../utils/fuzzy-search.utils';
import { toNumberOrUndefined, toStringOrUndefined } from '../utils/parse.utils';
import { escapeRegexLiteral } from '../utils/regex.utils';

/**
 * Build a Mongoose `FilterQuery<T>` from request query parameters.
 * Implements fuzzy search (typo-tolerant and accent-insensitive).
 * Supports field regex, `keySkills` ($in regex), salary-range filtering (containment/boundary conditions), and geolocation via `GeoService`.
 * `build()` is async because geocoding may be performed; result is ready for `Model.find()`.
 */

/**
 * Earth radius in kilometers, used for geospatial calculations.
 */
const EARTH_RADIUS_KM: number = 6371;

const DEFAULT_GLOBAL_SEARCH_FIELDS = ['title', 'description', 'sector', 'duration', 'keySkills'] as const;

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

        // Global fuzzy search: typo-tolerant and accent-insensitive
        // Searches across title, description, sector, duration, and keySkills
        // Examples: "sa" finds "sanitaires", "assistante",
        //           "creation" finds "création", "crzation" (with typo), etc.

        const globalSearch = toStringOrUndefined(this.params.searchQuery);
        if (globalSearch) {
            // “Le/les mots” => AND across tokens, and OR across fields for each token
            const tokens = tokenizeSearchQuery(globalSearch);

            if (tokens.length > 0) {
                // Prefer MongoDB native text search for simple single-token queries (fast, index-backed),
                // and fall back to fuzzy regex search for more complex or typo-tolerant queries.
                const isSingleSimpleToken =
                    tokens.length === 1 &&
                    // Simple heuristic: single alphanumeric token (no punctuation/operators)
                    /^[\p{L}\p{N}]+$/u.test(tokens[0]);

                if (isSingleSimpleToken) {
                    // Use text index when available; keeps query fast and index-backed.
                    // Fuzzy search will still be used for multi-word/complex queries below.
                    mutableFilter.$text = { $search: globalSearch };
                } else {
                    const andConditions = (mutableFilter.$and ??= []) as Array<Record<string, unknown>>;
                    for (const token of tokens) {
                        const re = buildFuzzyRegex(token);
                        andConditions.push({
                            $or: DEFAULT_GLOBAL_SEARCH_FIELDS.map((field) => ({ [field]: re })),
                        });
                    }
                }
            }
        }

        // Specific field filters
        const title = toStringOrUndefined(this.params.title);
        if (title) mutableFilter.title = { $regex: escapeRegexLiteral(title), $options: 'i' };

        const description = toStringOrUndefined(this.params.description);
        if (description) mutableFilter.description = { $regex: escapeRegexLiteral(description), $options: 'i' };

        const sector = toStringOrUndefined(this.params.sector);
        if (sector) mutableFilter.sector = { $regex: `^${escapeRegexLiteral(sector)}$`, $options: 'i' };

        if (this.params.type != null) mutableFilter.type = this.params.type;

        const duration = toStringOrUndefined(this.params.duration);
        if (duration) mutableFilter.duration = { $regex: escapeRegexLiteral(duration), $options: 'i' };

        // Company filter (by ObjectId)
        const companyId = toStringOrUndefined(this.params.company);
        if (companyId && Types.ObjectId.isValid(companyId)) {
            mutableFilter.company = new Types.ObjectId(companyId);
        }

        // Salary interval: match posts whose salary range is contained within the requested interval
        let minSalary = toNumberOrUndefined(this.params.minSalary);
        let maxSalary = toNumberOrUndefined(this.params.maxSalary);

        // Swap if minSalary > maxSalary (handle user input errors)
        if (minSalary != null && maxSalary != null && minSalary > maxSalary) {
            [minSalary, maxSalary] = [maxSalary, minSalary];
        }

        if (minSalary != null || maxSalary != null) {
            const andConditions = (mutableFilter.$and ??= []) as Array<Record<string, unknown>>;

            if (minSalary != null && maxSalary != null) {
                andConditions.push(
                    { minSalary: { $type: 'number', $gte: minSalary, $lte: maxSalary } },
                    { maxSalary: { $type: 'number', $lte: maxSalary } },
                );
            } else if (minSalary != null) {
                andConditions.push({ minSalary: { $type: 'number', $gte: minSalary } });
            } else if (maxSalary != null) {
                andConditions.push(
                    { minSalary: { $type: 'number', $lte: maxSalary } },
                    {
                        $or: [{ maxSalary: { $type: 'number', $lte: maxSalary } }, { maxSalary: { $exists: false } }],
                    },
                );
            }
        }

        // KeySkills filter: support single string or array
        if (this.params.keySkills) {
            const raw = this.params.keySkills;
            const skills = (Array.isArray(raw) ? raw : [raw])
                .map((s: unknown) => toStringOrUndefined(s))
                .filter((s): s is string => Boolean(s));

            if (skills.length > 0) {
                const regexes = skills.map((s) => new RegExp(escapeRegexLiteral(s), 'i'));
                mutableFilter.keySkills = { $in: regexes };
            }
        }

        // Geolocation filter: find posts within a radius
        const radiusKm = toNumberOrUndefined(this.params.radiusKm);
        const city = toStringOrUndefined(this.params.city);

        if (city && radiusKm != null && radiusKm > 0) {
            const coo = await this.geoService?.geocodeAddress(city);
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

        if (this.params._id) mutableFilter._id = this.params._id;

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
