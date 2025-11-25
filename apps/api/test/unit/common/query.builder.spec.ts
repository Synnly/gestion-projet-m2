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

    it('builds $or with regex when searchQuery provided', () => {
        const qb = new QueryBuilder({ searchQuery: 'dev' });
        const filter = qb.build();

        expect(filter).toHaveProperty('$or');
        expect(filter.$or).toEqual([
            { title: { $regex: '\\bdev\\b', $options: 'i' } },
            { sector: { $regex: '\\bdev\\b', $options: 'i' } },
            { keySkills: { $regex: '\\bdev\\b', $options: 'i' } },
        ]);
    });
});
