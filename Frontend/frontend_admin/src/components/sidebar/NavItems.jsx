import { NavLink } from 'react-router-dom';

const NavItems = ({ navItems, isCollapsed, isSearchOpen, setIsSearchOpen }) => {
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

    return (
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
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `nav-item ${isActive ? 'nav-item-active' : ''}`
                    }
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default NavItems;
