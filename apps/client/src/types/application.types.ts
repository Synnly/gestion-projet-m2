import type { Internship } from './internship.types';

export type ApplicationStatus = 'PENDING' | 'REJECTED' | 'ACCEPTED' | 'REVIEWING';

export interface ApplicationStudent {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

// An application as returned by the API (likely populated)
export interface Application {
    _id: string;
    post: Internship; // Populated post/internship
    student: ApplicationStudent; // Populated student
    status: ApplicationStatus;
    cv: string;
    coverLetter?: string;
}

export interface ApplicationFilters {
    page: number;
    limit: number;
    status?: ApplicationStatus;
}
