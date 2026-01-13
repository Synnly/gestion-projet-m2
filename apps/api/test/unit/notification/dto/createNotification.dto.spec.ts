import { validate } from 'class-validator';
import { CreateNotificationDto } from '../../../../src/notification/dto/createNotification.dto';
import { Types } from 'mongoose';

describe('CreateNotificationDto', () => {
    describe('validation', () => {
        it('should validate successfully when all required fields are provided', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            dto.message = 'Test notification message';
            dto.returnLink = '/test/link';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when returnLink is not provided (optional)', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            dto.message = 'Test notification message';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when userId is missing', async () => {
            const dto = new CreateNotificationDto();
            dto.message = 'Test notification message';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].property).toBe('userId');
        });

        it('should fail validation when message is missing', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messageError = errors.find((e) => e.property === 'message');
            expect(messageError).toBeDefined();
        });

        it('should fail validation when message is not a string', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            (dto as any).message = 123;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messageError = errors.find((e) => e.property === 'message');
            expect(messageError).toBeDefined();
        });

        it('should fail validation when message is an empty string', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            dto.message = '';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messageError = errors.find((e) => e.property === 'message');
            expect(messageError).toBeDefined();
        });

        it('should fail validation when returnLink is not a string', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            dto.message = 'Test notification';
            (dto as any).returnLink = 123;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const linkError = errors.find((e) => e.property === 'returnLink');
            expect(linkError).toBeDefined();
        });

        it('should validate successfully with valid returnLink string', async () => {
            const dto = new CreateNotificationDto();
            dto.userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            dto.message = 'Test notification';
            dto.returnLink = '/dashboard';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
