/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { tokens } = useAuth();
  if (!tokens) return <Navigate to="/login" replace />;
  return children;
};

export const PublicRoute = ({ children }) => {
  const { tokens } = useAuth();
  if (tokens) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
