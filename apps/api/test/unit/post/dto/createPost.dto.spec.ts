import { validate } from 'class-validator';
import { CreatePostDto } from '../../../../src/post/dto/createPost.dto';
import { PostType } from '../../../../src/post/post-type.enum';

describe('CreatePostDto', () => {
    describe('validation', () => {
        it('should validate successfully when all required fields are provided', async () => {
            const dto = new CreatePostDto({
                title: 'Développeur Full Stack',
                description: 'Nous recherchons un développeur expérimenté',
                keySkills: ['JavaScript', 'TypeScript'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when title is missing', async () => {
            const dto = new CreatePostDto({
                description: 'Description',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('title');
        });

        it('should fail validation when description is missing', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('description');
        });

        it('should fail validation when title is not a string', async () => {
            const dto = new CreatePostDto({
                title: 123,
                description: 'Description',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const titleError = errors.find((e) => e.property === 'title');
            expect(titleError).toBeDefined();
        });

        it('should fail validation when description is not a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 123,
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const descError = errors.find((e) => e.property === 'description');
            expect(descError).toBeDefined();
        });

        it('should validate successfully when duration is a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                duration: '6 mois',
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when duration is not a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                duration: 6,
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const durationError = errors.find((e) => e.property === 'duration');
            expect(durationError).toBeDefined();
        });

        it('should validate successfully when startDate is a valid date string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                startDate: '2025-01-15',
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when startDate is not a valid date string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                startDate: 'invalid-date',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const startDateError = errors.find((e) => e.property === 'startDate');
            expect(startDateError).toBeDefined();
        });

        it('should validate successfully when minSalary is a positive number', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                minSalary: 2000,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when minSalary is zero', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                minSalary: 0,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when minSalary is negative', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                minSalary: -1,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const minSalaryError = errors.find((e) => e.property === 'minSalary');
            expect(minSalaryError).toBeDefined();
        });

        it('should fail validation when minSalary is not a number', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                minSalary: 'not-a-number',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const minSalaryError = errors.find((e) => e.property === 'minSalary');
            expect(minSalaryError).toBeDefined();
        });

        it('should validate successfully when maxSalary is a positive number', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                maxSalary: 3000,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when maxSalary is negative', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                maxSalary: -1,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const maxSalaryError = errors.find((e) => e.property === 'maxSalary');
            expect(maxSalaryError).toBeDefined();
        });

        it('should validate successfully when sector is a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                sector: 'IT',
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when sector is not a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                sector: 123,
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const sectorError = errors.find((e) => e.property === 'sector');
            expect(sectorError).toBeDefined();
        });

        it('should validate successfully when keySkills is an array of strings', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                keySkills: ['Skill1', 'Skill2'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when keySkills contains more than 5 items', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                keySkills: ['Skill1', 'Skill2', 'Skill3', 'Skill4', 'Skill5', 'Skill6'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const keySkillsError = errors.find((e) => e.property === 'keySkills');
            expect(keySkillsError).toBeDefined();
        });

        it('should fail validation when keySkills contains duplicate values', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                keySkills: ['Skill1', 'Skill1'],
            });

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const keySkillsError = errors.find((e) => e.property === 'keySkills');
            expect(keySkillsError).toBeDefined();
        });

        it('should fail validation when keySkills is not an array', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                keySkills: 'not-an-array',
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const keySkillsError = errors.find((e) => e.property === 'keySkills');
            expect(keySkillsError).toBeDefined();
        });

        it('should fail validation when keySkills contains non-string values', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                keySkills: ['Skill1', 123],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const keySkillsError = errors.find((e) => e.property === 'keySkills');
            expect(keySkillsError).toBeDefined();
        });

        it('should validate successfully when adress is a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                adress: 'Paris, France',
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when adress is not a string', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                adress: 123,
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const adressError = errors.find((e) => e.property === 'adress');
            expect(adressError).toBeDefined();
        });

        it('should validate successfully when type is Presentiel', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                type: PostType.Presentiel,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when type is Teletravail', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                type: PostType.Teletravail,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when type is Hybride', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                type: PostType.Hybride,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when type is not a valid PostType value', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                type: 'InvalidType',
                keySkills: ['Skill1'],
            } as any);

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const typeError = errors.find((e) => e.property === 'type');
            expect(typeError).toBeDefined();
        });

        it('should validate successfully when isVisible is true', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                isVisible: true,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when isVisible is false', async () => {
            const dto = new CreatePostDto({
                title: 'Title',
                description: 'Description',
                isVisible: false,
                keySkills: ['Skill1'],
            });

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('constructor', () => {
        it('should create instance with all fields when constructor is called with complete data', () => {
            const data = {
                title: 'Développeur Full Stack',
                description: 'Description complète',
                duration: '6 mois',
                startDate: '2025-01-15',
                minSalary: 2000,
                maxSalary: 3000,
                sector: 'IT',
                keySkills: ['JavaScript', 'TypeScript'],
                adress: 'Paris, France',
                type: PostType.Hybride,
                isVisible: true,
            };

            const dto = new CreatePostDto(data);

            expect(dto.title).toBe('Développeur Full Stack');
            expect(dto.description).toBe('Description complète');
            expect(dto.duration).toBe('6 mois');
            expect(dto.startDate).toBe('2025-01-15');
            expect(dto.minSalary).toBe(2000);
            expect(dto.maxSalary).toBe(3000);
            expect(dto.sector).toBe('IT');
            expect(dto.keySkills).toEqual(['JavaScript', 'TypeScript']);
            expect(dto.adress).toBe('Paris, France');
            expect(dto.type).toBe(PostType.Hybride);
            expect(dto.isVisible).toBe(true);
        });

        it('should set isVisible to true when title and description are provided', () => {
            const data = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
            };

            const dto = new CreatePostDto(data);

            expect(dto.isVisible).toBe(true);
        });

        it('should set isVisible to false when title is empty', () => {
            const data = {
                title: '',
                description: 'Description',
                keySkills: ['Skill1'],
            };

            const dto = new CreatePostDto(data);

            expect(dto.isVisible).toBe(false);
        });

        it('should set isVisible to false when description is empty', () => {
            const data = {
                title: 'Titre',
                description: '',
                keySkills: ['Skill1'],
            };

            const dto = new CreatePostDto(data);

            expect(dto.isVisible).toBe(false);
        });

        it('should set isVisible to false when both title and description are empty', () => {
            const data = {
                title: '',
                description: '',
                keySkills: ['Skill1'],
            };

            const dto = new CreatePostDto(data);

            expect(dto.isVisible).toBe(false);
        });

        it('should create instance without optional fields when constructor is called with minimal data', () => {
            const data = {
                title: 'Titre',
                description: 'Description',
                keySkills: ['Skill1'],
            };

            const dto = new CreatePostDto(data);

            expect(dto.title).toBe('Titre');
            expect(dto.description).toBe('Description');
            expect(dto.duration).toBeUndefined();
            expect(dto.startDate).toBeUndefined();
            expect(dto.minSalary).toBeUndefined();
            expect(dto.maxSalary).toBeUndefined();
            expect(dto.sector).toBeUndefined();
            expect(dto.adress).toBeUndefined();
            expect(dto.type).toBeUndefined();
        });
    });
});
