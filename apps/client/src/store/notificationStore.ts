import { create } from 'zustand';
import type { Notification } from '../api/notifications';

type NotificationStore = {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    setNotifications: (notifications: Notification[]) => void;
    setUnreadCount: (count: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    markAsRead: (notificationId: string) => void;
    deleteNotification: (notificationId: string) => void;
    clearAll: () => void;
};

export const notificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    setNotifications: (notifications) => set({ notifications }),
    setUnreadCount: (count) => set({ unreadCount: count }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    markAsRead: (notificationId) =>
        set((state) => ({
            notifications: state.notifications.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
            unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    deleteNotification: (notificationId) =>
        set((state) => {
            const notification = state.notifications.find((n) => n._id === notificationId);
            const wasUnread = notification && !notification.read;
            return {
                notifications: state.notifications.filter((n) => n._id !== notificationId),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
        }),
    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
