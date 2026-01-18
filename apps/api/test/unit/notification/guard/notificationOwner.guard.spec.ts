import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationOwnerGuard } from '../../../../src/notification/guard/notificationOwner.guard';
import { NotificationService } from '../../../../src/notification/notification.service';
import { Role } from '../../../../src/common/roles/roles.enum';
import { Types } from 'mongoose';

describe('NotificationOwnerGuard', () => {
    let guard: NotificationOwnerGuard;
    let mockNotificationService: Partial<NotificationService>;

    const userId = new Types.ObjectId('507f1f77bcf86cd799439011');
    const notificationId = new Types.ObjectId('507f1f77bcf86cd799439012');

    beforeEach(async () => {
        mockNotificationService = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationOwnerGuard,
                {
                    provide: NotificationService,
                    useValue: mockNotificationService,
                },
            ],
        }).compile();

        guard = module.get<NotificationOwnerGuard>(NotificationOwnerGuard);
    });

    const createMockContext = (user: any, params: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({ user, params }),
            }),
        } as ExecutionContext;
    };

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('ADMIN role', () => {
        it('should allow ADMIN to access any notification', async () => {
            const context = createMockContext({ role: Role.ADMIN, sub: userId.toString() }, { notificationId });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockNotificationService.findOne).not.toHaveBeenCalled();
        });
    });

    describe('STUDENT/COMPANY role', () => {
        it('should allow access when user owns the notification', async () => {
            const context = createMockContext(
                { role: Role.STUDENT, sub: userId.toString() },
                { notificationId: notificationId.toString() },
            );

            (mockNotificationService.findOne as jest.Mock).mockResolvedValue({
                _id: notificationId,
                userId: userId,
                message: 'Test notification',
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
            expect(mockNotificationService.findOne).toHaveBeenCalledWith(notificationId.toString());
        });

        it('should deny access when user does not own the notification', async () => {
            const otherUserId = new Types.ObjectId('507f1f77bcf86cd799439013');
            const context = createMockContext(
                { role: Role.STUDENT, sub: userId.toString() },
                { notificationId: notificationId.toString() },
            );

            (mockNotificationService.findOne as jest.Mock).mockResolvedValue({
                _id: notificationId,
                userId: otherUserId,
                message: 'Test notification',
            });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('You can only access your own notifications');
        });

        it('should throw NotFoundException when notification does not exist', async () => {
            const context = createMockContext(
                { role: Role.STUDENT, sub: userId.toString() },
                { notificationId: notificationId.toString() },
            );

            (mockNotificationService.findOne as jest.Mock).mockResolvedValue(null);

            await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
            await expect(guard.canActivate(context)).rejects.toThrow(
                `Notification with id ${notificationId} not found`,
            );
        });

        it('should work with COMPANY role', async () => {
            const context = createMockContext(
                { role: Role.COMPANY, sub: userId.toString() },
                { notificationId: notificationId.toString() },
            );

            (mockNotificationService.findOne as jest.Mock).mockResolvedValue({
                _id: notificationId,
                userId: userId,
                message: 'Test notification',
            });

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
        });
    });

    describe('Edge cases', () => {
        it('should throw ForbiddenException when user is not authenticated', async () => {
            const context = createMockContext(null, { notificationId });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
        });

        it('should throw ForbiddenException when notificationId is missing', async () => {
            const context = createMockContext({ role: Role.STUDENT, sub: userId.toString() }, {});

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('Notification ID is required');
        });

        it('should throw ForbiddenException when user sub is missing', async () => {
            const context = createMockContext({ role: Role.STUDENT }, { notificationId: notificationId.toString() });

            (mockNotificationService.findOne as jest.Mock).mockResolvedValue({
                _id: notificationId,
                userId: userId,
                message: 'Test notification',
            });

            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            await expect(guard.canActivate(context)).rejects.toThrow('User ID cannot be determined');
        });
    });
});
