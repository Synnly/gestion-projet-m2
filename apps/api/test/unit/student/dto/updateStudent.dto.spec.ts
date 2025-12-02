import { validate } from 'class-validator';
import { UpdateStudentDto } from '../../../../src/student/dto/updateStudent.dto';

describe('UpdateStudentDto', () => {
    describe('validation', () => {
        it('should validate successfully when optional fields are valid', async () => {
            const dto = new UpdateStudentDto();
            dto.firstName = 'Alice';
            dto.lastName = 'Wonder';
            dto.password = 'StrongP@ss1';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail when password does not meet strength requirements', async () => {
            const dto = new UpdateStudentDto();
            dto.password = '123';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const passError = errors.find((e) => e.property === 'password');
            expect(passError).toBeDefined();
        });
    });
});
