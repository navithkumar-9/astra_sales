import { getAvatarStyle } from '../../utils/avatar';

const UserProfile = ({ user, handleLogout }) => {
    const displayName = user?.name || user?.username || 'User';
    const profilePic = user?.profile_picture || null;

    return (
        <div className="sidebar-bottom-row">
            <div className="sidebar-profile-new">
                <div className="sidebar-profile-avatar-wrapper">
                    {profilePic ? (
                        <img
                            src={profilePic}
                            alt="Avatar"
                            className="sidebar-profile-avatar"
                        />
                    ) : (
                        <div
                            className="sidebar-profile-avatar-fallback"
                            style={getAvatarStyle(user?.username)}
                        >
                            {displayName?.charAt(0)?.toUpperCase()}
                        </div>
                    )}
                    <span className="sidebar-profile-status online"></span>
                </div>
                <div className="sidebar-profile-info">
                    <span className="sidebar-profile-name">
                        {displayName}
                    </span>
                    <span className="sidebar-profile-role">
                        {user?.role || 'MEMBER'}
                    </span>
                </div>
            </div>
            <button
                className="sidebar-logout-new"
                onClick={handleLogout}
                title="Logout"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    );
};

export default UserProfile;
