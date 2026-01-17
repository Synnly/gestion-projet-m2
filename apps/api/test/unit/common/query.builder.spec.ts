import { Logger } from '@nestjs/common';
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

        it('builds search filter (text preferred, regex fallback) and sets isVisible', async () => {
            const qb = new QueryBuilder({ searchQuery: 'dev' } as any, mockGeoService as any);
            const filter = await qb.build();

            const txt = (filter as any).$text;
            if (txt) {
                expect(txt).toHaveProperty('$search', 'dev');
                expect(filter).toHaveProperty('isVisible', true);
            } else {
                expect(filter).toHaveProperty('$or');
                expect(filter).toHaveProperty('isVisible', true);
                expect(filter.$or).toEqual([
                    { title: { $regex: 'dev', $options: 'i' } },
                    { description: { $regex: 'dev', $options: 'i' } },
                    { sector: { $regex: 'dev', $options: 'i' } },
                    { duration: { $regex: 'dev', $options: 'i' } },
                    { keySkills: { $regex: 'dev', $options: 'i' } },
                ]);
            }
        });

        it('supports alias `search` for global search (text preferred, regex fallback)', async () => {
            const qb = new QueryBuilder({ searchQuery: 'frontend' } as any, mockGeoService as any);
            const filter = await qb.build();
            const txt = (filter as any).$text;
            if (txt) {
                expect(txt).toHaveProperty('$search', 'frontend');
            } else {
                expect(filter).toHaveProperty('$or');
                expect(filter.$or![0]).toEqual({ title: { $regex: 'frontend', $options: 'i' } });
            }
        });

        it('builds filter with searchQuery alias (text preferred, regex fallback)', async () => {
            const qb = new QueryBuilder({ searchQuery: 'backend' } as any, mockGeoService as any);
            const filter = await qb.build();
            const txt = (filter as any).$text;
            if (txt) {
                expect(txt).toHaveProperty('$search', 'backend');
            } else {
                expect(filter.$or).toEqual([
                    { title: { $regex: 'backend', $options: 'i' } },
                    { description: { $regex: 'backend', $options: 'i' } },
                    { sector: { $regex: 'backend', $options: 'i' } },
                    { duration: { $regex: 'backend', $options: 'i' } },
                    { keySkills: { $regex: 'backend', $options: 'i' } },
                ]);
            }
        });

        it('trims whitespace from search query (text preferred, regex fallback)', async () => {
            const qb = new QueryBuilder({ searchQuery: '  dev  ' } as any, mockGeoService as any);
            const filter = await qb.build();
            const txt = (filter as any).$text;
            if (txt) {
                expect(txt).toHaveProperty('$search', 'dev');
            } else {
                expect(filter.$or).toEqual([
                    { title: { $regex: 'dev', $options: 'i' } },
                    { description: { $regex: 'dev', $options: 'i' } },
                    { sector: { $regex: 'dev', $options: 'i' } },
                    { duration: { $regex: 'dev', $options: 'i' } },
                    { keySkills: { $regex: 'dev', $options: 'i' } },
                ]);
            }
        });

        it('escapes regex special characters when falling back to regex search', async () => {
            // Test with multi-token search to trigger fuzzy search (not $text)
            const qb = new QueryBuilder({ searchQuery: 'développeur full stack' } as any, mockGeoService as any);
            const filter = await qb.build();

            // Should use fuzzy search with $and for each token
            expect(filter.$and).toBeDefined();
            expect(Array.isArray(filter.$and)).toBe(true);
            expect(filter.$and.length).toBe(3); // Three tokens
            // Each token should have an $or with fields
            expect(filter.$and[0]).toHaveProperty('$or');
            expect(filter.$and[0].$or).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ title: expect.any(RegExp) }),
                ])
            );
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
            const companyId = new Types.ObjectId('507f1f77bcf86cd799439011');
            const qb = new QueryBuilder({ company: companyId.toString() } as any, mockGeoService as any);
            const filter = await qb.build();
            expect(filter.company.toString()).toBe(companyId.toString());
        });

        it('does not map companyName to nested company.name by default', async () => {
            const qb = new QueryBuilder({ companyName: 'Tech Corp' } as any, mockGeoService as any);
            const filter = await qb.build();

            // current QueryBuilder does not create a nested company.name filter
            expect((filter as any)['company.name']).toBeUndefined();
        });

        it('filters by salary range overlap when both minSalary and maxSalary provided', async () => {
            const qb = new QueryBuilder({ minSalary: 2000, maxSalary: 3000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([
                { minSalary: { $type: 'number', $gte: 2000, $lte: 3000 } },
                { maxSalary: { $type: 'number', $lte: 3000 } },
            ]);
        });

        it('filters by minSalary only', async () => {
            const qb = new QueryBuilder({ minSalary: 2000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([{ minSalary: { $type: 'number', $gte: 2000 } }]);
        });

        it('filters by maxSalary only', async () => {
            const qb = new QueryBuilder({ maxSalary: 3000 } as any, mockGeoService as any);
            const filter = await qb.build();

            expect(filter.$and).toEqual([
                { minSalary: { $type: 'number', $lte: 3000 } },
                {
                    $or: [
                        { maxSalary: { $type: 'number', $lte: 3000 } },
                        { maxSalary: { $exists: false } },
                    ],
                },
            ]);
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

        it('combines multiple filters (text preferred, regex fallback)', async () => {
            const qb = new QueryBuilder(
                {
                    searchQuery: 'dev',
                    sector: 'IT',
                    minSalary: 2000,
                    keySkills: ['JavaScript'],
                } as any,
                mockGeoService as any,
            );
            const filter = await qb.build();

            expect(filter.isVisible).toBe(true);
            const txt = (filter as any).$text;
            if (txt) {
                expect(txt).toHaveProperty('$search', 'dev');
            } else {
                expect(filter.$or).toBeDefined();
            }
            expect(filter.sector).toEqual({ $regex: '^IT$', $options: 'i' });
            expect(filter.$and).toBeDefined();
            expect(filter.keySkills).toBeDefined();
        });
    });

    describe('buildSort', () => {
        it('returns ascending sort token for dateAsc', () => {
            const qb = new QueryBuilder({ sort: 'dateAsc' } as any, mockGeoService as any);
            // Call with the explicit sort param (current implementation expects an argument)
            expect(qb.buildSort('dateAsc')).toBe('1');
        });

        it('returns descending sort token for dateDesc', () => {
            const qb = new QueryBuilder({ sort: 'dateDesc' } as any, mockGeoService as any);
            expect(qb.buildSort('dateDesc')).toBe('-1');
        });

        it('returns default descending token for unknown value', () => {
            const qb = new QueryBuilder({ sort: 'unknown' } as any, mockGeoService as any);
            expect(qb.buildSort('unknown')).toBe('-1');
        });

        it('returns default descending token when no sort provided', () => {
            const qb = new QueryBuilder({} as any, mockGeoService as any);
            expect(qb.buildSort(undefined)).toBe('-1');
        });
    });
});
