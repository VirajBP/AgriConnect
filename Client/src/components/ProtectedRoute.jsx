import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    // Show loading state while checking authentication
    if (loading) {
        return <div>Loading...</div>;
    }

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If no user data or user type doesn't match the route
    if (!user || !userType) {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user is trying to access the correct type of routes
    const path = location.pathname;
    if (path.startsWith('/farmer') && userType !== 'farmer') {
        return <Navigate to="/consumer/dashboard" replace />;
    }
    if (path.startsWith('/consumer') && userType !== 'consumer') {
        return <Navigate to="/farmer/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute; 