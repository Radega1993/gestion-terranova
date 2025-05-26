import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Tooltip,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
    Dashboard as DashboardIcon,
    Inventory as InventoryIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Event as EventIcon,
    Logout as LogoutIcon,
    Home as HomeIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

export const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { logout, user, isAuthenticated } = useAuthStore();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMenuAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuAnchorEl(null);
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que deseas cerrar la sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            logout();
            navigate('/login');
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const renderNavButton = (path: string, label: string, icon: React.ReactNode) => (
        <Button
            color="inherit"
            onClick={() => navigate(path)}
            startIcon={icon}
            sx={{
                backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
            }}
        >
            {!isMobile && label}
        </Button>
    );

    const renderMobileMenu = () => (
        <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileMenuClose}
        >
            {user?.role === 'ADMINISTRADOR' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/inventory'); handleMobileMenuClose(); }}>
                        <InventoryIcon sx={{ mr: 1 }} /> Inventario
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/socios'); handleMobileMenuClose(); }}>
                        <PeopleIcon sx={{ mr: 1 }} /> Socios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/users'); handleMobileMenuClose(); }}>
                        <PersonIcon sx={{ mr: 1 }} /> Usuarios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/reservas'); handleMobileMenuClose(); }}>
                        <EventIcon sx={{ mr: 1 }} /> Reservas
                    </MenuItem>
                </>
            )}
            {user?.role === 'JUNTA' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/socios'); handleMobileMenuClose(); }}>
                        <PeopleIcon sx={{ mr: 1 }} /> Socios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/reservas'); handleMobileMenuClose(); }}>
                        <EventIcon sx={{ mr: 1 }} /> Reservas
                    </MenuItem>
                </>
            )}
            {user?.role === 'TRABAJADOR' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/inventory'); handleMobileMenuClose(); }}>
                        <InventoryIcon sx={{ mr: 1 }} /> Inventario
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/reservas'); handleMobileMenuClose(); }}>
                        <EventIcon sx={{ mr: 1 }} /> Reservas
                    </MenuItem>
                </>
            )}
            <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Cerrar Sesión
            </MenuItem>
        </Menu>
    );

    if (!user) {
        return null;
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Gestión Terranova
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {isMobile ? (
                        <>
                            <IconButton
                                color="inherit"
                                onClick={handleMobileMenu}
                                edge="start"
                            >
                                <MenuIcon />
                            </IconButton>
                            {renderMobileMenu()}
                        </>
                    ) : (
                        <>
                            {renderNavButton('/', 'Inicio', <HomeIcon />)}
                            {user.role === 'ADMINISTRADOR' && (
                                <>
                                    {renderNavButton('/inventory', 'Inventario', <InventoryIcon />)}
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />)}
                                    {renderNavButton('/users', 'Usuarios', <PersonIcon />)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />)}
                                </>
                            )}
                            {user.role === 'JUNTA' && (
                                <>
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />)}
                                </>
                            )}
                            {user.role === 'TRABAJADOR' && (
                                <>
                                    {renderNavButton('/inventory', 'Inventario', <InventoryIcon />)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />)}
                                </>
                            )}
                        </>
                    )}
                    <Tooltip title="Perfil">
                        <IconButton
                            onClick={handleMenu}
                            color="inherit"
                        >
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {user.username?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem disabled>
                            <Typography variant="body2">
                                {user.username} ({user.role})
                            </Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1 }} /> Cerrar Sesión
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
}; 