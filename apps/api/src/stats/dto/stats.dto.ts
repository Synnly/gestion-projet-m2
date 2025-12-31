import { Expose, Type } from 'class-transformer';

export class ChartDataDto {
    @Expose()
    name: string;

    @Expose()
    value?: number; // Pour le Pie Chart

    @Expose()
    count?: number; // Pour le Bar Chart
}

export class TopCompanyDto {
    @Expose()
    name: string;

    @Expose()
    offersCount: number;

    @Expose()
    responseRate: number;
}

export class StatsDto {
    // --- TES ANCIENNES STATS ---
    @Expose()
    totalUsers: number;

    @Expose()
    totalCompanies: number;

    @Expose()
    totalStudents: number;

    @Expose()
    totalApplications: number;

    @Expose()
    totalPosts: number;

    // --- LES NOUVELLES STATS POUR LES GRAPHIQUES ---
    
    @Expose()
    @Type(() => ChartDataDto)
    applicationsByStatus: ChartDataDto[];

    @Expose()
    @Type(() => ChartDataDto)
    applicationsOverTime: ChartDataDto[];

    @Expose()
    @Type(() => TopCompanyDto)
    topCompanies: TopCompanyDto[];

    @Expose()
    orphanOffersCount: number;
}