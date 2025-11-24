import { PaginationService } from '../../../src/common/pagination/pagination.service';

describe('PaginationService', () => {
    let service: PaginationService;

    beforeEach(() => {
        service = new PaginationService();
    });

    const makeMockModel = (items: any[], total: number) => {
        const lean = jest.fn().mockResolvedValue(items);
        const query: any = {
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            lean,
        };

        const model: any = {
            find: jest.fn().mockReturnValue(query),
            countDocuments: jest.fn().mockResolvedValue(total),
        };

        return { model, query };
    };

    it('calculates pagination meta and returns data', async () => {
        const items = [{ _id: '1' }, { _id: '2' }];
        const total = 5;
        const { model, query } = makeMockModel(items, total);

        const result = await service.paginate(model, {}, 1, 2, ['posts']);

        expect(model.find).toHaveBeenCalledWith({});
        expect(query.skip).toHaveBeenCalledWith(0);
        expect(query.limit).toHaveBeenCalledWith(2);
        expect(query.populate).toHaveBeenCalledWith('posts');
        expect(result.data).toEqual(items);
        expect(result.total).toBe(total);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(2);
        expect(result.totalPages).toBe(Math.ceil(total / 2));
        expect(result.hasNext).toBe(1 * 2 < total);
        expect(result.hasPrev).toBe(false);
    });

    it('handles empty results correctly', async () => {
        const items: any[] = [];
        const total = 0;
        const { model, query } = makeMockModel(items, total);

        const result = await service.paginate(model, {}, 1, 10);

        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.totalPages).toBe(0);
        expect(result.hasNext).toBe(false);
        expect(result.hasPrev).toBe(false);
    });

    it('returns values even when limit is <= 0 (edge case)', async () => {
        const items: any[] = [{ _id: '1' }];
        const total = 3;
        const { model } = makeMockModel(items, total);

        const result = await service.paginate(model, {}, 1, -5);

        // ensure function doesn't throw and returns a structure; totalPages may be negative
        expect(result.data).toEqual(items);
        expect(typeof result.totalPages === 'number').toBe(true);
    });
});
