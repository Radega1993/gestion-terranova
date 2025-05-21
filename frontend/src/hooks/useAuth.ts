import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { UserRole } from '../types/user';

export const useAuth = () => {
    const navigate = useNavigate();
    const { token, userRole, isAuthenticated, setAuth, clearAuth } = useAuthStore();

    useEffect(() => {
        // Verificar si hay un token en localStorage al cargar la aplicación
        const storedToken = localStorage.getItem('token');
        const storedRole = localStorage.getItem('userRole') as UserRole | null;

        if (storedToken && storedRole) {
            setAuth(storedToken, storedRole);
        }
    }, []);

    const login = (token: string, userRole: UserRole) => {
        setAuth(token, userRole);
    };

    const logout = () => {
        clearAuth();
        navigate('/login');
    };

    const checkAuth = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return false;
        }
        return true;
    };

    return {
        token,
        userRole,
        isAuthenticated,
        login,
        logout,
        checkAuth
    };
}; 