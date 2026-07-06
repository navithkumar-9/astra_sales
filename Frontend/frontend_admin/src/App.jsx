import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ProtectedRoute, { PublicRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Lazy load page components
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TeamList = lazy(() => import('./pages/TeamList'));
const CreateMember = lazy(() => import('./pages/CreateMember'));
const Settings = lazy(() => import('./pages/Settings'));

const LoadingFallback = () => (
    <div className="loading-fallback-container">
        <div className="loading-fallback-spinner"></div>
    </div>
);

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Dashboard />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/team"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <TeamList />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/create-member"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <CreateMember />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <Settings />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="*"
                                element={<Navigate to="/login" replace />}
                            />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
