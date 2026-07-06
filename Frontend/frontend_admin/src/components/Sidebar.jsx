import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const SEARCH_BUTTON_STYLE = {
    background: 'transparent',
    border: 'none',
    width: 'calc(100% - 24px)',
    margin: '0 12px 6px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    color: 'var(--text-secondary)'
};

const KBD_STYLE = {
    marginLeft: '6px',
    background: '#cbd5e1',
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    color: '#475569'
};

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleSidebar = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebar_collapsed', String(nextState));
    };

    const isSuperAdmin = user?.role === 'SUPERADMIN';
    const isAdmin = user?.role === 'ADMIN';
    const canManageMembers = isSuperAdmin || isAdmin;
    const canCrud = canManageMembers || user?.can_crud_tasks;

    const displayName = user?.name || user?.username || 'User';
    const profilePic = user?.profile_picture || null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            ),
        },
    ];

    if (canCrud) {
        navItems.push({
            path: '/completed-tasks',
            label: 'Completed Tasks',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        });
    }

    if (canManageMembers) {
        navItems.push(
            {
                path: '/create-member',
                label: 'Create Member',
                icon: (
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="20" y1="8" x2="20" y2="14" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                ),
            },
            {
                path: '/team',
                label: 'Team Members',
                icon: (
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                ),
            },
        );
    }

    if (canManageMembers) {
        navItems.push({
            label: 'Create Types',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M12 8v8" />
                    <path d="M8 12h8" />
                </svg>
            ),
            children: [
                { path: '/settings?tab=sbu', label: 'SBU' },
                { path: '/settings?tab=division', label: 'Division' },
                { path: '/settings?tab=fg', label: 'FG Type' },
                { path: '/settings?tab=rfq', label: 'RFQ' },
                { path: '/settings?tab=customer', label: 'Customer' },
                { path: '/settings?tab=mail', label: 'Notification Mail' },
            ]
        });
    } else {
        navItems.push({
            path: '/settings',
            label: 'Settings',
            icon: (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            ),
        });
    }

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-top">
                <div className="sidebar-brand">
                    <div className="sidebar-logo">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="ext-sidebar-1"
                        />
                    </div>
                    <div className="sidebar-brand-info">
                        <span className="sidebar-brand-name">Tracker</span>
                        <span className="sidebar-brand-role">
                            {user?.role || 'Admin'}
                        </span>
                    </div>
                    <button
                        className="sidebar-toggle-btn"
                        onClick={toggleSidebar}
                        title={
                            isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'
                        }
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="6" x2="21" y2="6" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section-label">MENU</div>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="nav-item"
                        style={SEARCH_BUTTON_STYLE}
                    >
                        <span className="nav-icon">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </span>
                        <span className="nav-label" style={{ display: isCollapsed ? 'none' : 'inline' }}>
                            Search <kbd style={KBD_STYLE}>Ctrl+K</kbd>
                        </span>
                    </button>
                    {navItems.map((item) => {
                        if (item.children) {
                            return (
                                <div key={item.label} className="nav-item-group" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="nav-item nav-item-parent" style={{ cursor: 'default' }}>
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-label" style={{ display: isCollapsed ? 'none' : 'inline' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                    {!isCollapsed && (
                                        <div className="sidebar-submenu" style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', marginBottom: '8px' }}>
                                            {item.children.map((sub) => (
                                                <NavLink
                                                    key={sub.path}
                                                    to={sub.path}
                                                    className={({ isActive }) =>
                                                        `submenu-item ${isActive ? 'submenu-item-active' : ''}`
                                                    }
                                                >
                                                    {sub.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                                }
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label" style={{ display: isCollapsed ? 'none' : 'inline' }}>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
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
        </aside>
    );
};

export default Sidebar;
