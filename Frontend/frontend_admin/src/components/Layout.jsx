import NotificationPopup from './notifications/NotificationPopup';
import Sidebar from './sidebar/Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper">
                <main className="main-content">{children}</main>
                <NotificationPopup />
            </div>
        </div>
    );
};

export default Layout;
