import { FilterQuery } from 'mongoose';

export class ApplicationQueryBuilder<T> {
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
        if (Array.isArray(this.params.status)) {
            mutableFilter.status = { $in: this.params.status };
        } else if (this.params.status) {
            mutableFilter.status = this.params.status;
        }
        if (this.params.post) {
            mutableFilter.post = this.params.post;
        }

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
                return 'createdAt';
        }
    }
}
