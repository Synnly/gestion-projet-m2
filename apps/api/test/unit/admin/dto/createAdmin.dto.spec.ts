import { validate } from 'class-validator';
import { CreateAdminDto } from '../../../../src/admin/dto/createAdminDto';

describe('CreateAdminDto', () => {
    it('should validate a valid dto', async () => {
        const dto = new CreateAdminDto({
            email: 'admin@test.com',
            password: 'Password123!Password123!Password123!',
        });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
    });

    it('should fail when email is invalid', async () => {
        const dto = new CreateAdminDto({
            email: 'invalid-email',
            password: 'Password123!Password123!Password123!',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('email');
    });

    it('should fail when password is too short', async () => {
        const dto = new CreateAdminDto({
            email: 'admin@test.com',
            password: 'short',
        });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('password');
    });

    it('should fail when fields are empty', async () => {
        const dto = new CreateAdminDto({});
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
