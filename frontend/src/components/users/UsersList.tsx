import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';
import { User, UserRole } from '../../types/user';

const UsersList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: UserRole.TRABAJADOR,
    });
    const { token } = useAuthStore();

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar usuarios');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setSelectedUser(user);
            setFormData({
                username: user.username,
                password: '',
                role: user.role,
            });
        } else {
            setSelectedUser(null);
            setFormData({
                username: '',
                password: '',
                role: UserRole.TRABAJADOR,
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
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = selectedUser
                ? `${API_BASE_URL}/users/${selectedUser._id}`
                : `${API_BASE_URL}/users`;

            const method = selectedUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Error al guardar usuario');
            }

            handleCloseDialog();
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar usuario');
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al eliminar usuario');
            }

            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar usuario');
        }
    };

    if (loading) {
        return <Typography>Cargando...</Typography>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Usuarios
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenDialog()}
                sx={{ mb: 2 }}
            >
                Nuevo Usuario
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleOpenDialog(user)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(user._id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Usuario"
                        type="text"
                        fullWidth
                        value={formData.username}
                        onChange={(e) =>
                            setFormData({ ...formData, username: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Contraseña"
                        type="password"
                        fullWidth
                        value={formData.password}
                        onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                        }
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Rol"
                        fullWidth
                        value={formData.role}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                role: e.target.value as UserRole,
                            })
                        }
                        SelectProps={{
                            native: true,
                        }}
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
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default UsersList; 