import { validate } from 'class-validator';
import { CreateStudentDto } from '../../../../src/student/dto/createStudent.dto';

describe('CreateStudentDto', () => {
    describe('validation', () => {
        it('should validate successfully with all required fields', async () => {
            const dto = new CreateStudentDto();
            dto.email = 'student@example.com';
            dto.studentNumber = 'S12345678';
            dto.firstName = 'John';
            dto.lastName = 'Doe';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when firstName missing', async () => {
            const dto = new CreateStudentDto();
            dto.email = 'student@example.com';
            dto.studentNumber = 'S12345679';
            dto.lastName = 'Doe';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const firstNameError = errors.find((e) => e.property === 'firstName');
            expect(firstNameError).toBeDefined();
        });
    });
});
