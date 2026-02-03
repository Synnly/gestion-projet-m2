import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ApplicationPaginationDto } from '../../../../src/common/pagination/dto/applicationPagination.dto';
import { ApplicationStatus } from '../../../../src/application/application.schema';

describe('ApplicationPaginationDto (Query DTO)', () => {
    describe('validation', () => {
        it('should use default values when no parameters provided', () => {
            const dto = plainToInstance(ApplicationPaginationDto, {});

            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('should accept valid page and limit values', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                page: 2,
                limit: 20,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.page).toBe(2);
            expect(dto.limit).toBe(20);
        });

        it('should accept status filter', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                status: ApplicationStatus.Pending,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.status).toBe(ApplicationStatus.Pending);
        });

        it('should accept sort parameter', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                sort: 'dateDesc',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.sort).toBe('dateDesc');
        });

        it('should reject page less than 1', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                page: 0,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('page');
        });

        it('should reject limit less than 1', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                limit: 0,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('limit');
        });

        it('should reject limit greater than 100', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                limit: 101,
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('limit');
        });

        it('should accept limit of exactly 100', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                limit: 100,
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.limit).toBe(100);
        });

        it('should transform string values to numbers', () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                page: '3',
                limit: '25',
            });

            expect(typeof dto.page).toBe('number');
            expect(typeof dto.limit).toBe('number');
            expect(dto.page).toBe(3);
            expect(dto.limit).toBe(25);
        });

        it('should accept all parameters together', async () => {
            const dto = plainToInstance(ApplicationPaginationDto, {
                page: 3,
                limit: 50,
                status: ApplicationStatus.Accepted,
                sort: 'dateAsc',
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
            expect(dto.page).toBe(3);
            expect(dto.limit).toBe(50);
            expect(dto.status).toBe(ApplicationStatus.Accepted);
            expect(dto.sort).toBe('dateAsc');
        });
    });
});
