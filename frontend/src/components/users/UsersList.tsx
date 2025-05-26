import React, { useState, useEffect } from 'react';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';
import { User, UserRole } from '../../types/user';

interface FormData {
    username: string;
    password: string;
    role: UserRole;
    nombre: string;
    apellidos: string;
}

const UsersList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        role: UserRole.TRABAJADOR,
        nombre: '',
        apellidos: '',
    });
    const { token } = useAuthStore();

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener usuarios');
            }
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener usuarios');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                username: user.username,
                password: '',
                role: user.role,
                nombre: user.nombre,
                apellidos: user.apellidos || '',
            });
        } else {
            setSelectedUser(null);
            setFormData({
                username: '',
                password: '',
                role: UserRole.TRABAJADOR,
                nombre: '',
                apellidos: '',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedUser(null);
        setFormData({
            username: '',
            password: '',
            role: UserRole.TRABAJADOR,
            nombre: '',
            apellidos: '',
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData: Partial<FormData> = { ...formData };

            // Solo incluir password si se ha proporcionado uno
            if (!userData.password) {
                const { password, ...userDataWithoutPassword } = userData;
                Object.assign(userData, userDataWithoutPassword);
            }

            const url = selectedUser
                ? `${API_BASE_URL}/users/${selectedUser._id}`
                : `${API_BASE_URL}/users/register`;

            const method = selectedUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar usuario');
            }

            handleCloseDialog();
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar usuario');
        }
    };

    const handleToggleActive = async (userId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-active`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error('Error al cambiar el estado del usuario');
            }

            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cambiar el estado del usuario');
        }
    };

    return (
        <Container>
            <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog()}
                style={{ marginBottom: '1rem' }}
            >
                Nuevo Usuario
            </Button>

            {error && (
                <Alert severity="error" style={{ marginBottom: '1rem' }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Apellidos</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user._id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.nombre}</TableCell>
                                <TableCell>{user.apellidos}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(user)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleToggleActive(user._id)}
                                        color={user.activo ? "success" : "error"}
                                        size="small"
                                    >
                                        {user.activo ? <CheckCircleIcon /> : <BlockIcon />}
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            margin="dense"
                            label="Usuario"
                            type="text"
                            fullWidth
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                        <TextField
                            margin="dense"
                            label="Nombre"
                            type="text"
                            fullWidth
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            margin="dense"
                            label="Apellidos"
                            type="text"
                            fullWidth
                            value={formData.apellidos}
                            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        />
                        <TextField
                            margin="dense"
                            label="Contraseña"
                            type="password"
                            fullWidth
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!selectedUser}
                            helperText={selectedUser ? "Dejar en blanco para mantener la contraseña actual" : ""}
                        />
                        <TextField
                            select
                            margin="dense"
                            label="Rol"
                            fullWidth
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            required
                        >
                            {Object.values(UserRole).map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </TextField>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedUser ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default UsersList; 