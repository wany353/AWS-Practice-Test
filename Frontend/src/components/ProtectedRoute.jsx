import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cq-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cq-acc"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'Admin') {
    // Redirect to dashboard if logged in but not admin
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
