import { FilterQuery } from 'mongoose';

export class QueryBuilder<T> {
  constructor(private readonly params: Partial<Record<keyof T | string, any>>) {}

  build(): FilterQuery<T> {
    const filter: FilterQuery<T> = {};

    //Le code ne fait rien de spécial pour l'instant mais pourra servir plus tard pour des filtres avancés
    // comme le filtrage par date, par plage de valeurs, par lieux, etc.

    return filter;
  }
}
