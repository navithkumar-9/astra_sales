import { getAvatarStyle } from '../../utils/avatar';
import { timeAgo } from '../../utils/timeAgo';

const NotificationItem = ({ notif, onClick }) => {
    const sender = notif.sender || {};
    const avatarS = getAvatarStyle(sender.username);
    const initial = (sender.name || sender.username || '?').charAt(0).toUpperCase();
    const taskName = notif.task_info?.task_name || 'a task';
    const projectName = notif.task_info?.project_name || '';

    return (
        <div
            className={`notif-float-card ${!notif.is_read ? 'notif-float-unread' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            {!notif.is_read && <div className="notif-float-card-indicator"></div>}
            <div className="notif-float-card-avatar">
                {sender.profile_picture ? (
                    <img
                        src={sender.profile_picture}
                        alt=""
                        className="notif-float-card-avatar-img"
                    />
                ) : (
                    <div
                        className="notif-float-card-avatar-fallback"
                        style={{ background: avatarS.bg }}
                    >
                        {initial}
                    </div>
                )}
            </div>
            <div className="notif-float-card-body">
                <p className="notif-float-card-message">
                    {notif.task_info ? (
                        <>
                            <strong>{sender.name || sender.username}</strong> commented on{' '}
                            <strong>{taskName}</strong>
                        </>
                    ) : (
                        <>
                            <strong>{sender.name || sender.username}</strong> posted a{' '}
                            <strong>New Announcement</strong>:{' '}
                            {notif.message.replace(/^New Announcement:\s*/, '')}
                        </>
                    )}
                </p>
                {notif.task_info && notif.comment_content && (
                    <span className="notif-float-card-comment-preview">
                        "{notif.comment_content}"
                    </span>
                )}
                <div className="notif-float-card-footer">
                    {projectName && (
                        <span className="notif-float-card-project">
                            <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                            >
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                            </svg>
                            {projectName}
                        </span>
                    )}
                    <span className="notif-float-card-time">{timeAgo(notif.created_at)}</span>
                </div>
            </div>
            <div className="notif-float-card-arrow">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>
        </div>
    );
};

export default NotificationItem;
