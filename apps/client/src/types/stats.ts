export interface PublicStats {
    id: string;
    totalPosts: number;
    totalCompanies: number;
    totalStudents: number;
}

export interface ChartData {
    name: string;
    value?: number;
    count?: number;
}

export interface TopCompany {
    name: string;
    offersCount: number;
    responseRate: number;
}

export interface Stats {
    totalUsers: number;
    totalCompanies: number;
    totalStudents: number;
    totalApplications: number;
    totalPosts: number;

    applicationsByStatus: ChartData[];
    applicationsOverTime: ChartData[];
    topCompanies: TopCompany[];
    orphanOffersCount: number;
    applicationAcceptanceByCompany: Record<string, { total: number; count: number; rate: number }>;
    applicationAcceptanceByStudent: Record<string, { count: number; rate: number }>;
}
