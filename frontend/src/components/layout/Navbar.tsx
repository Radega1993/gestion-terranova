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
    Menu as MenuIcon,
    ShoppingCart as ShoppingCartIcon,
    AccountBalance as AccountBalanceIcon,
    AttachMoney as AttachMoneyIcon,
    ConfirmationNumber as ConfirmationNumberIcon,
    Badge as BadgeIcon,
    Undo as UndoIcon,
    SwapHoriz as SwapHorizIcon,
    Description as DescriptionIcon,
    MoreVert as MoreVertIcon,
    Settings as SettingsIcon
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
    const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

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

    const handleMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
        setMoreMenuAnchorEl(event.currentTarget);
    };

    const handleMoreMenuClose = () => {
        setMoreMenuAnchorEl(null);
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

    const renderNavButton = (path: string, label: string, icon: React.ReactNode, iconOnly?: boolean) => (
        <Button
            color="inherit"
            onClick={() => navigate(path)}
            startIcon={icon}
            sx={{
                backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
                minWidth: iconOnly ? 48 : 'auto',
            }}
        >
            {(!isMobile && !iconOnly) ? label : ''}
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
                    <MenuItem onClick={() => { navigate('/ventas'); handleMobileMenuClose(); }}>
                        <ShoppingCartIcon sx={{ mr: 1 }} /> Ventas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/deudas'); handleMobileMenuClose(); }}>
                        <AccountBalanceIcon sx={{ mr: 1 }} /> Deudas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/recaudaciones'); handleMobileMenuClose(); }}>
                        <AttachMoneyIcon sx={{ mr: 1 }} /> Recaudaciones
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
                    <MenuItem onClick={() => { navigate('/invitaciones'); handleMobileMenuClose(); }}>
                        <ConfirmationNumberIcon sx={{ mr: 1 }} /> Invitaciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/tiendas'); handleMobileMenuClose(); }}>
                        <BadgeIcon sx={{ mr: 1 }} /> Tiendas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/devoluciones'); handleMobileMenuClose(); }}>
                        <UndoIcon sx={{ mr: 1 }} /> Devoluciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/cambios'); handleMobileMenuClose(); }}>
                        <SwapHorizIcon sx={{ mr: 1 }} /> Cambios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/gestion-ventas'); handleMobileMenuClose(); }}>
                        <SettingsIcon sx={{ mr: 1 }} /> Gestión de Ventas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/configuracion/normativa'); handleMobileMenuClose(); }}>
                        <DescriptionIcon sx={{ mr: 1 }} /> Normativa
                    </MenuItem>
                </>
            )}
            {user?.role === 'TIENDA' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/deudas'); handleMobileMenuClose(); }}>
                        <AccountBalanceIcon sx={{ mr: 1 }} /> Deudas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/reservas'); handleMobileMenuClose(); }}>
                        <EventIcon sx={{ mr: 1 }} /> Reservas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/ventas'); handleMobileMenuClose(); }}>
                        <ShoppingCartIcon sx={{ mr: 1 }} /> Ventas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/socios'); handleMobileMenuClose(); }}>
                        <PeopleIcon sx={{ mr: 1 }} /> Socios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/inventory'); handleMobileMenuClose(); }}>
                        <InventoryIcon sx={{ mr: 1 }} /> Inventario
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/recaudaciones'); handleMobileMenuClose(); }}>
                        <AttachMoneyIcon sx={{ mr: 1 }} /> Recaudaciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/invitaciones'); handleMobileMenuClose(); }}>
                        <ConfirmationNumberIcon sx={{ mr: 1 }} /> Invitaciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/devoluciones'); handleMobileMenuClose(); }}>
                        <UndoIcon sx={{ mr: 1 }} /> Devoluciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/cambios'); handleMobileMenuClose(); }}>
                        <SwapHorizIcon sx={{ mr: 1 }} /> Cambios
                    </MenuItem>
                </>
            )}
            {user?.role === 'JUNTA' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/deudas'); handleMobileMenuClose(); }}>
                        <AccountBalanceIcon sx={{ mr: 1 }} /> Deudas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/recaudaciones'); handleMobileMenuClose(); }}>
                        <AttachMoneyIcon sx={{ mr: 1 }} /> Recaudaciones
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
                    <MenuItem onClick={() => { navigate('/invitaciones'); handleMobileMenuClose(); }}>
                        <ConfirmationNumberIcon sx={{ mr: 1 }} /> Invitaciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/configuracion/normativa'); handleMobileMenuClose(); }}>
                        <DescriptionIcon sx={{ mr: 1 }} /> Normativa
                    </MenuItem>
                </>
            )}
            {user?.role === 'TRABAJADOR' && (
                <>
                    <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                        <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/deudas'); handleMobileMenuClose(); }}>
                        <AccountBalanceIcon sx={{ mr: 1 }} /> Deudas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/reservas'); handleMobileMenuClose(); }}>
                        <EventIcon sx={{ mr: 1 }} /> Reservas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/ventas'); handleMobileMenuClose(); }}>
                        <ShoppingCartIcon sx={{ mr: 1 }} /> Ventas
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/socios'); handleMobileMenuClose(); }}>
                        <PeopleIcon sx={{ mr: 1 }} /> Socios
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/inventory'); handleMobileMenuClose(); }}>
                        <InventoryIcon sx={{ mr: 1 }} /> Inventario
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/recaudaciones'); handleMobileMenuClose(); }}>
                        <AttachMoneyIcon sx={{ mr: 1 }} /> Recaudaciones
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/invitaciones'); handleMobileMenuClose(); }}>
                        <ConfirmationNumberIcon sx={{ mr: 1 }} /> Invitaciones
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
                            {renderNavButton('/', 'Inicio', <HomeIcon />, isTablet)}
                            {user.role === 'ADMINISTRADOR' && (
                                <>
                                    {renderNavButton('/inventory', 'Inventario', <InventoryIcon />, isTablet)}
                                    {renderNavButton('/ventas', 'Ventas', <ShoppingCartIcon />, isTablet)}
                                    {renderNavButton('/deudas', 'Deudas', <AccountBalanceIcon />, isTablet)}
                                    {renderNavButton('/recaudaciones', 'Recaudaciones', <AttachMoneyIcon />, isTablet)}
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />, isTablet)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />, isTablet)}
                                    {renderNavButton('/invitaciones', 'Invitaciones', <ConfirmationNumberIcon />, isTablet)}
                                    <IconButton
                                        color="inherit"
                                        onClick={handleMoreMenu}
                                        sx={{
                                            backgroundColor: Boolean(moreMenuAnchorEl) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={moreMenuAnchorEl}
                                        open={Boolean(moreMenuAnchorEl)}
                                        onClose={handleMoreMenuClose}
                                    >
                                        <MenuItem onClick={() => { navigate('/users'); handleMoreMenuClose(); }}>
                                            <PersonIcon sx={{ mr: 1 }} /> Usuarios
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/tiendas'); handleMoreMenuClose(); }}>
                                            <BadgeIcon sx={{ mr: 1 }} /> Tiendas
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/devoluciones'); handleMoreMenuClose(); }}>
                                            <UndoIcon sx={{ mr: 1 }} /> Devoluciones
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/cambios'); handleMoreMenuClose(); }}>
                                            <SwapHorizIcon sx={{ mr: 1 }} /> Cambios
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/gestion-ventas'); handleMoreMenuClose(); }}>
                                            <SettingsIcon sx={{ mr: 1 }} /> Gestión de Ventas
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/configuracion/normativa'); handleMoreMenuClose(); }}>
                                            <DescriptionIcon sx={{ mr: 1 }} /> Normativa
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                            {user.role === 'JUNTA' && (
                                <>
                                    {renderNavButton('/deudas', 'Deudas', <AccountBalanceIcon />, isTablet)}
                                    {renderNavButton('/recaudaciones', 'Recaudaciones', <AttachMoneyIcon />, isTablet)}
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />, isTablet)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />, isTablet)}
                                    {renderNavButton('/invitaciones', 'Invitaciones', <ConfirmationNumberIcon />, isTablet)}
                                    <IconButton
                                        color="inherit"
                                        onClick={handleMoreMenu}
                                        sx={{
                                            backgroundColor: Boolean(moreMenuAnchorEl) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={moreMenuAnchorEl}
                                        open={Boolean(moreMenuAnchorEl)}
                                        onClose={handleMoreMenuClose}
                                    >
                                        <MenuItem onClick={() => { navigate('/users'); handleMoreMenuClose(); }}>
                                            <PersonIcon sx={{ mr: 1 }} /> Usuarios
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/configuracion/normativa'); handleMoreMenuClose(); }}>
                                            <DescriptionIcon sx={{ mr: 1 }} /> Normativa
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                            {user.role === 'TRABAJADOR' && (
                                <>
                                    {renderNavButton('/deudas', 'Deudas', <AccountBalanceIcon />, isTablet)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />, isTablet)}
                                    {renderNavButton('/ventas', 'Ventas', <ShoppingCartIcon />, isTablet)}
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />, isTablet)}
                                    {renderNavButton('/inventory', 'Inventario', <InventoryIcon />, isTablet)}
                                    {renderNavButton('/recaudaciones', 'Recaudaciones', <AttachMoneyIcon />, isTablet)}
                                    {renderNavButton('/invitaciones', 'Invitaciones', <ConfirmationNumberIcon />, isTablet)}
                                </>
                            )}
                            {user.role === 'TIENDA' && (
                                <>
                                    {renderNavButton('/deudas', 'Deudas', <AccountBalanceIcon />, isTablet)}
                                    {renderNavButton('/reservas', 'Reservas', <EventIcon />, isTablet)}
                                    {renderNavButton('/ventas', 'Ventas', <ShoppingCartIcon />, isTablet)}
                                    {renderNavButton('/socios', 'Socios', <PeopleIcon />, isTablet)}
                                    {renderNavButton('/inventory', 'Inventario', <InventoryIcon />, isTablet)}
                                    {renderNavButton('/recaudaciones', 'Recaudaciones', <AttachMoneyIcon />, isTablet)}
                                    {renderNavButton('/invitaciones', 'Invitaciones', <ConfirmationNumberIcon />, isTablet)}
                                    <IconButton
                                        color="inherit"
                                        onClick={handleMoreMenu}
                                        sx={{
                                            backgroundColor: Boolean(moreMenuAnchorEl) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            },
                                        }}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={moreMenuAnchorEl}
                                        open={Boolean(moreMenuAnchorEl)}
                                        onClose={handleMoreMenuClose}
                                    >
                                        <MenuItem onClick={() => { navigate('/devoluciones'); handleMoreMenuClose(); }}>
                                            <UndoIcon sx={{ mr: 1 }} /> Devoluciones
                                        </MenuItem>
                                        <MenuItem onClick={() => { navigate('/cambios'); handleMoreMenuClose(); }}>
                                            <SwapHorizIcon sx={{ mr: 1 }} /> Cambios
                                        </MenuItem>
                                    </Menu>
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