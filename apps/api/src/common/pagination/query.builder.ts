import { FilterQuery } from 'mongoose';

export class QueryBuilder<T> {
  constructor(private readonly params: Partial<Record<keyof T | string, any>>) {}

  build(): FilterQuery<T> {
    const filter: FilterQuery<T> = {};

    // The code does nothing special for now but may be used later for advanced filters
    // such as filtering by date, range of values, location, etc.

    return filter;
  }
}
