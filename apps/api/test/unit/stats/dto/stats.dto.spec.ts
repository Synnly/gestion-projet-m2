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
            topCompanies: [{ name: 'TechCorp', offersCount: 5, responseRate: 80 }],
            applicationAcceptanceByCompany: {
                'company123': { count: 2, rate: 50 }
            },
            applicationAcceptanceByStudent: {
                'student456': { count: 1, rate: 100 }
            }
        };

        const dto = plainToInstance(StatsDto, plainJson);

        expect(dto).toBeInstanceOf(StatsDto);
        expect(dto.totalUsers).toBe(10);

        expect(dto.applicationsByStatus[0]).toBeInstanceOf(ChartDataDto);
        expect(dto.applicationsByStatus[0].name).toBe('Pending');

        expect(dto.topCompanies[0]).toBeInstanceOf(TopCompanyDto);
        expect(dto.topCompanies[0].responseRate).toBe(80);

        expect(dto.applicationAcceptanceByCompany['company123']).toEqual({ count: 2, rate: 50 });
        expect(dto.applicationAcceptanceByStudent['student456']).toEqual({ count: 1, rate: 100 });
    });
});
