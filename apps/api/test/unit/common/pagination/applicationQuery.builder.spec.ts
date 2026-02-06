import { ApplicationQueryBuilder } from '../../../../src/common/pagination/applicationQuery.builder';

describe('ApplicationQueryBuilder', () => {
    describe('build()', () => {
        it('should return empty filter when no params provided', () => {
            const builder = new ApplicationQueryBuilder({});
            const result = builder.build();

            expect(result).toEqual({});
        });

        it('should filter by status when status is a string', () => {
            const builder = new ApplicationQueryBuilder({ status: 'PENDING' });
            const result = builder.build();

            expect(result).toEqual({ status: 'PENDING' });
        });

        it('should filter by status with $in when status is an array', () => {
            const builder = new ApplicationQueryBuilder({ status: ['PENDING', 'ACCEPTED'] });
            const result = builder.build();

            expect(result).toEqual({ status: { $in: ['PENDING', 'ACCEPTED'] } });
        });

        it('should filter by post when post is provided', () => {
            const builder = new ApplicationQueryBuilder({ post: 'post123' });
            const result = builder.build();

            expect(result).toEqual({ post: 'post123' });
        });

        it('should combine status and post filters', () => {
            const builder = new ApplicationQueryBuilder({ status: 'PENDING', post: 'post123' });
            const result = builder.build();

            expect(result).toEqual({ status: 'PENDING', post: 'post123' });
        });

        it('should combine status array and post filters', () => {
            const builder = new ApplicationQueryBuilder({ status: ['PENDING', 'ACCEPTED'], post: 'post123' });
            const result = builder.build();

            expect(result).toEqual({ status: { $in: ['PENDING', 'ACCEPTED'] }, post: 'post123' });
        });
    });

    describe('buildSort()', () => {
        it('should return "createdAt" for dateAsc sort', () => {
            const builder = new ApplicationQueryBuilder({ sort: 'dateAsc' });
            const result = builder.buildSort();

            expect(result).toBe('createdAt');
        });

        it('should return "-createdAt" for dateDesc sort', () => {
            const builder = new ApplicationQueryBuilder({ sort: 'dateDesc' });
            const result = builder.buildSort();

            expect(result).toBe('-createdAt');
        });

        it('should return "createdAt" as default when no sort specified', () => {
            const builder = new ApplicationQueryBuilder({});
            const result = builder.buildSort();

            expect(result).toBe('createdAt');
        });

        it('should return "createdAt" as default for unknown sort value', () => {
            const builder = new ApplicationQueryBuilder({ sort: 'unknownSort' });
            const result = builder.buildSort();

            expect(result).toBe('createdAt');
        });
    });
});
