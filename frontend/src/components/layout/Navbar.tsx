import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Gestión Terranova
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {user?.role === 'ADMINISTRADOR' && (
                        <>
                            <Button color="inherit" onClick={() => navigate('/')}>
                                Dashboard
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/stock')}>
                                Inventario
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/socios')}>
                                Socios
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/users')}>
                                Usuarios
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/reservas')}>
                                Reservas
                            </Button>
                        </>
                    )}
                    {user?.role === 'JUNTA' && (
                        <>
                            <Button color="inherit" onClick={() => navigate('/')}>
                                Dashboard
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/socios')}>
                                Socios
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/reservas')}>
                                Reservas
                            </Button>
                        </>
                    )}
                    {user?.role === 'TRABAJADOR' && (
                        <>
                            <Button color="inherit" onClick={() => navigate('/')}>
                                Dashboard
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/stock')}>
                                Inventario
                            </Button>
                            <Button color="inherit" onClick={() => navigate('/reservas')}>
                                Reservas
                            </Button>
                        </>
                    )}
                    <Button color="inherit" onClick={handleLogout}>
                        Cerrar Sesión
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}; 