import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UserController } from '../../../src/user/user.controller';
import { UserService } from '../../../src/user/user.service';
import { Role } from '../../../src/common/roles/roles.enum';
import { AuthGuard } from '../../../src/auth/auth.guard';
import { RolesGuard } from '../../../src/common/roles/roles.guard';
import { Reflector } from '@nestjs/core';

describe('User Security Integration', () => {
  let app: INestApplication;
  let userService: UserService;

  let mockUser = { role: Role.STUDENT }; 

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue({ _id: 'targetUserId' }),
    ban: jest.fn().mockResolvedValue(true),
  };

  const mockAuthGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        RolesGuard, 
        Reflector, 
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    userService = moduleFixture.get<UserService>(UserService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 403 when user is a STUDENT', async () => {
    mockUser = { role: Role.STUDENT } as any;

    await request(app.getHttpServer())
      .post('/api/users/507f1f77bcf86cd799439011/ban?reason=spam')
      .expect(403);
    
    expect(userService.ban).not.toHaveBeenCalled();
  });

  it('should return 204 when user is an ADMIN', async () => {
    mockUser = { role: Role.ADMIN } as any;

    await request(app.getHttpServer())
      .post('/api/users/507f1f77bcf86cd799439011/ban?reason=spam')
      .expect(204);
    
    expect(userService.ban).toHaveBeenCalledWith(expect.anything(), 'spam');
  });
});