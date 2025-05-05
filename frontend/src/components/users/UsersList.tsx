import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Box,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, UserRole } from '../../types/user';

const UsersList: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        nombre: '',
        username: '',
        role: UserRole.TRABAJADOR,
        isActive: true,
    });
    const [passwordForm, setPasswordForm] = useState({
        password: '',
        confirmPassword: '',
    });
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [userForm, setUserForm] = useState({
        nombre: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: UserRole.TRABAJADOR,
    });

    // Obtener el token (ahora confiamos en que ProtectedRoute ya lo validó)
    const token = localStorage.getItem('token') ||
        localStorage.getItem('gestion-terranova') ||
        localStorage.getItem('access_token');

    // Manejo seguro del token para obtener el rol del usuario
    let currentUserRole = UserRole.TRABAJADOR;
    try {
        if (token) {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            currentUserRole = decoded.role;
        }
    } catch (error) {
        console.error('Error decodificando token:', error);
    }

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            try {
                const response = await axios.get('http://localhost:3000/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return response.data;
            } catch (error) {
                console.error('UsersList - Error fetching users:', error);
                throw error;
            }
        },
    });

    const createUserMutation = useMutation({
        mutationFn: async (newUser: any) => {
            const response = await axios.post('http://localhost:3000/users/register', newUser, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            // Forzar la recarga inmediata
            queryClient.refetchQueries({ queryKey: ['users'] });
            setOpenCreateDialog(false);
            setUserForm({
                nombre: '',
                username: '',
                password: '',
                confirmPassword: '',
                role: UserRole.TRABAJADOR,
            });
        },
        onError: (error) => {
            console.error('Error creando usuario:', error);
        },
    });

    const updateUserMutation = useMutation({
        mutationFn: async (data: Partial<User>) => {
            const response = await axios.put(
                `http://localhost:3000/users/${selectedUser?._id}`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditDialogOpen(false);
        },
    });

    const updatePasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            const response = await axios.put(
                `http://localhost:3000/users/${selectedUser?._id}/password`,
                { password },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setPasswordDialogOpen(false);
        },
    });

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            nombre: user.nombre,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
        });
        setEditDialogOpen(true);
    };

    const handlePasswordClick = (user: User) => {
        setSelectedUser(user);
        setPasswordForm({ password: '', confirmPassword: '' });
        setPasswordDialogOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUserMutation.mutate(editForm);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.password === passwordForm.confirmPassword) {
            updatePasswordMutation.mutate(passwordForm.password);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userForm.password === userForm.confirmPassword) {
            const userData = {
                nombre: userForm.nombre,
                username: userForm.username,
                password: userForm.password,
                role: userForm.role,
            };
            createUserMutation.mutate(userData);
        }
    };

    const availableRoles = (() => {
        switch (currentUserRole) {
            case UserRole.ADMINISTRADOR:
                return Object.values(UserRole);
            case UserRole.JUNTA:
                return [UserRole.JUNTA, UserRole.TRABAJADOR];
            default:
                return [UserRole.TRABAJADOR];
        }
    })();

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Cargando usuarios...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    Error al cargar los usuarios: {(error as any).message}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Gestión de Usuarios</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenCreateDialog(true)}
                    disabled={currentUserRole === UserRole.TRABAJADOR}
                >
                    Crear Usuario
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users?.map((user: User) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.nombre}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>{user.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleEditClick(user)}>Editar</Button>
                                    <Button onClick={() => handlePasswordClick(user)}>Cambiar Contraseña</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Diálogo para crear usuario */}
            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <form onSubmit={handleCreateSubmit}>
                    <DialogContent>
                        <TextField
                            label="Nombre"
                            value={userForm.nombre}
                            onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Usuario"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Contraseña"
                            type="password"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Confirmar Contraseña"
                            type="password"
                            value={userForm.confirmPassword}
                            onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                            fullWidth
                            margin="normal"
                            required
                            error={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''}
                            helperText={
                                userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''
                                    ? 'Las contraseñas no coinciden'
                                    : ''
                            }
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Rol</InputLabel>
                            <Select
                                value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                                label="Rol"
                                required
                            >
                                {availableRoles.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreateDialog(false)}>Cancelar</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={userForm.password !== userForm.confirmPassword}
                        >
                            Crear
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Diálogo para editar usuario */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Editar Usuario</DialogTitle>
                <form onSubmit={handleEditSubmit}>
                    <DialogContent>
                        <TextField
                            label="Nombre"
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Usuario"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Rol</InputLabel>
                            <Select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                                label="Rol"
                            >
                                {availableRoles.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editForm.isActive}
                                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                />
                            }
                            label="Activo"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Guardar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Diálogo para cambiar contraseña */}
            <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <form onSubmit={handlePasswordSubmit}>
                    <DialogContent>
                        <TextField
                            label="Nueva Contraseña"
                            type="password"
                            value={passwordForm.password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Confirmar Contraseña"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            fullWidth
                            margin="normal"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={passwordForm.password !== passwordForm.confirmPassword}
                        >
                            Guardar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default UsersList; 