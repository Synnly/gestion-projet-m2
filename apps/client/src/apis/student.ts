import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { PaginationResult } from '../types/internship.types';
import type { studentProfile } from '../types/student.types';

export const fetchStudents = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    page: number = 1,
    limit: number = 10,
): Promise<PaginationResult<studentProfile>> => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/students?page=${page}&limit=${limit}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch students');
    }

    return response.json();
};
