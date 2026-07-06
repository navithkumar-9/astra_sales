import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from './useNotifications';
import NotificationList from './NotificationList';

const NotificationPopup = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const {
        notifications,
        unreadCount,
        loadingNotifs,
        fetchNotifications,
        markAsRead,
        markAllRead,
    } = useNotifications(user);

    const [isOpen, setIsOpen] = useState(false);
    const [isDraggingState, setIsDraggingState] = useState(false);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const positionRef = useRef({ x: 0, y: 0 });
    const lastAppliedRef = useRef({ x: 0, y: 0 });
    const hasDraggedRef = useRef(false);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        setIsDraggingState(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasDraggedRef.current = true;
        }

        let newX = positionRef.current.x + dx;
        let newY = positionRef.current.y + dy;

        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth || 60;
            const containerHeight = containerRef.current.offsetHeight || 60;

            const initialLeft = window.innerWidth - containerWidth - 24;
            const initialTop = window.innerHeight - containerHeight - 24;

            const currentLeft = initialLeft + newX;
            const currentTop = initialTop + newY;

            if (currentLeft < 10) newX = 10 - initialLeft;
            else if (currentLeft > window.innerWidth - containerWidth - 10)
                newX = window.innerWidth - containerWidth - 10 - initialLeft;

            if (currentTop < 10) newY = 10 - initialTop;
            else if (currentTop > window.innerHeight - containerHeight - 10)
                newY = window.innerHeight - containerHeight - 10 - initialTop;

            lastAppliedRef.current = { x: newX, y: newY };
            containerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }
    };

    const handleMouseUp = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDraggingState(false);
        positionRef.current = { ...lastAppliedRef.current };
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        setIsDraggingState(true);
        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
    };

    const handleTouchMove = (e) => {
        if (!isDraggingRef.current) return;
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasDraggedRef.current = true;
            e.preventDefault();
        }

        let newX = positionRef.current.x + dx;
        let newY = positionRef.current.y + dy;

        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth || 60;
            const containerHeight = containerRef.current.offsetHeight || 60;

            const initialLeft = window.innerWidth - containerWidth - 24;
            const initialTop = window.innerHeight - containerHeight - 24;

            const currentLeft = initialLeft + newX;
            const currentTop = initialTop + newY;

            if (currentLeft < 10) newX = 10 - initialLeft;
            else if (currentLeft > window.innerWidth - containerWidth - 10)
                newX = window.innerWidth - containerWidth - 10 - initialLeft;

            if (currentTop < 10) newY = 10 - initialTop;
            else if (currentTop > window.innerHeight - containerHeight - 10)
                newY = window.innerHeight - containerHeight - 10 - initialTop;

            lastAppliedRef.current = { x: newX, y: newY };
            containerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDraggingState(false);
        positionRef.current = { ...lastAppliedRef.current };
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    };

    const togglePopup = () => {
        if (hasDraggedRef.current) return;
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchNotifications();
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            await markAsRead(notif.id);
        }
        setIsOpen(false);
        const taskId = notif.task_info?.id;
        if (taskId) {
            navigate(`/tasks?taskId=${taskId}`);
        } else {
            navigate('/announcements');
        }
    };

    if (!user) return null;

    return (
        <div className={`notif-float-container ${isDraggingState ? 'dragging' : ''}`} ref={containerRef}>
            <button
                className={`notif-float-btn ${isOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={togglePopup}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                title="Notifications"
                id="floating-notification-button"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="notif-float-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notif-float-panel">
                    <div className="notif-float-panel-header">
                        <div className="notif-float-panel-title-area">
                            <h4 className="notif-float-panel-title">Notifications</h4>
                            {unreadCount > 0 && (
                                <span className="notif-float-panel-count">{unreadCount} new</span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button className="notif-float-mark-all" onClick={markAllRead}>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notif-float-panel-body">
                        <NotificationList
                            notifications={notifications}
                            loadingNotifs={loadingNotifs}
                            onNotificationClick={handleNotificationClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPopup;
