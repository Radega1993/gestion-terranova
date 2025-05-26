import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types/user';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();
    const { isAuthenticated, userRole } = useAuthStore();

    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si hay roles específicos requeridos, verificar que el usuario tenga uno de ellos
    if (allowedRoles && allowedRoles.length > 0 && userRole) {
        const hasRole = allowedRoles.includes(userRole);
        if (!hasRole) {
            return <Navigate to="/dashboard" state={{ from: location }} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute; 