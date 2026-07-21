/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */

import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper">
                <main className="main-content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
