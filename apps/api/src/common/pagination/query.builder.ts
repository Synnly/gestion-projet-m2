import { FilterQuery } from 'mongoose';

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
        const filter: FilterQuery<T> = {};

        // The code does nothing special for now but may be used later for advanced filters
        // such as filtering by date, range of values, location, etc.

        if (this.params.searchQuery) {
            const regex = { $regex: `\\b${this.params.searchQuery}\\b`, $options: 'i' };
            filter.$or = [{ title: regex }, { sector: regex }, { keySkills: regex }];
        }
        return filter;
    }
}
