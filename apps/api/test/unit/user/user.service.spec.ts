import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../../src/user/user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../../src/user/user.schema';
import { RefreshToken } from '../../../src/auth/refreshToken.schema';
import { MailerService } from '../../../src/mailer/mailer.service';
import { NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<User>;
  let refreshTokenModel: Model<RefreshToken>;
  let mailerService: MailerService;

  const mockUserModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockRefreshTokenModel = {
    deleteMany: jest.fn(),
  };

  const mockMailerService = {
    sendAccountBanEmail: jest.fn(),
  };

  const mockUser = {
    _id: 'user123',
    email: 'test@test.com',
    firstname: 'John',
    lastname: 'Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    refreshTokenModel = module.get<Model<RefreshToken>>(getModelToken(RefreshToken.name));
    mailerService = module.get<MailerService>(MailerService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne('user123');

      expect(result).toEqual(mockUser);
      expect(userModel.findOne).toHaveBeenCalledWith({
        _id: 'user123',
        deletedAt: { $exists: false },
        ban: { $exists: false },
      });
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne('unknown_id');

      expect(result).toBeNull();
    });
  });

  describe('ban', () => {
    it('should ban a user, delete refresh tokens and send an email', async () => {
      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      
      mockRefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      mockMailerService.sendAccountBanEmail.mockResolvedValue(null);

      await service.ban('user123', 'Comportement inapproprié');

      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'user123', ban: { $exists: false }, deletedAt: { $exists: false } },
        { $set: { ban: { date: expect.any(Date), reason: 'Comportement inapproprié' } } },
      );

      expect(refreshTokenModel.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });

      expect(mailerService.sendAccountBanEmail).toHaveBeenCalledWith(
        mockUser.email,
        'Comportement inapproprié',
      );
    });

    it('should throw NotFoundException if user is not found or already banned', async () => {
      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.ban('user123', 'reason'))
        .rejects
        .toThrow(NotFoundException);

      expect(refreshTokenModel.deleteMany).not.toHaveBeenCalled();
      expect(mailerService.sendAccountBanEmail).not.toHaveBeenCalled();
    });

    it('should not crash if sending email fails', async () => {
      mockUserModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      mockRefreshTokenModel.deleteMany.mockResolvedValue({ deletedCount: 1 });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMailerService.sendAccountBanEmail.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.ban('user123', 'reason')).resolves.not.toThrow();
      
      expect(refreshTokenModel.deleteMany).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mailerService.sendAccountBanEmail).toHaveBeenCalled();
    });
  });
});