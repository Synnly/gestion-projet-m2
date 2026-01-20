import { Expose, Type } from 'class-transformer';

export class ChartDataDto {
    // Label for the chart segment (e.g., "January" or "Pending")
    @Expose()
    name: string;

    // Value used for Pie Charts
    @Expose()
    value?: number;

    // Count used for Bar Charts
    @Expose()
    count?: number;
}

export class TopCompanyDto {
    // Name of the company
    @Expose()
    name: string;

    // Total number of offers posted
    @Expose()
    offersCount: number;

    // Response rate percentage (0-100)
    @Expose()
    responseRate: number;
}

export class StatsDto {
    // --- Global Counters ---

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

    // --- Charts & Data ---

    // Data for the Pie Chart (Status distribution)
    @Expose()
    @Type(() => ChartDataDto)
    applicationsByStatus: ChartDataDto[];

    // Data for the Bar Chart (Timeline)
    @Expose()
    @Type(() => ChartDataDto)
    applicationsOverTime: ChartDataDto[];

    // Data for the Top Recruiters table
    @Expose()
    @Type(() => TopCompanyDto)
    topCompanies: TopCompanyDto[];

    // Count of offers with no candidates
    @Expose()
    orphanOffersCount: number;
}