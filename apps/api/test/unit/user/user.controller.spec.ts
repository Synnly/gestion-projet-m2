import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    findOne: jest.fn(),
    ban: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ban', () => {
    const userId = 'user123';
    const reason = 'Spamming';

    it('should ban a user successfully', async () => {
      mockUserService.ban.mockResolvedValue(undefined);

      await controller.ban(userId, reason);

      expect(userService.ban).toHaveBeenCalledWith(userId, reason);
    });
  });
});