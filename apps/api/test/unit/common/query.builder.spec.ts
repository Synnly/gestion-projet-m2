import { QueryBuilder } from '../../../src/common/pagination/query.builder';

describe('QueryBuilder', () => {
    it('returns empty filter for now when params provided', () => {
        const params = { name: 'Test', city: 'Paris' };
        const qb = new QueryBuilder(params);
        const filter = qb.build();

        expect(filter).toEqual({});
    });

    it('returns empty object when called with empty params', () => {
        const qb = new QueryBuilder({});
        expect(qb.build()).toEqual({});
    });
});
