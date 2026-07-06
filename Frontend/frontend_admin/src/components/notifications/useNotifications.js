import { useState, useEffect } from 'react';
import API from '../../api/axios';

export const useNotifications = (user) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    const saveNotifsToCache = (notifs) => {
        try {
            const cleaned = notifs.map((n) => {
                if (n.sender && n.sender.profile_picture && n.sender.profile_picture.length > 1000) {
                    const { profile_picture, ...restSender } = n.sender;
                    return { ...n, sender: restSender };
                }
                return n;
            });
            localStorage.setItem('notif_cache_data', JSON.stringify(cleaned));
        } catch (err) {
            console.warn('Failed to save notifications to cache:', err);
        }
    };

    const fetchNotifications = async () => {
        const cacheData = localStorage.getItem('notif_cache_data');

        if (cacheData) {
            try {
                const parsed = JSON.parse(cacheData);
                setNotifications(parsed);
            } catch (e) {
                // ignore invalid cache
            }
        }

        if (!cacheData) {
            setLoadingNotifs(true);
        }

        try {
            const res = await API.get('/notifications/?page_size=30');
            const data = res.data?.data || res.data?.results?.data || [];
            const notifsArray = Array.isArray(data) ? data : [];
            setNotifications(notifsArray);
            saveNotifsToCache(notifsArray);
        } catch {
            if (!cacheData) {
                setNotifications([]);
            }
        } finally {
            setLoadingNotifs(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        const fetchCount = () => {
            if (document.hidden) return;
            API.get('/notifications/unread-count/')
                .then((res) => {
                    if (res.data?.success) setUnreadCount(res.data.data.count);
                })
                .catch(() => {});
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (notifId) => {
        try {
            await API.patch(`/notifications/${notifId}/read/`);
            setUnreadCount((c) => Math.max(0, c - 1));
            setNotifications((prev) => {
                const updated = prev.map((n) =>
                    n.id === notifId ? { ...n, is_read: true } : n,
                );
                saveNotifsToCache(updated);
                return updated;
            });
        } catch {}
    };

    const markAllRead = async () => {
        try {
            await API.patch('/notifications/mark-all-read/');
            setUnreadCount(0);
            setNotifications((prev) => {
                const updated = prev.map((n) => ({ ...n, is_read: true }));
                saveNotifsToCache(updated);
                return updated;
            });
        } catch {}
    };

    return {
        notifications,
        unreadCount,
        loadingNotifs,
        fetchNotifications,
        markAsRead,
        markAllRead,
    };
};
