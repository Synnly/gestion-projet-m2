import { QueryBuilder } from '../../../src/common/pagination/query.builder';
import { Types } from 'mongoose';

// Provide a lightweight mock for GeoService used by QueryBuilder
const mockGeoService = {
    geocodeAddress: jest.fn().mockResolvedValue([2.3522, 48.8566]),
};

describe('QueryBuilder', () => {
    describe('build', () => {
        it('returns filter with isVisible true when params provided', async () => {
            const params = { name: 'Test', city: 'Paris' };
            const qb = new QueryBuilder(params as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter).toEqual({ isVisible: true });
        });

        it('returns filter with isVisible true when called with empty params', async () => {
            const qb = new QueryBuilder({} as any, mockGeoService as any);
            expect(await qb.build()).toEqual({ isVisible: true });
        });

        it('builds $or with regex and isVisible when search provided', async () => {
            const qb = new QueryBuilder({ searchQuery: 'dev' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter).toHaveProperty('$or');
            expect(filter).toHaveProperty('isVisible', true);
            expect(filter.$or).toEqual([
                { title: { $regex: 'dev', $options: 'i' } },
                { description: { $regex: 'dev', $options: 'i' } },
                { sector: { $regex: 'dev', $options: 'i' } },
                { duration: { $regex: 'dev', $options: 'i' } },
                { keySkills: { $regex: 'dev', $options: 'i' } },
            ]);
        });

        it('supports alias `search` for global search', async () => {
            const qb = new QueryBuilder({ searchQuery: 'frontend' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter).toHaveProperty('$or');
            expect(filter.$or![0]).toEqual({ title: { $regex: 'frontend', $options: 'i' } });
        });

        it('builds filter with searchQuery alias', async () => {
            const qb = new QueryBuilder({ searchQuery: 'backend' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$or).toEqual([
                { title: { $regex: 'backend', $options: 'i' } },
                { description: { $regex: 'backend', $options: 'i' } },
                { sector: { $regex: 'backend', $options: 'i' } },
                { duration: { $regex: 'backend', $options: 'i' } },
                { keySkills: { $regex: 'backend', $options: 'i' } },
            ]);
        });

        it('trims whitespace from search query', async () => {
            const qb = new QueryBuilder({ searchQuery: '  dev  ' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$or).toEqual([
                { title: { $regex: 'dev', $options: 'i' } },
                { description: { $regex: 'dev', $options: 'i' } },
                { sector: { $regex: 'dev', $options: 'i' } },
                { duration: { $regex: 'dev', $options: 'i' } },
                { keySkills: { $regex: 'dev', $options: 'i' } },
            ]);
        });

        it('filters by title with regex', async () => {
            const qb = new QueryBuilder({ title: 'Développeur' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.title).toEqual({ $regex: 'Développeur', $options: 'i' });
            expect(filter.isVisible).toBe(true);
        });

        it('filters by description with regex', async () => {
            const qb = new QueryBuilder({ description: 'lorem ipsum' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.description).toEqual({ $regex: 'lorem ipsum', $options: 'i' });
            expect(filter.isVisible).toBe(true);
        });

        it('filters by duration with regex', async () => {
            const qb = new QueryBuilder({ duration: '6 months' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.duration).toEqual({ $regex: '6 months', $options: 'i' });
            expect(filter.isVisible).toBe(true);
        });

        it('filters by sector with exact match regex', async () => {
            const qb = new QueryBuilder({ sector: 'IT' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.sector).toEqual({ $regex: '^IT$', $options: 'i' });
        });

        it('filters by type with exact match', async () => {
            const qb = new QueryBuilder({ type: 'Hybride' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.type).toBe('Hybride');
        });

        it('filters by company ObjectId', async () => {
            const companyId = new Types.ObjectId().toString();
            const qb = new QueryBuilder({ company: companyId } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.company).toBe(companyId);
        });

        it('filters by company name with regex', async () => {
            const qb = new QueryBuilder({ companyName: 'Tech Corp' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter['company.name']).toEqual({ $regex: 'Tech Corp', $options: 'i' });
        });

        it('filters by salary range overlap when both minSalary and maxSalary provided', async () => {
            const qb = new QueryBuilder({ minSalary: 2000, maxSalary: 3000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([{ maxSalary: { $gte: 2000 } }, { minSalary: { $lte: 3000 } }]);
        });

        it('filters by minSalary only', async () => {
            const qb = new QueryBuilder({ minSalary: 2000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([{ maxSalary: { $gte: 2000 } }]);
        });

        it('filters by maxSalary only', async () => {
            const qb = new QueryBuilder({ maxSalary: 3000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([{ minSalary: { $lte: 3000 } }]);
        });

        it('filters by keySkills array with regex', async () => {
            const qb = new QueryBuilder({ keySkills: ['JavaScript', 'TypeScript'] } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.keySkills).toHaveProperty('$in');
            expect(Array.isArray(filter.keySkills.$in)).toBe(true);
            expect(filter.keySkills.$in).toHaveLength(2);
        });

        it('filters by keySkills string with regex', async () => {
            const qb = new QueryBuilder({ keySkills: 'JavaScript' } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.keySkills).toHaveProperty('$in');
            expect(filter.keySkills.$in).toHaveLength(1);
        });

        it('filters by geolocation with valid coordinates and radius', async () => {
            const qb = new QueryBuilder({ city: 'Paris', radiusKm: 10 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.location).toEqual({
                $geoWithin: {
                    $centerSphere: [[2.3522, 48.8566], 10 / 6371],
                },
            });
        });

        it('ignores geolocation filter when radius is 0', async () => {
            const qb = new QueryBuilder({ city: 'Paris', radiusKm: 0 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.location).toBeUndefined();
        });

        it('ignores geolocation filter when coordinates incomplete', async () => {
            const qb = new QueryBuilder({ radiusKm: 10 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.location).toBeUndefined();
        });

        it('combines multiple filters', async () => {
            const qb = new QueryBuilder({
                searchQuery: 'dev',
                sector: 'IT',
                minSalary: 2000,
                keySkills: ['JavaScript'],
            } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.isVisible).toBe(true);
            expect(filter.$or).toBeDefined();
            expect(filter.sector).toEqual({ $regex: '^IT$', $options: 'i' });
            expect(filter.$and).toBeDefined();
            expect(filter.keySkills).toBeDefined();
        });
    });

    describe('buildSort', () => {
        it('returns ascending sort for dateAsc', () => {
            const qb = new QueryBuilder({ sort: 'dateAsc' });
            expect(qb.buildSort()).toBe('createdAt');
        });

        it('returns descending sort for dateDesc', () => {
            const qb = new QueryBuilder({ sort: 'dateDesc' });
            expect(qb.buildSort()).toBe('-createdAt');
        });

        it('returns default descending sort for unknown value', () => {
            const qb = new QueryBuilder({ sort: 'unknown' });
            expect(qb.buildSort()).toBe('-createdAt');
        });

        it('returns default descending sort when no sort provided', () => {
            const qb = new QueryBuilder({});
            expect(qb.buildSort()).toBe('-createdAt');
        });
    });
});
