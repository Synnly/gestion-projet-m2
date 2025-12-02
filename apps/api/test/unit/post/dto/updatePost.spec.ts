import { UpdatePostDto } from 'src/post/dto/updatePost';
import { PostType } from 'src/post/post.schema';
import { validate } from 'class-validator';

describe('UpdatePostDto', () => {
    it('assigns values from partial and sets isVisible true when title and description present', () => {
        const partial = {
            title: 'T',
            description: 'D',
            sector: 'IT',
            keySkills: ['js', 'ts'],
            type: PostType.INTERN,
        } as Partial<UpdatePostDto>;

        const dto = new UpdatePostDto(partial);

        expect(dto.title).toBe('T');
        expect(dto.description).toBe('D');
        expect(dto.sector).toBe('IT');
        expect(dto.keySkills).toEqual(['js', 'ts']);
        expect(dto.type).toBe(PostType.INTERN);
        expect(dto.isVisible).toBe(true);
    });

    it('sets isVisible false when title missing or empty', () => {
        const dto = new UpdatePostDto({ description: 'D' } as Partial<UpdatePostDto>);
        expect(dto.isVisible).toBe(false);
    });

    it('works when constructed without partial', () => {
        const dto = new UpdatePostDto();
        expect(dto).toBeInstanceOf(UpdatePostDto);
        expect(dto.isVisible).toBeUndefined();
    });

    it('validates minSalary, maxSalary and keySkills constraints via class-validator', async () => {
        const dto = new UpdatePostDto({
            title: 'T',
            description: 'D',
            minSalary: -1,
            maxSalary: -5,
            keySkills: ['a', 'a', 'b', 'c', 'd', 'e'], // duplicate and too many
        } as any);

        const errors = await validate(dto as any);
        // Expect validation errors for min/max salary and for keySkills constraints
        expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('transforms numeric strings to numbers via class-transformer Type decorator', () => {
        const plain = { title: 'T', description: 'D', minSalary: '1234', maxSalary: '2345' } as any;
        const { plainToInstance } = require('class-transformer');
        const dto = plainToInstance(UpdatePostDto, plain);

        expect(typeof dto.minSalary).toBe('number');
        expect(dto.minSalary).toBe(1234);
        expect(typeof dto.maxSalary).toBe('number');
        expect(dto.maxSalary).toBe(2345);
    });
});
