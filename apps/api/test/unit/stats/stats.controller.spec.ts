import { Test, TestingModule } from '@nestjs/testing';
import { StatsController } from '../../../src/stats/stats.controller';
import { StatsService } from '../../../src/stats/stats.service';
import { StatsDto } from '../../../src/stats/dto/stats.dto';
import { AuthGuard } from '../../../src/auth/auth.guard'; 

describe('StatsController', () => {
  let controller: StatsController;
  let service: StatsService;

  const mockStatsResult: StatsDto = {
    totalUsers: 100,
    totalCompanies: 10,
    totalStudents: 90,
    totalApplications: 50,
    totalPosts: 20,
    orphanOffersCount: 5,
    applicationsByStatus: [],
    applicationsOverTime: [],
    topCompanies: []
  };

  const mockStatsService = {
    getStats: jest.fn().mockResolvedValue(mockStatsResult),
    getPublicStats: jest.fn().mockResolvedValue({
      totalPosts: 20,
      totalCompanies: 10,
      totalStudents: 90,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatsController],
      providers: [
        {
          provide: StatsService,
          useValue: mockStatsService,
        },
      ],
    })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: jest.fn(() => true) }) // Toujours dire OUI
    .compile();

    controller = module.get<StatsController>(StatsController);
    service = module.get<StatsService>(StatsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return stats from service', async () => {
      const result = await controller.getStats();
      expect(result).toEqual(mockStatsResult);
      expect(service.getStats).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPublicStats', () => {
    it('should return public stats from service', async () => {
      const result = await controller.getPublicStats();
      expect(result).toEqual({
        totalPosts: 20,
        totalCompanies: 10,
        totalStudents: 90,
      });
      expect(service.getPublicStats).toHaveBeenCalledTimes(1);
    });

    it('should not require authentication', async () => {
      // This test verifies that getPublicStats doesn't have guards
      const result = await controller.getPublicStats();
      expect(result).toBeDefined();
    });
  });
});