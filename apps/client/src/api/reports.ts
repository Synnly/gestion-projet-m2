import { UseAuthFetch } from '../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export const ReportReason = {
    SPAM: 'spam',
    HARASSMENT: 'harassment',
    HATE_SPEECH: 'hate_speech',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    MISINFORMATION: 'misinformation',
    OFF_TOPIC: 'off_topic',
    OTHER: 'other',
} as const;

export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export type Report = {
    _id: string;
    messageId: {
        _id: string;
        content: string;
        authorId: {
            _id: string;
            email: string;
            firstName?: string;
            lastName?: string;
            ban?: {
                date: string;
                reason: string;
            };
        };
        topicId: {
            _id: string;
            forumId: string;
            title?: string;
        };
    };
    reporterId?: {
        _id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
    reason: ReportReason;
    explanation?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
    createdAt: string;
    updatedAt: string;
};

export type PaginatedReports = {
    data: Report[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

export async function getAllReports(
    page: number = 1,
    limit: number = 10,
    status?: string,
): Promise<PaginatedReports> {
    const authFetch = UseAuthFetch();
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (status) {
        params.append('status', status);
    }

    const response = await authFetch(`${API_URL}/api/reports?${params.toString()}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des signalements');
    }

    return await response.json();
}

export async function updateReportStatus(reportId: string, status: string): Promise<Report> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({ status }),
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du signalement');
    }

    return await response.json();
}

export async function deleteReport(reportId: string): Promise<void> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression du signalement');
    }
}

export async function createReport(data: {
    messageId: string;
    reason: ReportReason;
    explanation?: string;
}): Promise<Report> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la création du signalement');
    }

    return await response.json();
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    [ReportReason.SPAM]: 'Spam',
    [ReportReason.HARASSMENT]: 'Harcèlement',
    [ReportReason.HATE_SPEECH]: 'Discours haineux',
    [ReportReason.INAPPROPRIATE_CONTENT]: 'Contenu inapproprié',
    [ReportReason.MISINFORMATION]: 'Désinformation',
    [ReportReason.OFF_TOPIC]: 'Hors sujet',
    [ReportReason.OTHER]: 'Autre',
};

export async function getMyReports(): Promise<Report[]> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/reports/my-reports`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération de vos signalements');
    }

    return await response.json();
}
