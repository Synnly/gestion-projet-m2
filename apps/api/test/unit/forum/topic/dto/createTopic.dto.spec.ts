import { validate } from 'class-validator';
import { CreateTopicDto } from '../../../../../src/forum/topic/dto/createTopic.dto';

describe('CreateTopicDto', () => {
    describe('validation', () => {
        describe('title field', () => {
            it('should validate successfully when valid title is provided', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Topic Title';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should fail validation when title is not a string', async () => {
                const dto = new CreateTopicDto();
                (dto as any).title = 123;

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const titleError = errors.find((e) => e.property === 'title');
                expect(titleError).toBeDefined();
                expect(titleError?.constraints).toHaveProperty('isString');
            });

            it('should fail validation when title is null', async () => {
                const dto = new CreateTopicDto();
                (dto as any).title = null;

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const titleError = errors.find((e) => e.property === 'title');
                expect(titleError).toBeDefined();
                expect(titleError?.constraints).toHaveProperty('isString');
            });

            it('should fail validation when title is undefined', async () => {
                const dto = new CreateTopicDto();

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const titleError = errors.find((e) => e.property === 'title');
                expect(titleError).toBeDefined();
            });

            it('should fail validation when title is an object', async () => {
                const dto = new CreateTopicDto();
                (dto as any).title = { name: 'title' };

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const titleError = errors.find((e) => e.property === 'title');
                expect(titleError).toBeDefined();
                expect(titleError?.constraints).toHaveProperty('isString');
            });

            it('should fail validation when title is an array', async () => {
                const dto = new CreateTopicDto();
                (dto as any).title = ['title'];

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const titleError = errors.find((e) => e.property === 'title');
                expect(titleError).toBeDefined();
                expect(titleError?.constraints).toHaveProperty('isString');
            });
        });

        describe('description field', () => {
            it('should validate successfully when valid description is provided', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                dto.description = 'Valid description for the topic';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should validate successfully when description is undefined', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should fail validation when description is not a string', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                (dto as any).description = 123;

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const descriptionError = errors.find((e) => e.property === 'description');
                expect(descriptionError).toBeDefined();
                expect(descriptionError?.constraints).toHaveProperty('isString');
            });

            it('should validate successfully when description is null', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                (dto as any).description = null;

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should fail validation when description is an object', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                (dto as any).description = { text: 'description' };

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const descriptionError = errors.find((e) => e.property === 'description');
                expect(descriptionError).toBeDefined();
                expect(descriptionError?.constraints).toHaveProperty('isString');
            });

            it('should fail validation when description is an array', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                (dto as any).description = ['description'];

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                const descriptionError = errors.find((e) => e.property === 'description');
                expect(descriptionError).toBeDefined();
                expect(descriptionError?.constraints).toHaveProperty('isString');
            });

            it('should validate successfully when description is empty string', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Valid Title';
                dto.description = '';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });
        });

        describe('complete DTO validation', () => {
            it('should validate successfully with only required fields', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Title Only';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should validate successfully with all fields', async () => {
                const dto = new CreateTopicDto();
                dto.title = 'Complete Topic';
                dto.description = 'This is a complete description';

                const errors = await validate(dto);
                expect(errors).toHaveLength(0);
            });

            it('should fail validation when both fields are invalid', async () => {
                const dto = new CreateTopicDto();
                (dto as any).title = 123;
                (dto as any).description = 456;

                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors.length).toBe(2);
            });
        });
    });
});
