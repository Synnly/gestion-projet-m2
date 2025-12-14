import type { Internship } from './internship.types';

export const ApplicationStatusEnum = {
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    ACCEPTED: 'Accepted',
    REVIEWING: 'Reviewing',
} as const;

export type ApplicationStatus = (typeof ApplicationStatusEnum)[keyof typeof ApplicationStatusEnum];

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
