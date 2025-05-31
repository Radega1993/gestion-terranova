import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    CircularProgress,
    Alert,
    Container,
    IconButton,
    Tooltip
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';
import { SocioInvitacionesSelector } from './SocioInvitacionesSelector';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import { InvitacionesPDF } from './InvitacionesPDF';
import CloseIcon from '@mui/icons-material/Close';

interface Invitacion {
    _id: string;
    socio: {
        codigo: string;
        nombre: string;
    };
    fechaUso: string;
    nombreInvitado: string;
    observaciones?: string;
}

interface SocioInvitaciones {
    socio: {
        codigo: string;
        nombre: string;
    };
    ejercicio: number;
    invitacionesDisponibles: number;
    observaciones?: string;
}

interface SocioSeleccionado {
    codigo: string;
    nombreCompleto: string;
}

const InvitacionesList: React.FC = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [nombreInvitado, setNombreInvitado] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [fechaUso, setFechaUso] = useState<Date | null>(new Date());
    const [socioSeleccionado, setSocioSeleccionado] = useState<SocioSeleccionado | null>(null);
    const [cantidadAdicional, setCantidadAdicional] = useState<number>(1);
    const [motivoAdicional, setMotivoAdicional] = useState('');
    const queryClient = useQueryClient();
    const { token, user } = useAuthStore();
    const [showPDF, setShowPDF] = useState(false);
    const [pdfData, setPdfData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const isAdminOrJunta = user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA';

    // Fetch invitaciones por socio
    const { data: invitaciones, isLoading: isLoadingInvitaciones, error: errorInvitaciones } = useQuery({
        queryKey: ['invitaciones', socioSeleccionado?.codigo],
        queryFn: async () => {
            if (!socioSeleccionado?.codigo) return [];

            const response = await fetch(`${API_BASE_URL}/invitaciones?codigoSocio=${socioSeleccionado.codigo}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar las invitaciones');
            }

            return response.json();
        },
        enabled: !!socioSeleccionado?.codigo && !!token
    });

    // Fetch invitaciones disponibles del socio
    const { data: invitacionesDisponibles, isLoading: isLoadingDisponibles, error: errorDisponibles } = useQuery({
        queryKey: ['invitaciones-disponibles', socioSeleccionado?.codigo],
        queryFn: async () => {
            if (!socioSeleccionado?.codigo) return null;

            const response = await fetch(`${API_BASE_URL}/invitaciones/${socioSeleccionado.codigo}/disponibles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al cargar las invitaciones disponibles');
            }

            return response.json();
        },
        enabled: !!socioSeleccionado?.codigo && !!token
    });

    // Mutación para crear una nueva invitación
    const createInvitacion = useMutation({
        mutationFn: async (data: {
            codigoSocio: string;
            nombreInvitado: string;
            fechaUso: Date;
            observaciones?: string;
            usuarioRegistro: string;
        }) => {
            const response = await fetch(`${API_BASE_URL}/invitaciones`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    fechaUso: data.fechaUso.toISOString()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear la invitación');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitaciones'] });
            queryClient.invalidateQueries({ queryKey: ['invitaciones-disponibles'] });
            setOpenDialog(false);
            setNombreInvitado('');
            setObservaciones('');
            setFechaUso(new Date());
        },
        onError: (error: Error) => {
            console.error('Error al crear la invitación:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    });

    // Mutación para añadir invitaciones adicionales
    const addInvitaciones = useMutation({
        mutationFn: async (data: {
            codigoSocio: string;
            invitacionesDisponibles: number;
            observaciones: string;
        }) => {
            const response = await fetch(`${API_BASE_URL}/invitaciones/${data.codigoSocio}/actualizar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invitacionesDisponibles: data.invitacionesDisponibles,
                    observaciones: data.observaciones
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al actualizar las invitaciones');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitaciones-disponibles'] });
            setOpenAddDialog(false);
            setCantidadAdicional(1);
            setMotivoAdicional('');
        },
        onError: (error: Error) => {
            console.error('Error al actualizar las invitaciones:', error);
        }
    });

    const handleOpenDialog = () => {
        if (socioSeleccionado && invitacionesDisponibles?.invitacionesDisponibles > 0) {
            setOpenDialog(true);
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setNombreInvitado('');
        setObservaciones('');
        setFechaUso(new Date());
    };

    const handleCreateInvitacion = () => {
        if (socioSeleccionado && nombreInvitado && fechaUso && user?.username) {
            createInvitacion.mutate({
                codigoSocio: socioSeleccionado.codigo,
                nombreInvitado,
                fechaUso,
                observaciones,
                usuarioRegistro: user.username
            });
        }
    };

    const handlePrint = async () => {
        if (!socioSeleccionado) return;

        try {
            // Obtener invitaciones disponibles
            const responseDisponibles = await fetch(`${API_BASE_URL}/invitaciones/${socioSeleccionado.codigo}/disponibles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!responseDisponibles.ok) {
                throw new Error('Error al obtener invitaciones disponibles');
            }

            const dataDisponibles = await responseDisponibles.json();
            console.log('Datos de invitaciones disponibles:', dataDisponibles);

            // Obtener historial de invitaciones
            const responseHistorial = await fetch(`${API_BASE_URL}/invitaciones?codigoSocio=${socioSeleccionado.codigo}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!responseHistorial.ok) {
                throw new Error('Error al obtener historial de invitaciones');
            }

            const dataHistorial = await responseHistorial.json();
            console.log('Datos del historial completo:', dataHistorial);

            const ejercicio = new Date().getFullYear();
            const mes = new Date().getMonth() + 1;
            const ejercicioActual = mes < 6 ? ejercicio - 1 : ejercicio;

            // Asegurarnos de que los datos estén en el formato correcto
            const invitacionesFormateadas = Array.isArray(dataHistorial) ? dataHistorial.map((inv: any) => ({
                fechaUso: inv.fechaUso,
                nombreInvitado: inv.nombreInvitado,
                observaciones: inv.observaciones,
                usuarioRegistro: {
                    username: inv.usuarioRegistro?.username || '-'
                }
            })) : [];

            console.log('Invitaciones formateadas:', invitacionesFormateadas);

            // Crear una modificación a partir de las observaciones si existen
            const modificacionesFormateadas = [];
            if (dataDisponibles.observaciones) {
                // Extraer la cantidad de invitaciones añadidas del texto de observaciones
                const match = dataDisponibles.observaciones.match(/Añadidas (\d+) invitaciones/);
                const cantidadAñadida = match ? parseInt(match[1]) : 0;

                modificacionesFormateadas.push({
                    fecha: new Date().toISOString(),
                    invitacionesDisponibles: cantidadAñadida, // Usar la cantidad extraída
                    observaciones: dataDisponibles.observaciones,
                    usuarioActualizacion: {
                        username: user?.username || '-'
                    }
                });
            }

            console.log('Modificaciones formateadas:', modificacionesFormateadas);

            const pdfDataToSend = {
                socio: {
                    codigo: socioSeleccionado.codigo,
                    nombre: socioSeleccionado.nombreCompleto
                },
                ejercicio: ejercicioActual,
                invitacionesDisponibles: dataDisponibles.invitacionesDisponibles || 0,
                invitaciones: invitacionesFormateadas,
                modificaciones: modificacionesFormateadas
            };

            console.log('Datos finales enviados al PDF:', pdfDataToSend);
            setPdfData(pdfDataToSend);
            setShowPDF(true);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setError('Error al generar el PDF');
        }
    };

    const handleAddInvitaciones = () => {
        if (socioSeleccionado && cantidadAdicional > 0) {
            const nuevasInvitaciones = (invitacionesDisponibles?.invitacionesDisponibles || 0) + cantidadAdicional;
            addInvitaciones.mutate({
                codigoSocio: socioSeleccionado.codigo,
                invitacionesDisponibles: nuevasInvitaciones,
                observaciones: `Añadidas ${cantidadAdicional} invitaciones por ${user?.username}. Motivo: ${motivoAdicional}`
            });
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Invitaciones
            </Typography>

            {/* Selector de Socio */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={8}>
                        <SocioInvitacionesSelector
                            onSocioSeleccionado={setSocioSeleccionado}
                            value={socioSeleccionado}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleOpenDialog}
                                disabled={!socioSeleccionado || !invitacionesDisponibles?.invitacionesDisponibles || isLoadingDisponibles}
                                fullWidth
                            >
                                {isLoadingDisponibles ? 'Cargando...' : 'Registrar Invitación'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handlePrint}
                                disabled={!socioSeleccionado || isLoadingDisponibles}
                                fullWidth
                            >
                                {isLoadingDisponibles ? 'Cargando...' : 'Imprimir Resumen'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Información de Invitaciones Disponibles */}
            {socioSeleccionado && (
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Invitaciones Disponibles
                            </Typography>
                            {isAdminOrJunta && (
                                <Tooltip title="Añadir invitaciones">
                                    <span>
                                        <IconButton
                                            color="primary"
                                            onClick={() => setOpenAddDialog(true)}
                                            disabled={isLoadingDisponibles}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                        {isLoadingDisponibles ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : errorDisponibles ? (
                            <Alert severity="error">
                                {errorDisponibles instanceof Error ? errorDisponibles.message : 'Error al cargar las invitaciones disponibles'}
                            </Alert>
                        ) : invitacionesDisponibles ? (
                            <>
                                <Typography variant="body1">
                                    Socio: {socioSeleccionado.nombreCompleto} ({socioSeleccionado.codigo})
                                </Typography>
                                <Typography variant="body1">
                                    Invitaciones disponibles: {invitacionesDisponibles.invitacionesDisponibles}
                                </Typography>
                                {invitacionesDisponibles.observaciones && (
                                    <Typography variant="body2" color="text.secondary">
                                        Observaciones: {invitacionesDisponibles.observaciones}
                                    </Typography>
                                )}
                            </>
                        ) : null}
                    </CardContent>
                </Card>
            )}

            {/* Historial de Invitaciones */}
            {socioSeleccionado && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Historial de Invitaciones
                        </Typography>
                        {isLoadingInvitaciones ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : errorInvitaciones ? (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {errorInvitaciones instanceof Error ? errorInvitaciones.message : 'Error al cargar los datos'}
                            </Alert>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Fecha</TableCell>
                                            <TableCell>Invitado</TableCell>
                                            <TableCell>Observaciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {invitaciones?.map((invitacion: Invitacion) => (
                                            <TableRow key={invitacion._id}>
                                                <TableCell>
                                                    {format(new Date(invitacion.fechaUso), 'dd/MM/yyyy', { locale: es })}
                                                </TableCell>
                                                <TableCell>{invitacion.nombreInvitado}</TableCell>
                                                <TableCell>{invitacion.observaciones}</TableCell>
                                            </TableRow>
                                        ))}
                                        {(!invitaciones || invitaciones.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    No hay invitaciones registradas
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Diálogo para crear invitación */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Registrar Invitación</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha de Uso"
                                    value={fechaUso}
                                    onChange={(date) => setFechaUso(date)}
                                    slotProps={{ textField: { fullWidth: true } }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre del Invitado"
                                value={nombreInvitado}
                                onChange={(e) => setNombreInvitado(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button
                        onClick={handleCreateInvitacion}
                        variant="contained"
                        color="primary"
                        disabled={!nombreInvitado || !fechaUso}
                    >
                        Registrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para añadir invitaciones */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
                <DialogTitle>Añadir Invitaciones Adicionales</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Cantidad a añadir"
                                value={cantidadAdicional}
                                onChange={(e) => setCantidadAdicional(Math.max(1, parseInt(e.target.value) || 1))}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Motivo"
                                value={motivoAdicional}
                                onChange={(e) => setMotivoAdicional(e.target.value)}
                                multiline
                                rows={3}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
                    <Button
                        onClick={handleAddInvitaciones}
                        variant="contained"
                        color="primary"
                        disabled={!motivoAdicional || cantidadAdicional < 1}
                    >
                        Añadir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal del PDF */}
            <Dialog
                open={showPDF}
                onClose={() => setShowPDF(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    style: {
                        height: '90vh',
                        maxHeight: '90vh',
                    },
                }}
            >
                <DialogTitle>
                    Historial de Invitaciones
                    <IconButton
                        onClick={() => setShowPDF(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {pdfData && (
                        <Box sx={{ height: '100%', width: '100%' }}>
                            <InvitacionesPDF {...pdfData} />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default InvitacionesList; 