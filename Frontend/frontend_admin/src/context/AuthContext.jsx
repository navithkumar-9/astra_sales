/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import API, { setCachedToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('admin_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [tokens, setTokens] = useState(() => {
        const stored = localStorage.getItem('admin_tokens');
        return stored ? JSON.parse(stored) : null;
    });

    const fetchProfile = () => {
        const tokensStored = localStorage.getItem('admin_tokens');
        if (!tokensStored) return;
        API.get('/profile/')
            .then((res) => {
                if (res.data.success) {
                    const profileData = res.data.data;
                    setUser((prev) => {
                        const updated = {
                            ...(prev || {}),
                            ...profileData,
                            role: profileData.role || prev?.role,
                            username: profileData.username || prev?.username,
                        };
                        localStorage.setItem('admin_user', JSON.stringify(updated));
                        return updated;
                    });
                }
            })
            .catch(console.error);
    };

    useEffect(() => {
        if (tokens?.access) {
            setCachedToken(tokens.access);
            fetchProfile();
        } else {
            setCachedToken(null);
        }
    }, [tokens]);

    useEffect(() => {
        const handleProfileUpdate = () => {
            fetchProfile();
        };
        window.addEventListener('profileUpdate', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdate', handleProfileUpdate);
    }, []);

    const login = (userData, tokenData) => {
        setCachedToken(tokenData?.access || null);
        setUser(userData);
        setTokens(tokenData);
        localStorage.setItem('admin_user', JSON.stringify(userData));
        localStorage.setItem('admin_tokens', JSON.stringify(tokenData));
    };

    const logout = () => {
        setCachedToken(null);
        setUser(null);
        setTokens(null);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_tokens');
    };

    const authValue = useMemo(() => ({ user, tokens, login, logout }), [user, tokens]);

    return (
        <AuthContext.Provider value={authValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
