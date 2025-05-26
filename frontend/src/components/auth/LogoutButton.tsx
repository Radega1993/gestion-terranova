import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { useAuthStore } from '../../stores/authStore';

const LogoutButton: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        localStorage.removeItem('auth-storage');
        navigate('/login', { replace: true });
    };

    return (
        <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
        </Button>
    );
};

export default LogoutButton; 