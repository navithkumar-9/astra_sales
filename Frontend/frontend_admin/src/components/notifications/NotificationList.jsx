import NotificationItem from './NotificationItem';

const NotificationList = ({ notifications, loadingNotifs, onNotificationClick }) => {
    if (loadingNotifs) {
        return (
            <div className="notif-float-empty-state">
                <div className="notif-float-spinner"></div>
                <span>Loading notifications...</span>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="notif-float-empty-state">
                <div className="notif-float-empty-icon">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                </div>
                <span className="notif-float-empty-title">All caught up!</span>
                <span className="notif-float-empty-desc">No new notifications</span>
            </div>
        );
    }

    return (
        <div className="notif-float-list">
            {notifications.map((notif) => (
                <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onClick={() => onNotificationClick(notif)}
                />
            ))}
        </div>
    );
};

export default NotificationList;
