import { plainToInstance } from 'class-transformer';
import { NotificationDto } from '../../../../src/notification/dto/notification.dto';
import { Types } from 'mongoose';

describe('NotificationDto', () => {
    describe('class-transformer', () => {
        it('should expose only allowed properties', () => {
            const data = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Test notification',
                returnLink: '/test',
                read: false,
                createdAt: new Date('2025-01-01'),
                updatedAt: new Date('2025-01-02'),
                __v: 0, // should be excluded
                extraField: 'should be excluded', // should be excluded
            };

            const dto = plainToInstance(NotificationDto, data, { excludeExtraneousValues: true });

            expect(dto._id).toBeDefined();
            expect(dto.userId).toBeDefined();
            expect(dto.message).toBe('Test notification');
            expect(dto.returnLink).toBe('/test');
            expect(dto.read).toBe(false);
            expect(dto.createdAt).toEqual(new Date('2025-01-01'));
            expect(dto.updatedAt).toEqual(new Date('2025-01-02'));
            expect((dto as any).__v).toBeUndefined();
            expect((dto as any).extraField).toBeUndefined();
        });

        it('should handle constructor with partial data', () => {
            const partial = {
                message: 'Partial notification',
                read: true,
            };

            const dto = new NotificationDto(partial);

            expect(dto.message).toBe('Partial notification');
            expect(dto.read).toBe(true);
        });

        it('should transform _id using Transform decorator', () => {
            const objectId = new Types.ObjectId('507f1f77bcf86cd799439011');
            const data = {
                _id: objectId,
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Test',
                returnLink: '/test',
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const dto = plainToInstance(NotificationDto, data, { excludeExtraneousValues: true });

            expect(dto._id).toEqual(objectId);
        });

        it('should expose all timestamp fields', () => {
            const createdDate = new Date('2025-01-01T10:00:00Z');
            const updatedDate = new Date('2025-01-02T12:00:00Z');

            const data = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Test',
                returnLink: '/test',
                read: false,
                createdAt: createdDate,
                updatedAt: updatedDate,
            };

            const dto = plainToInstance(NotificationDto, data, { excludeExtraneousValues: true });

            expect(dto.createdAt).toEqual(createdDate);
            expect(dto.updatedAt).toEqual(updatedDate);
        });

        it('should correctly expose userId field', () => {
            const userId = new Types.ObjectId('507f1f77bcf86cd799439012');
            const data = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                userId: userId,
                message: 'User notification',
                returnLink: '/user',
                read: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const dto = plainToInstance(NotificationDto, data, { excludeExtraneousValues: true });

            expect(dto.userId).toBeDefined();
        });

        it('should handle empty returnLink', () => {
            const data = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Notification without link',
                returnLink: '',
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const dto = plainToInstance(NotificationDto, data, { excludeExtraneousValues: true });

            expect(dto.returnLink).toBe('');
        });

        it('should correctly map read boolean values', () => {
            const unreadData = {
                _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Unread notification',
                returnLink: '/unread',
                read: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const readData = { ...unreadData, read: true };

            const unreadDto = plainToInstance(NotificationDto, unreadData, { excludeExtraneousValues: true });
            const readDto = plainToInstance(NotificationDto, readData, { excludeExtraneousValues: true });

            expect(unreadDto.read).toBe(false);
            expect(readDto.read).toBe(true);
        });
    });
});
