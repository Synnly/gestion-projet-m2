/**
 * Types pour les stages (Internships/Posts)
 */

export const PostType = {
    Presentiel: 'Présentiel',
    Teletravail: 'Télétravail',
    Hybride: 'Hybride',
} as const;

export type PostType = (typeof PostType)[keyof typeof PostType];

export interface CompanyInInternship {
    _id: string;
    name: string;
    email: string;
    logo?: string;
    city?: string;
    country?: string;
    logoUrl?: string;
}

export interface Internship {
    _id: string;
    title: string;
    description: string;
    duration?: string;
    startDate?: string;
    minSalary?: number;
    maxSalary?: number;
    sector?: string;
    keySkills?: string[];
    address?: string;
    type: PostType;
    isVisible?: boolean;
    company: CompanyInInternship;
    createdAt: string;
}

export interface PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface InternshipFilters {
    page: number;
    limit: number;
    sector?: string;
    type?: PostType;
    minSalary?: number;
    maxSalary?: number;
    searchQuery?: string;
}
