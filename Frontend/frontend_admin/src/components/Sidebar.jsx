/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getAvatarStyle } from '../utils/avatar';
import { hasPermission, PERMISSIONS, ROLES } from '../config/permissions';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    const [openMenus, setOpenMenus] = useState({ 'Sales Pipeline': true });

    const [counts, setCounts] = useState({
        openL1Count: 0,
        wonCount: 0,
        regrettedCount: 0,
                lostCount: 0,
        holdCount: 0,
        quoteSubmittedCount: 0
    });

    useEffect(() => {
        if (!user) return;
        const fetchCounts = async () => {
            try {
                const res = await API.get('/dashboard/stats/');
                if (res.data.success && res.data.data && res.data.data.kpis) {
                    const k = res.data.data.kpis;
                    setCounts({
                        openL1Count: k.openL1Count || 0,
                        wonCount: k.wonCount || 0,
                        regrettedCount: k.regrettedCount || 0,
                                                lostCount: k.lostCount || 0,
                        holdCount: k.holdCount || 0,
                        quoteSubmittedCount: k.totalQuotedRecords || 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch sidebar counts:", err);
            }
        };
        fetchCounts();
    }, [location, user]);

    const getSubmenuCount = (subLabel) => {
        switch (subLabel) {
            case 'Open L1':
                return counts.openL1Count;
            case 'Won':
                return counts.wonCount;
            case 'Regretted':
                return counts.regrettedCount;
                        case 'Lost':
                return counts.lostCount;
            case 'On Hold':
                return counts.holdCount;
            case 'Quote Submitted':
                return counts.quoteSubmittedCount;
            default:
                return null;
        }
    };

    const toggleMenu = (label) => {
        setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const toggleSidebar = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebar_collapsed', String(nextState));
    };

    const userRole = user?.role;
    const canManageMembers = hasPermission(userRole, PERMISSIONS.CAN_MANAGE_USERS);
    const canViewReports = hasPermission(userRole, PERMISSIONS.CAN_VIEW_REPORTS);

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
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            path: '/enquiries',
            label: 'Enquiry Tracker',
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
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                </svg>
            ),
        },
        {
            path: '/kanban',
            label: 'RFQ Pipeline',
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
            ),
        },
        {
            label: 'Sales Pipeline',
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
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
            ),
            children: [
                { path: '/pipeline/quoted-90', label: 'Quoted (>90 Days)' },
                { path: '/pipeline/open-l1', label: 'Open L1' },
                { path: '/pipeline/won', label: 'Won' },
                { path: '/pipeline/regretted', label: 'Regretted' },
                { path: '/pipeline/lost', label: 'Lost' },
                { path: '/pipeline/hold', label: 'On Hold' },
            ]
        },
    ];

    if (canViewReports) {
        navItems.push({
            path: '/sales-rep-performance',
            label: 'Sales Rep Performance',
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
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
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
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <line x1="16" y1="8" x2="16" y2="8.01" />
                        <line x1="16" y1="12" x2="16" y2="12.01" />
                        <line x1="16" y1="16" x2="16" y2="16.01" />
                        <path d="M7 8h5M7 12h5M7 16h5" />
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
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
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
                        <span className="sidebar-brand-name">Sales</span>
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
                    {navItems.map((item) => {
                        if (item.children) {
                            return (
                                <div key={item.label} className="nav-item-group">
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={`nav-item nav-item-parent w-100 text-start bg-transparent border-0 d-flex align-items-center ${isCollapsed ? 'justify-content-center' : 'justify-content-between'} cursor-pointer`}
                                        title={isCollapsed ? item.label : undefined}
                                    >
                                        <div className={`d-flex align-items-center ${isCollapsed ? 'justify-content-center gap-0 w-100' : 'gap-3'}`}>
                                            <span className="nav-icon">{item.icon}</span>
                                            {!isCollapsed && (
                                                <span className="nav-label">
                                                    {item.label}
                                                </span>
                                            )}
                                        </div>
                                        {!isCollapsed && (
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                className={`submenu-arrow ${openMenus[item.label] ? 'rotated' : ''}`}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        )}
                                    </button>
                                    {!isCollapsed && openMenus[item.label] && (
                                        <div className="sidebar-submenu">
                                            {item.children.map((sub) => (
                                                <NavLink
                                                    key={sub.path}
                                                    to={sub.path}
                                                    className={({ isActive }) =>
                                                        `submenu-item ${isActive ? 'submenu-item-active' : ''}`
                                                    }
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    <span>{sub.label}</span>
                                                    {getSubmenuCount(sub.label) !== null && (
                                                        <span className="badge rounded-pill" style={{
                                                            fontSize: '0.75rem',
                                                            minWidth: '20px',
                                                            height: '20px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#da8cff',
                                                            color: '#ffffff',
                                                            padding: '0 6px',
                                                            borderRadius: '10px',
                                                            fontWeight: '700',
                                                            marginLeft: '8px'
                                                        }}>
                                                            {getSubmenuCount(sub.label)}
                                                        </span>
                                                    )}
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
                                    `nav-item ${isActive ? 'nav-item-active' : ''} ${isCollapsed ? 'justify-content-center' : ''}`
                                }
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!isCollapsed && <span className="nav-label">{item.label}</span>}
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
                                style={{
                                    background: getAvatarStyle(user?.username || displayName).background,
                                    color: getAvatarStyle(user?.username || displayName).color
                                }}
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
