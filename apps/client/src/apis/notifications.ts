import { UseAuthFetch } from '../hooks/useAuthFetch';

const API_URL = import.meta.env.VITE_APIURL || 'http://localhost:3000';

export type Notification = {
    _id: string;
    userId: string;
    message: string;
    returnLink: string;
    read: boolean;
    createdAt: string;
    updatedAt: string;
};

export async function getUserNotifications(userId: string): Promise<Notification[]> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/user/${userId}`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération des notifications');
    }

    return await response.json();
}

export async function getUnreadCount(userId: string): Promise<number> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/user/${userId}/unread/count`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la récupération du compteur');
    }

    const data = await response.json();
    return data.count;
}

export async function markAsRead(notificationId: string): Promise<Notification> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Erreur lors du marquage de la notification');
    }

    return await response.json();
}

export async function markAllAsRead(userId: string): Promise<{ modified: number }> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/user/${userId}/read-all`, {
        method: 'PUT',
    });

    if (!response.ok) {
        throw new Error('Erreur lors du marquage des notifications');
    }

    return await response.json();
}

export async function deleteNotification(notificationId: string): Promise<void> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la notification');
    }
}

export async function deleteAllNotifications(userId: string): Promise<{ deleted: number }> {
    const authFetch = UseAuthFetch();
    const response = await authFetch(`${API_URL}/api/notifications/user/${userId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Erreur lors de la suppression des notifications');
    }

    return await response.json();
}
