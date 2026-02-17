import { UseAuthFetch } from '../hooks/useAuthFetch';
import type { PaginationResult } from '../types/internship.types';
import type { studentProfile } from '../types/student.types';

export const fetchStudents = async (
    authFetch: ReturnType<typeof UseAuthFetch>,
    page: number = 1,
    limit: number = 10,
): Promise<PaginationResult<studentProfile>> => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/students/admin/all?page=${page}&limit=${limit}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch students');
    }

    return response.json();
};

export const deleteStudent = async (authFetch: ReturnType<typeof UseAuthFetch>, studentId: string) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/students/${studentId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete student');
    }

    return response.json();
};

export const deleteAllStudents = async (authFetch: ReturnType<typeof UseAuthFetch>) => {
    const API_URL = import.meta.env.VITE_APIURL;
    const response = await authFetch(`${API_URL}/api/students/admin/all`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete all students');
    }

    return response.json();
};
