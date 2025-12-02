import { validate } from 'class-validator';
import { CreateStudentDto } from '../../../../src/student/dto/createStudent.dto';
import { Role } from '../../../../src/common/roles/roles.enum';

describe('CreateStudentDto', () => {
    describe('validation', () => {
        it('should validate successfully with all required fields', async () => {
            const dto = new CreateStudentDto();
            dto.email = 'student@example.com';
            dto.password = 'StrongP@ss1';
            dto.role = Role.STUDENT as any;
            dto.firstName = 'John';
            dto.lastName = 'Doe';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when firstName missing', async () => {
            const dto = new CreateStudentDto();
            dto.email = 'student@example.com';
            dto.password = 'StrongP@ss1';
            dto.role = Role.STUDENT as any;
            dto.lastName = 'Doe';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const firstNameError = errors.find((e) => e.property === 'firstName');
            expect(firstNameError).toBeDefined();
        });

        it('should fail when password is weak', async () => {
            const dto = new CreateStudentDto();
            dto.email = 'student@example.com';
            dto.password = 'weak';
            dto.role = Role.STUDENT as any;
            dto.firstName = 'John';
            dto.lastName = 'Doe';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passError = errors.find((e) => e.property === 'password');
            expect(passError).toBeDefined();
        });
    });
});
