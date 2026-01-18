import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationService } from '../../../src/notification/notification.service';
import { Notification } from '../../../src/notification/notification.schema';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
    let service: NotificationService;

    const mockNotification = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        message: 'Test notification',
        returnLink: '/test',
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockModel = {
        find: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        updateMany: jest.fn(),
        findByIdAndDelete: jest.fn(),
        deleteMany: jest.fn(),
        countDocuments: jest.fn(),
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationService,
                { provide: getModelToken(Notification.name), useValue: mockModel },
            ],
        }).compile();

        service = module.get<NotificationService>(NotificationService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all notifications sorted by createdAt desc', async () => {
            const expected = [mockNotification];
            const sortMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(expected) });
            mockModel.find.mockReturnValue({ sort: sortMock });

            const result = await service.findAll();

            expect(mockModel.find).toHaveBeenCalledWith();
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(expected);
        });
    });

    describe('findByUserId', () => {
        it('should return notifications for a specific user sorted by createdAt desc', async () => {
            const userId = '507f1f77bcf86cd799439012';
            const expected = [mockNotification];
            const sortMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(expected) });
            mockModel.find.mockReturnValue({ sort: sortMock });

            const result = await service.findByUserId(userId);

            expect(mockModel.find).toHaveBeenCalledWith({ userId: new Types.ObjectId(userId) });
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(expected);
        });
    });

    describe('findUnreadByUserId', () => {
        it('should return only unread notifications for a specific user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            const expected = [mockNotification];
            const sortMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(expected) });
            mockModel.find.mockReturnValue({ sort: sortMock });

            const result = await service.findUnreadByUserId(userId);

            expect(mockModel.find).toHaveBeenCalledWith({
                userId: new Types.ObjectId(userId),
                read: false,
            });
            expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(expected);
        });
    });

    describe('findOne', () => {
        it('should return a notification by id', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockNotification) });

            const result = await service.findOne(id);

            expect(mockModel.findById).toHaveBeenCalledWith(id);
            expect(result).toEqual(mockNotification);
        });

        it('should return null when notification not found', async () => {
            const id = '507f1f77bcf86cd799439011';
            mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

            const result = await service.findOne(id);

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new notification', async () => {
            const dto = {
                userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
                message: 'Test notification',
                returnLink: '/test',
            };
            mockModel.create.mockResolvedValue(mockNotification);

            const result = await service.create(dto);

            expect(mockModel.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(mockNotification);
        });
    });

    describe('update', () => {
        it('should update an existing notification', async () => {
            const id = '507f1f77bcf86cd799439011';
            const dto = { message: 'Updated message' };
            const updatedNotification = { ...mockNotification, message: 'Updated message' };

            mockModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(updatedNotification),
            });

            const result = await service.update(id, dto);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
                id,
                { $set: dto },
                { new: true }
            );
            expect(result).toEqual(updatedNotification);
        });

        it('should throw NotFoundException when notification not found', async () => {
            const id = '507f1f77bcf86cd799439011';
            const dto = { message: 'Updated message' };

            mockModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
            await expect(service.update(id, dto)).rejects.toThrow(`Notification with id ${id} not found`);
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const id = '507f1f77bcf86cd799439011';
            const readNotification = { ...mockNotification, read: true };

            mockModel.findByIdAndUpdate.mockReturnValue({
                exec: jest.fn().mockResolvedValue(readNotification),
            });

            const result = await service.markAsRead(id);

            expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
                id,
                { $set: { read: true } },
                { new: true }
            );
            expect(result).toEqual(readNotification);
        });
    });

    describe('markAllAsReadForUser', () => {
        it('should mark all unread notifications as read for a user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            const modifiedCount = 5;

            mockModel.updateMany.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount }),
            });

            const result = await service.markAllAsReadForUser(userId);

            expect(mockModel.updateMany).toHaveBeenCalledWith(
                { userId: new Types.ObjectId(userId), read: false },
                { $set: { read: true } }
            );
            expect(result).toBe(modifiedCount);
        });

        it('should return 0 when no notifications to update', async () => {
            const userId = '507f1f77bcf86cd799439012';

            mockModel.updateMany.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
            });

            const result = await service.markAllAsReadForUser(userId);

            expect(result).toBe(0);
        });
    });

    describe('delete', () => {
        it('should delete a notification by id', async () => {
            const id = '507f1f77bcf86cd799439011';

            mockModel.findByIdAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockNotification),
            });

            await service.delete(id);

            expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(id);
        });

        it('should throw NotFoundException when notification not found', async () => {
            const id = '507f1f77bcf86cd799439011';

            mockModel.findByIdAndDelete.mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
            });

            await expect(service.delete(id)).rejects.toThrow(NotFoundException);
            await expect(service.delete(id)).rejects.toThrow(`Notification with id ${id} not found`);
        });
    });

    describe('deleteAllForUser', () => {
        it('should delete all notifications for a user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            const deletedCount = 10;

            mockModel.deleteMany.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount }),
            });

            const result = await service.deleteAllForUser(userId);

            expect(mockModel.deleteMany).toHaveBeenCalledWith({
                userId: new Types.ObjectId(userId),
            });
            expect(result).toBe(deletedCount);
        });

        it('should return 0 when no notifications to delete', async () => {
            const userId = '507f1f77bcf86cd799439012';

            mockModel.deleteMany.mockReturnValue({
                exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
            });

            const result = await service.deleteAllForUser(userId);

            expect(result).toBe(0);
        });
    });

    describe('countUnreadForUser', () => {
        it('should return count of unread notifications for a user', async () => {
            const userId = '507f1f77bcf86cd799439012';
            const count = 3;

            mockModel.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(count),
            });

            const result = await service.countUnreadForUser(userId);

            expect(mockModel.countDocuments).toHaveBeenCalledWith({
                userId: new Types.ObjectId(userId),
                read: false,
            });
            expect(result).toBe(count);
        });

        it('should return 0 when user has no unread notifications', async () => {
            const userId = '507f1f77bcf86cd799439012';

            mockModel.countDocuments.mockReturnValue({
                exec: jest.fn().mockResolvedValue(0),
            });

            const result = await service.countUnreadForUser(userId);

            expect(result).toBe(0);
        });
    });
});
