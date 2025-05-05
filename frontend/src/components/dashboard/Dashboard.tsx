import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CardActionArea, Typography, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/user';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState<string | null>(null);

    const modules = [
        { title: 'Deudas', path: '/deudas', description: 'Gestión de deudas' },
        { title: 'Reservas', path: '/reservas', description: 'Gestión de reservas' },
        { title: 'Ventas', path: '/ventas', description: 'Gestión de ventas' },
        { title: 'Socios', path: '/socios', description: 'Gestión de socios' },
        { title: 'Stock', path: '/stock', description: 'Gestión de stock' },
        {
            title: 'Usuarios',
            path: '/users',
            description: 'Gestión de usuarios',
            roles: [UserRole.ADMINISTRADOR, UserRole.JUNTA]
        },
    ];

    useEffect(() => {
        // Obtener el token
        const token = localStorage.getItem('token') ||
            localStorage.getItem('gestion-terranova') ||
            localStorage.getItem('access_token');

        // Decodificar el token para obtener el rol
        try {
            if (token) {
                const decoded = JSON.parse(atob(token.split('.')[1]));
                setUserRole(decoded.role);
            }
        } catch (error) {
            console.error('Error decodificando token:', error);
        }
    }, []);

    // Filtrar módulos según el rol del usuario
    const filteredModules = modules.filter(module => {
        // Si el módulo no tiene restricción de roles, mostrarlo
        if (!module.roles) return true;

        // Si el módulo tiene roles especificados, verificar si el usuario tiene permiso
        return module.roles.includes(userRole as UserRole);
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Dashboard
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                    },
                    gap: 3,
                }}
            >
                {filteredModules.map((module) => (
                    <Card key={module.path}>
                        <CardActionArea onClick={() => navigate(module.path)}>
                            <CardContent>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {module.title}
                                </Typography>
                                <Typography color="textSecondary">
                                    {module.description}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>
        </Container>
    );
};

export default Dashboard; 