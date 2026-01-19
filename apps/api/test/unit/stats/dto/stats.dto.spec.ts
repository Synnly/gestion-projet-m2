import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { StatsDto, ChartDataDto, TopCompanyDto } from '../../../../src/stats/dto/stats.dto';

describe('StatsDto', () => {
  it('should transform plain JSON to StatsDto instance with nested objects', () => {
    const plainJson = {
      totalUsers: 10,
      totalCompanies: 5,
      totalStudents: 5,
      totalApplications: 20,
      totalPosts: 8,
      orphanOffersCount: 2,
      applicationsByStatus: [
        { name: 'Pending', value: 10 },
        { name: 'Accepted', value: 5 },
      ],
      applicationsOverTime: [],
      topCompanies: [
        { name: 'TechCorp', offersCount: 5, responseRate: 80 }
      ]
    };

    const dto = plainToInstance(StatsDto, plainJson);

    expect(dto).toBeInstanceOf(StatsDto);
    expect(dto.totalUsers).toBe(10);
    
    expect(dto.applicationsByStatus[0]).toBeInstanceOf(ChartDataDto);
    expect(dto.applicationsByStatus[0].name).toBe('Pending');

    expect(dto.topCompanies[0]).toBeInstanceOf(TopCompanyDto);
    expect(dto.topCompanies[0].responseRate).toBe(80);
  });
});