import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../../../src/notification/notification.controller';
import { NotificationService } from '../../../src/notification/notification.service';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Types } from 'mongoose';
import { Role } from '../../../src/common/roles/roles.enum';

describe('NotificationController', () => {
    let controller: NotificationController;

    const mockNotification = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        message: 'Test notification',
        returnLink: '/test',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockService = {
        findAll: jest.fn(),
        findByUserId: jest.fn(),
        findUnreadByUserId: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsReadForUser: jest.fn(),
        delete: jest.fn(),
        deleteAllForUser: jest.fn(),
        countUnreadForUser: jest.fn(),
    } as any;

    beforeEach(async () => {
        const mockAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
        const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationController],
            providers: [{ provide: NotificationService, useValue: mockService }],
        })
            .overrideGuard(AuthGuard)
            .useValue(mockAuthGuard)
            .overrideGuard(RolesGuard)
            .useValue(mockRolesGuard)
            .compile();

        controller = module.get<NotificationController>(NotificationController);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of notifications', async () => {
            mockService.findAll.mockResolvedValue([mockNotification]);

            const result = await controller.findAll();

            expect(mockService.findAll).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('message', 'Test notification');
        });
    });

    describe('findByUserId', () => {
        it('should return notifications for a specific user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.findByUserId.mockResolvedValue([mockNotification]);

            const result = await controller.findByUserId(userId);

            expect(mockService.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('message', 'Test notification');
        });

        it('should be accessible by ADMIN, STUDENT, and COMPANY roles', () => {
            const roles = Reflect.getMetadata('roles', controller.findByUserId);
            expect(roles).toBeDefined();
            expect(roles).toContain(Role.ADMIN);
            expect(roles).toContain(Role.STUDENT);
            expect(roles).toContain(Role.COMPANY);
        });
    });

    describe('findUnreadByUserId', () => {
        it('should return unread notifications for a specific user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.findUnreadByUserId.mockResolvedValue([mockNotification]);

            const result = await controller.findUnreadByUserId(userId);

            expect(mockService.findUnreadByUserId).toHaveBeenCalledWith(userId);
            expect(result).toHaveLength(1);
        });
    });

    describe('countUnreadForUser', () => {
        it('should return count of unread notifications', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.countUnreadForUser.mockResolvedValue(5);

            const result = await controller.countUnreadForUser(userId);

            expect(mockService.countUnreadForUser).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ count: 5 });
        });

        it('should return 0 when no unread notifications', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.countUnreadForUser.mockResolvedValue(0);

            const result = await controller.countUnreadForUser(userId);

            expect(result).toEqual({ count: 0 });
        });
    });

    describe('findOne', () => {
        it('should return a notification when found', async () => {
            const notificationId = '507f1f77bcf86cd799439011';
            mockService.findOne.mockResolvedValue(mockNotification);

            const result = await controller.findOne(notificationId);

            expect(mockService.findOne).toHaveBeenCalledWith(notificationId);
            expect(result).toHaveProperty('message', 'Test notification');
        });

        it('should throw NotFoundException when notification not found', async () => {
            const notificationId = '507f1f77bcf86cd799439011';
            mockService.findOne.mockResolvedValue(null);

            await expect(controller.findOne(notificationId)).rejects.toThrow(NotFoundException);
            await expect(controller.findOne(notificationId)).rejects.toThrow(
                `Notification with id ${notificationId} not found`
            );
        });
    });

    describe('create', () => {
        it('should create a new notification', async () => {
            const dto = {
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'New notification',
                returnLink: '/test',
            };
            mockService.create.mockResolvedValue(mockNotification);

            const result = await controller.create(dto);

            expect(mockService.create).toHaveBeenCalledWith(dto);
            expect(result).toHaveProperty('message', 'Test notification');
        });
    });

    describe('update', () => {
        it('should update an existing notification', async () => {
            const notificationId = '507f1f77bcf86cd799439011';
            const dto = { message: 'Updated message' };
            const updatedNotification = { ...mockNotification, message: 'Updated message' };
            mockService.update.mockResolvedValue(updatedNotification);

            const result = await controller.update(notificationId, dto);

            expect(mockService.update).toHaveBeenCalledWith(notificationId, dto);
            expect(result).toHaveProperty('message', 'Updated message');
        });

        it('should be accessible by ADMIN, STUDENT, and COMPANY roles', () => {
            const roles = Reflect.getMetadata('roles', controller.update);
            expect(roles).toBeDefined();
            expect(roles).toContain(Role.ADMIN);
            expect(roles).toContain(Role.STUDENT);
            expect(roles).toContain(Role.COMPANY);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const notificationId = '507f1f77bcf86cd799439011';
            const readNotification = { ...mockNotification, read: true };
            mockService.markAsRead.mockResolvedValue(readNotification);

            const result = await controller.markAsRead(notificationId);

            expect(mockService.markAsRead).toHaveBeenCalledWith(notificationId);
            expect(result).toHaveProperty('read', true);
        });
    });

    describe('markAllAsReadForUser', () => {
        it('should mark all notifications as read for a user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.markAllAsReadForUser.mockResolvedValue(5);

            const result = await controller.markAllAsReadForUser(userId);

            expect(mockService.markAllAsReadForUser).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ modified: 5 });
        });

        it('should return 0 when no notifications were modified', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.markAllAsReadForUser.mockResolvedValue(0);

            const result = await controller.markAllAsReadForUser(userId);

            expect(result).toEqual({ modified: 0 });
        });
    });

    describe('delete', () => {
        it('should delete a notification', async () => {
            const notificationId = '507f1f77bcf86cd799439011';
            mockService.delete.mockResolvedValue(undefined);

            await controller.delete(notificationId);

            expect(mockService.delete).toHaveBeenCalledWith(notificationId);
        });

        it('should be accessible by ADMIN, STUDENT, and COMPANY roles', () => {
            const roles = Reflect.getMetadata('roles', controller.delete);
            expect(roles).toBeDefined();
            expect(roles).toContain(Role.ADMIN);
            expect(roles).toContain(Role.STUDENT);
            expect(roles).toContain(Role.COMPANY);
        });
    });

    describe('deleteAllForUser', () => {
        it('should delete all notifications for a user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.deleteAllForUser.mockResolvedValue(10);

            const result = await controller.deleteAllForUser(userId);

            expect(mockService.deleteAllForUser).toHaveBeenCalledWith(userId);
            expect(result).toEqual({ deleted: 10 });
        });

        it('should return 0 when no notifications were deleted', async () => {
            const userId = '507f1f77bcf86cd799439012';
            mockService.deleteAllForUser.mockResolvedValue(0);

            const result = await controller.deleteAllForUser(userId);

            expect(result).toEqual({ deleted: 0 });
        });
    });
});
