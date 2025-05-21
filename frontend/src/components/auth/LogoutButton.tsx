import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const LogoutButton: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('gestion-terranova');
        navigate('/login');
    };

    return (
        <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
        </Button>
    );
};

export default LogoutButton; 