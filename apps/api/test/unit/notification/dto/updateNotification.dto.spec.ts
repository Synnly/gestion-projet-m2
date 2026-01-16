import { validate } from 'class-validator';
import { UpdateNotificationDto } from '../../../../src/notification/dto/updateNotification.dto';

describe('UpdateNotificationDto', () => {
    describe('validation', () => {
        it('should validate successfully when all fields are provided', async () => {
            const dto = new UpdateNotificationDto();
            dto.message = 'Updated message';
            dto.returnLink = '/updated/link';
            dto.read = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when only message is provided', async () => {
            const dto = new UpdateNotificationDto();
            dto.message = 'Updated message';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when only returnLink is provided', async () => {
            const dto = new UpdateNotificationDto();
            dto.returnLink = '/new/link';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when only read is provided', async () => {
            const dto = new UpdateNotificationDto();
            dto.read = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when no fields are provided (all optional)', async () => {
            const dto = new UpdateNotificationDto();

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when message is not a string', async () => {
            const dto = new UpdateNotificationDto();
            (dto as any).message = 123;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const messageError = errors.find((e) => e.property === 'message');
            expect(messageError).toBeDefined();
        });

        it('should fail validation when returnLink is not a string', async () => {
            const dto = new UpdateNotificationDto();
            (dto as any).returnLink = 456;

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const linkError = errors.find((e) => e.property === 'returnLink');
            expect(linkError).toBeDefined();
        });

        it('should fail validation when read is not a boolean', async () => {
            const dto = new UpdateNotificationDto();
            (dto as any).read = 'true';

            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            const readError = errors.find((e) => e.property === 'read');
            expect(readError).toBeDefined();
        });

        it('should validate successfully with read as false', async () => {
            const dto = new UpdateNotificationDto();
            dto.read = false;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully with empty string for returnLink', async () => {
            const dto = new UpdateNotificationDto();
            dto.returnLink = '';

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });

        it('should validate successfully when updating all fields', async () => {
            const dto = new UpdateNotificationDto();
            dto.message = 'Complete update';
            dto.returnLink = '/complete/update';
            dto.read = true;

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });
});
