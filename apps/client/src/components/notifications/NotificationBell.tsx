import { useEffect, useState, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { notificationStore } from '../../store/notificationStore';
import { userStore } from '../../store/userStore';
import { toast } from 'react-toastify';
import {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
} from '../../api/notifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const previousUnreadCountRef = useRef<number>(0);
    const navigate = useNavigate();

    const { notifications, unreadCount, isLoading, error } = notificationStore();
    const {
        setNotifications,
        setUnreadCount,
        setLoading,
        setError,
        markAsRead: markAsReadStore,
        deleteNotification: deleteNotificationStore,
        clearAll,
    } = notificationStore();

    const user = userStore((state) => state.access);
    const get = userStore((state) => state.get);
    const userId = get(user)?.id;

    useEffect(() => {
        if (!userId) return;

        const loadNotifications = async () => {
            setLoading(true);
            try {
                const [notifs, count] = await Promise.all([getUserNotifications(userId), getUnreadCount(userId)]);
                setNotifications(notifs);
                setUnreadCount(count);
                previousUnreadCountRef.current = count;
                setError(null);
            } catch (err) {
                setError('Erreur lors du chargement des notifications');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const interval = setInterval(async () => {
            try {
                const count = await getUnreadCount(userId);
                if (count > previousUnreadCountRef.current) {
                    const newNotifications = count - previousUnreadCountRef.current;
                    toast.info(
                        `Vous avez ${newNotifications} nouvelle${newNotifications > 1 ? 's' : ''} notification${newNotifications > 1 ? 's' : ''}`,
                        { toastId: 'new-notifications' },
                    );
                    const notifs = await getUserNotifications(userId);
                    setNotifications(notifs);
                }
                previousUnreadCountRef.current = count;
                setUnreadCount(count);
            } catch (err) {
                console.error('Erreur polling notifications:', err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleMarkAsRead = async (notificationId: string, returnLink?: string) => {
        try {
            const notification = notifications.find((n) => n._id === notificationId);
            const wasUnread = notification && !notification.read;

            await markAsRead(notificationId);
            markAsReadStore(notificationId);

            if (wasUnread) {
                previousUnreadCountRef.current = Math.max(0, previousUnreadCountRef.current - 1);
            }

            if (returnLink) {
                navigate(returnLink);
                setIsOpen(false);
            }
        } catch (err) {
            console.error('Erreur marquage notification:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) return;

        try {
            await markAllAsRead(userId);
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
            previousUnreadCountRef.current = 0;
        } catch (err) {
            console.error('Erreur marquage toutes notifications:', err);
        }
    };

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        try {
            const notification = notifications.find((n) => n._id === notificationId);
            const wasUnread = notification && !notification.read;

            await deleteNotification(notificationId);
            deleteNotificationStore(notificationId);

            if (wasUnread) {
                previousUnreadCountRef.current = Math.max(0, previousUnreadCountRef.current - 1);
            }
        } catch (err) {
            console.error('Erreur suppression notification:', err);
        }
    };

    const handleDeleteAll = async () => {
        if (!userId) return;

        try {
            await deleteAllNotifications(userId);
            clearAll();
            previousUnreadCountRef.current = 0;
        } catch (err) {
            console.error('Erreur suppression toutes notifications:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), {
            addSuffix: true,
            locale: fr,
        });
    };

    if (!userId) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-ghost btn-circle relative hover:bg-base-200 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 text-primary" />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-error text-error-content text-sm font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-base-100 rounded-box shadow-xl border border-base-300 z-50">
                    <div className="flex items-center justify-between p-4 border-b border-base-300">
                        <h3 className="font-semibold text-lg">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="btn btn-ghost btn-sm btn-circle"
                            aria-label="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-base-300 bg-base-200">
                            <button
                                onClick={handleMarkAllAsRead}
                                className="btn btn-ghost btn-xs gap-1"
                                disabled={unreadCount === 0}
                            >
                                <Check className="w-3 h-3" />
                                Tout marquer comme lu
                            </button>
                            <button onClick={handleDeleteAll} className="btn btn-ghost btn-xs gap-1 text-error">
                                <Trash2 className="w-3 h-3" />
                                Tout supprimer
                            </button>
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <span className="loading loading-spinner loading-md"></span>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-error">{error}</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-base-content/60">
                                <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>Aucune notification</p>
                            </div>
                        ) : (
                            <ul>
                                {notifications.map((notification) => (
                                    <li
                                        key={notification._id}
                                        className={`border-b border-base-200 last:border-b-0 hover:bg-base-200 transition-colors ${
                                            !notification.read ? 'bg-primary/5' : ''
                                        }`}
                                    >
                                        <div
                                            className="p-4 cursor-pointer relative group"
                                            onClick={() =>
                                                handleMarkAsRead(notification._id, notification.returnLink || undefined)
                                            }
                                        >
                                            {!notification.read && (
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                                            )}

                                            <div className="flex items-start gap-3 pl-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-base-content wrap-break-word">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        {formatDate(notification.createdAt)}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => handleDelete(notification._id, e)}
                                                    className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    aria-label="Supprimer"
                                                >
                                                    <Trash2 className="w-3 h-3 text-error" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
