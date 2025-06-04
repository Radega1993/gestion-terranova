import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { UserRole } from '../../types/user';
import { API_BASE_URL } from '../../config';

interface RegisterFormData {
    nombre: string;
    username: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
}

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegisterFormData>({
        nombre: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: UserRole.TRABAJADOR,
    });

    const registerMutation = useMutation({
        mutationFn: async (data: Omit<RegisterFormData, 'confirmPassword'>) => {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Error al registrar usuario');
            }
            return response.json();
        },
        onSuccess: () => {
            navigate('/login');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }
        const { confirmPassword, ...data } = formData;
        registerMutation.mutate(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Registro de Usuario
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ mt: 1, width: '100%' }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="nombre"
                            label="Nombre"
                            name="nombre"
                            autoComplete="name"
                            autoFocus
                            value={formData.nombre}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Usuario"
                            name="username"
                            autoComplete="username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmar Contraseña"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Rol</InputLabel>
                            <Select
                                value={formData.role}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        role: e.target.value as UserRole,
                                    }))
                                }
                            >
                                <MenuItem value={UserRole.ADMINISTRADOR}>Administrador</MenuItem>
                                <MenuItem value={UserRole.JUNTA}>Junta</MenuItem>
                                <MenuItem value={UserRole.TRABAJADOR}>Trabajador</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={registerMutation.isPending}
                        >
                            {registerMutation.isPending ? 'Registrando...' : 'Registrar'}
                        </Button>
                        {registerMutation.isError && (
                            <Typography color="error" align="center">
                                Error al registrar el usuario. Por favor, intenta nuevamente.
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default RegisterForm; 