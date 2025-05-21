import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types/user';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();
    const { token, userRole, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Forzar la rehidratación del store al montar el componente
        useAuthStore.persist.rehydrate();
    }, []);

    // Verificar si hay un token válido
    if (!token || !userRole) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si hay roles específicos requeridos, verificar que el usuario tenga uno de ellos
    if (allowedRoles && allowedRoles.length > 0) {
        const hasRole = allowedRoles.includes(userRole as UserRole);
        if (!hasRole) {
            return <Navigate to="/dashboard" state={{ from: location }} replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute; 