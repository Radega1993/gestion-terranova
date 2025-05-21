import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Paper,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Switch,
    Divider,
    Autocomplete,
    Grid,
    Chip,
    TableCell,
    Snackbar,
    Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings as SettingsIcon, Cancel as CancelIcon, Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { API_BASE_URL } from '../../config';
import axios, { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { ReservaPDF } from './ReservaPDF';
import { LiquidacionPDF } from './LiquidacionPDF';
import { GestionServicios } from './GestionServicios';
import { GestionSuplementos } from './GestionSuplementos';

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

interface Suplemento {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

interface Socio {
    _id: string;
    nombre: string;
    apellidos: string;
    numeroSocio: string;
    email?: string;
    telefono?: string;
    direccion?: string;
}

interface Reserva {
    _id: string;
    fecha: string;
    tipoInstalacion: string;
    socio: {
        _id: string;
        nombre: {
            nombre: string;
            primerApellido: string;
            segundoApellido?: string;
        };
    };
    usuarioCreacion: {
        _id: string;
        username: string;
    };
    suplementos: {
        id: string;
        cantidad?: number;
        precio?: number;
    }[];
    precio: number;
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'LISTA_ESPERA';
    confirmadoPor?: {
        _id: string;
        username: string;
    };
    fechaConfirmacion?: string;
    motivoCancelacion?: string;
    observaciones?: string;
    montoAbonado?: number;
    metodoPago?: 'efectivo' | 'tarjeta' | '';
}

interface FormData {
    fecha: string;
    servicio: string;
    socio: string;
    suplementos: { id: string; cantidad?: number }[];
    observaciones: string;
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
}

interface LiquidacionData {
    suplementos: { id: string; cantidad?: number }[];
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
    observaciones: string;
}

interface CancelacionData {
    motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO';
    observaciones?: string;
    montoDevuelto?: number;
    pendienteRevisionJunta?: boolean;
}

const suplementos: Suplemento[] = [
    { id: 'aire', nombre: 'Aire acondicionado / Calefacción', precio: 10, tipo: 'fijo', activo: true },
    { id: 'exclusividad', nombre: 'Suplemento Exclusividad', precio: 25, tipo: 'fijo', activo: true },
    { id: 'horasExtras', nombre: 'Horas Extras', precio: 10, tipo: 'porHora', activo: true },
];

const serviciosIniciales: Servicio[] = [
    { id: 'piscina', nombre: 'Piscina', precio: 50, color: '#2196f3', colorConObservaciones: '#1565c0', activo: true },
    { id: 'bbq', nombre: 'Zona BBQ', precio: 30, color: '#f44336', colorConObservaciones: '#c62828', activo: true },
    { id: 'salon', nombre: 'Salón Comunal', precio: 100, color: '#4caf50', colorConObservaciones: '#2e7d32', activo: true },
];

const StyledCalendar = styled(DateCalendar)(({ theme }) => ({
    '& .MuiPickersDay-root.Mui-selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    },
}));

const ReservaIndicator = styled(Box)(({ color }: { color: string }) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    margin: '0 2px',
}));

interface ReservasListProps {
    // ... existing code ...
}

export const ReservasList: React.FC<ReservasListProps> = () => {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [suplementosList, setSuplementosList] = useState<Suplemento[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openServiciosDialog, setOpenServiciosDialog] = useState(false);
    const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [formData, setFormData] = useState<FormData>({
        fecha: new Date().toISOString().split('T')[0],
        servicio: '',
        socio: '',
        suplementos: [],
        observaciones: '',
        montoAbonado: 0,
        metodoPago: ''
    });
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const [searchSocio, setSearchSocio] = useState('');
    const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
    const [openLiquidacionDialog, setOpenLiquidacionDialog] = useState(false);
    const [selectedReservaLiquidacion, setSelectedReservaLiquidacion] = useState<Reserva | null>(null);
    const [liquidacionData, setLiquidacionData] = useState<LiquidacionData>({
        suplementos: [],
        montoAbonado: 0,
        metodoPago: '',
        observaciones: ''
    });
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [selectedReservaForCancel, setSelectedReservaForCancel] = useState<Reserva | null>(null);
    const [cancelacionData, setCancelacionData] = useState<CancelacionData>({
        motivo: 'OTRO',
        observaciones: '',
        montoDevuelto: 0
    });
    const [showReservaPDF, setShowReservaPDF] = useState(false);
    const [showLiquidacionPDF, setShowLiquidacionPDF] = useState(false);
    const [selectedReservaForPDF, setSelectedReservaForPDF] = useState<any>(null);
    const [selectedLiquidacionData, setSelectedLiquidacionData] = useState<any>(null);
    const [openGestionServicios, setOpenGestionServicios] = useState(false);
    const [openGestionSuplementos, setOpenGestionSuplementos] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        if (token && !user) {
            console.log('Token presente pero usuario no encontrado, redirigiendo a login...');
            navigate('/login');
            return;
        }

        if (!token) {
            console.log('No hay token, redirigiendo a login...');
            navigate('/login');
            return;
        }

        fetchReservas();
        fetchSocios();
        fetchServicios();
        fetchSuplementos();
    }, [token, user]);

    const fetchSocios = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data || [];

            if (!Array.isArray(data)) {
                console.error('La respuesta de socios no es un array:', data);
                setSocios([]);
                return;
            }

            const sociosFormateados = data.map((socio: any) => {
                const nombreCompleto = socio.nombre || {};
                const nombre = nombreCompleto.nombre || '';
                const apellidos = [nombreCompleto.primerApellido, nombreCompleto.segundoApellido]
                    .filter(Boolean)
                    .join(' ');

                return {
                    _id: socio._id || '',
                    nombre: nombre.trim(),
                    apellidos: apellidos.trim(),
                    numeroSocio: socio.socio || ''
                };
            }).filter((socio: Socio) => socio.nombre || socio.apellidos || socio.numeroSocio);

            setSocios(sociosFormateados);
        } catch (error) {
            console.error('Error fetching socios:', error);
            setSocios([]);
        }
    };

    const fetchReservas = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reservas`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data || [];
            if (!Array.isArray(data)) {
                console.error('La respuesta de reservas no es un array:', data);
                setReservas([]);
                return;
            }
            setReservas(data);
        } catch (error) {
            console.error('Error fetching reservas:', error);
            setReservas([]);
        }
    };

    const fetchServicios = async () => {
        try {
            console.log('Fetching servicios...');
            const response = await axios.get(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data || [];
            if (!Array.isArray(data)) {
                console.error('La respuesta de servicios no es un array:', data);
                setServicios([]);
                return;
            }
            console.log('Servicios recibidos:', data);
            setServicios(data);
        } catch (error) {
            console.error('Error fetching servicios:', error);
            setServicios([]);
        }
    };

    const fetchSuplementos = async () => {
        try {
            console.log('Fetching suplementos...');
            const response = await axios.get(`${API_BASE_URL}/servicios/suplementos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = response.data || [];
            if (!Array.isArray(data)) {
                console.error('La respuesta de suplementos no es un array:', data);
                setSuplementosList([]);
                return;
            }
            console.log('Suplementos recibidos:', data);
            setSuplementosList(data);
        } catch (error) {
            console.error('Error fetching suplementos:', error);
            setSuplementosList([]);
        }
    };

    const handleOpenDialog = (reserva?: Reserva) => {
        if (reserva) {
            setSelectedReserva(reserva);
            setFormData({
                servicio: reserva.tipoInstalacion,
                fecha: new Date(reserva.fecha).toISOString().split('T')[0],
                socio: reserva.socio._id,
                suplementos: reserva.suplementos,
                observaciones: reserva.observaciones || '',
                montoAbonado: reserva.montoAbonado || 0,
                metodoPago: reserva.metodoPago || ''
            });
        } else {
            setSelectedReserva(null);
            setFormData({
                servicio: '',
                fecha: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                socio: '',
                suplementos: [],
                observaciones: '',
                montoAbonado: 0,
                metodoPago: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReserva(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            alert('Debes iniciar sesión para crear una reserva');
            return;
        }

        try {
            const url = selectedReserva
                ? `${API_BASE_URL}/reservas/${selectedReserva._id}`
                : `${API_BASE_URL}/reservas`;
            const method = selectedReserva ? 'PATCH' : 'POST';

            // Mapear el servicio seleccionado al tipo de instalación requerido
            const tipoInstalacionMap: { [key: string]: string } = {
                'piscina': 'PISCINA',
                'bbq': 'SALON',
                'salon': 'SALON'
            };

            const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
            if (!servicioSeleccionado) {
                alert('Por favor, selecciona un servicio válido');
                return;
            }

            // Formatear la fecha para el backend
            const fecha = new Date(formData.fecha);
            if (isNaN(fecha.getTime())) {
                alert('Por favor, selecciona una fecha válida');
                return;
            }

            const reservaData = {
                fecha: fecha.toISOString(),
                tipoInstalacion: tipoInstalacionMap[formData.servicio] || 'SALON',
                socio: formData.socio,
                usuarioCreacion: user._id,
                suplementos: formData.suplementos.map(sup => ({
                    id: sup.id,
                    cantidad: sup.cantidad
                })),
                precio: calcularPrecioTotal(),
                observaciones: formData.observaciones,
                montoAbonado: formData.montoAbonado,
                metodoPago: formData.metodoPago
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservaData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Mostrar el mensaje de error como información
                alert(data.message || 'No se pudo procesar la reserva');
                return;
            }

            await fetchReservas();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving reserva:', error);
            alert('Ha ocurrido un error al procesar la reserva. Por favor, inténtalo de nuevo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchReservas();
        } catch (error) {
            console.error('Error deleting reserva:', error);
        }
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean, cantidad?: number) => {
        setFormData(prev => {
            const suplementos = [...prev.suplementos];
            if (checked) {
                suplementos.push({ id: suplementoId, cantidad });
            } else {
                const index = suplementos.findIndex(s => s.id === suplementoId);
                if (index !== -1) {
                    suplementos.splice(index, 1);
                }
            }
            return { ...prev, suplementos };
        });
    };

    const handleCantidadChange = (suplementoId: string, cantidad: number) => {
        setFormData(prev => {
            const suplementos = prev.suplementos.map(s =>
                s.id === suplementoId ? { ...s, cantidad } : s
            );
            return { ...prev, suplementos };
        });
    };

    const calcularPrecioTotal = () => {
        let precioTotal = 0;
        const servicio = servicios.find(s => s.id === formData.servicio);
        if (servicio) {
            precioTotal += servicio.precio;
        }

        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                if (suplemento.tipo === 'fijo') {
                    precioTotal += suplemento.precio;
                } else if (suplemento.tipo === 'porHora' && sup.cantidad) {
                    precioTotal += suplemento.precio * sup.cantidad;
                }
            }
        });

        return precioTotal;
    };

    const getReservasForDate = (date: Date) => {
        return reservas.filter(reserva =>
            isSameDay(parseISO(reserva.fecha), date)
        );
    };

    const getReservaColor = (reserva: Reserva) => {
        const servicio = servicios.find(s => s.id === reserva.tipoInstalacion.toLowerCase());
        if (!servicio) return '#000';

        // Si la reserva está cancelada
        if (reserva.estado === 'CANCELADA') {
            return '#9e9e9e'; // Gris para canceladas
        }

        // Si la reserva está completada y pagada
        if (reserva.estado === 'COMPLETADA' && reserva.montoAbonado === reserva.precio) {
            return '#2e7d32'; // Verde oscuro
        }

        // Si está en lista de espera
        if (reserva.estado === 'LISTA_ESPERA') {
            return '#ff9800'; // Naranja
        }

        // Si tiene observaciones
        if (reserva.observaciones) {
            return servicio.colorConObservaciones;
        }

        return servicio.color;
    };

    const renderDayContent = (day: Date) => {
        const reservasDelDia = getReservasForDate(day);
        if (reservasDelDia.length === 0) return null;

        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                {reservasDelDia.map((reserva, index) => (
                    <ReservaIndicator
                        key={index}
                        color={getReservaColor(reserva)}
                        title={`${servicios.find(s => s.id === reserva.tipoInstalacion.toLowerCase())?.nombre}: ${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido} ${reserva.socio.nombre.segundoApellido || ''}`}
                    />
                ))}
            </Box>
        );
    };

    const handleOpenLiquidacionDialog = (reserva: Reserva) => {
        setSelectedReservaLiquidacion(reserva);
        setLiquidacionData({
            suplementos: reserva.suplementos,
            montoAbonado: reserva.montoAbonado || 0,
            metodoPago: reserva.metodoPago || '',
            observaciones: ''
        });
        setOpenLiquidacionDialog(true);
    };

    const handleCloseLiquidacionDialog = () => {
        setOpenLiquidacionDialog(false);
        setSelectedReservaLiquidacion(null);
        setLiquidacionData({
            suplementos: [],
            montoAbonado: 0,
            metodoPago: '',
            observaciones: ''
        });
    };

    const calcularPrecioTotalLiquidacion = () => {
        if (!selectedReservaLiquidacion) return 0;

        const servicio = servicios.find(s => s.id === selectedReservaLiquidacion.tipoInstalacion.toLowerCase());
        if (!servicio) return 0;

        let precioTotal = servicio.precio;
        liquidacionData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                if (suplemento.activo) {
                    precioTotal += suplemento.precio;
                }
            }
        });
        return precioTotal;
    };

    const handleLiquidacionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservaLiquidacion) return;

        const montoPendiente = calcularPrecioTotalLiquidacion() - (selectedReservaLiquidacion.montoAbonado || 0);

        if (liquidacionData.montoAbonado > montoPendiente) {
            alert(`El monto abonado no puede ser mayor al monto pendiente (${montoPendiente.toFixed(2)}€)`);
            return;
        }

        try {
            const precioTotal = calcularPrecioTotalLiquidacion();
            const datosLiquidacion = {
                suplementos: liquidacionData.suplementos,
                pagos: [
                    {
                        monto: selectedReservaLiquidacion.montoAbonado || 0,
                        metodoPago: selectedReservaLiquidacion.metodoPago || '',
                        fecha: selectedReservaLiquidacion.fecha
                    },
                    {
                        monto: liquidacionData.montoAbonado,
                        metodoPago: liquidacionData.metodoPago,
                        fecha: new Date().toISOString()
                    }
                ],
                observaciones: liquidacionData.observaciones
            };

            const response = await fetch(`${API_BASE_URL}/reservas/${selectedReservaLiquidacion._id}/liquidar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(datosLiquidacion),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Error al liquidar la reserva');
                return;
            }

            await fetchReservas();
            handleCloseLiquidacionDialog();
        } catch (error) {
            console.error('Error al liquidar la reserva:', error);
            alert('Error al liquidar la reserva. Por favor, inténtalo de nuevo.');
        }
    };

    const handleCancelClick = (reserva: Reserva) => {
        setSelectedReservaForCancel(reserva);
        setCancelacionData({
            motivo: 'OTRO',
            observaciones: '',
            montoDevuelto: 0
        });
        setOpenCancelDialog(true);
    };

    const handleCancelSubmit = async () => {
        if (!selectedReservaForCancel) return;

        try {
            // Validaciones según el motivo
            if (cancelacionData.motivo === 'CLIMA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                if (!isSameDay(fechaReserva, fechaActual)) {
                    setOpenCancelDialog(false);
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Solo se puede cancelar por condiciones climáticas el mismo día de la reserva',
                        customClass: {
                            container: 'swal-over-modal'
                        }
                    });
                    setOpenCancelDialog(true);
                    return;
                }
            } else if (cancelacionData.motivo === 'ANTICIPADA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

                if (diasDiferencia < 9) {
                    // Caso de menos de 9 días
                    if (!cancelacionData.observaciones) {
                        setOpenCancelDialog(false);
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Debe especificar el motivo de la cancelación para que la Junta pueda valorar la devolución',
                            customClass: {
                                container: 'swal-over-modal'
                            }
                        });
                        setOpenCancelDialog(true);
                        return;
                    }

                    setOpenCancelDialog(false);
                    const result = await Swal.fire({
                        title: 'Cancelación con menos de 9 días',
                        text: 'Se puede anular, pero para devolución de dinero se valorará con Junta una vez conocidos los motivos. ¿Quieres seguir adelante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'No, volver',
                        customClass: {
                            container: 'swal-over-modal'
                        }
                    });

                    if (!result.isConfirmed) {
                        setOpenCancelDialog(true);
                        return;
                    }

                    // Si confirma, no permitimos especificar monto a devolver y marcamos como pendiente de revisión
                    setCancelacionData(prev => ({
                        ...prev,
                        montoDevuelto: 0,
                        observaciones: `[PENDIENTE REVISIÓN JUNTA] ${prev.observaciones}`,
                        pendienteRevisionJunta: true
                    }));
                } else {
                    // Caso de más de 9 días
                    if ((selectedReservaForCancel.montoAbonado || 0) > 0) {
                        if (!cancelacionData.montoDevuelto) {
                            setOpenCancelDialog(false);
                            await Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Debe especificar el monto a devolver',
                                customClass: {
                                    container: 'swal-over-modal'
                                }
                            });
                            setOpenCancelDialog(true);
                            return;
                        }

                        setOpenCancelDialog(false);
                        const result = await Swal.fire({
                            title: 'Cancelación con más de 9 días',
                            text: `Se devolverá el dinero de la fianza (${cancelacionData.montoDevuelto}€). ¿Quieres continuar con la cancelación?`,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, continuar',
                            cancelButtonText: 'No, volver',
                            customClass: {
                                container: 'swal-over-modal'
                            }
                        });

                        if (!result.isConfirmed) {
                            setOpenCancelDialog(true);
                            return;
                        }
                    }
                }
            }

            // Confirmación final antes de proceder
            setOpenCancelDialog(false);
            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar reserva',
                cancelButtonText: 'No, volver',
                customClass: {
                    container: 'swal-over-modal'
                }
            });

            if (result.isConfirmed) {
                const response = await axios.patch(`/reservas/${selectedReservaForCancel._id}/cancelar`, cancelacionData);
                if (response.data) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Reserva cancelada',
                        text: cancelacionData.pendienteRevisionJunta
                            ? 'La reserva ha sido cancelada. La devolución del dinero será valorada por la Junta.'
                            : 'La reserva ha sido cancelada exitosamente',
                        customClass: {
                            container: 'swal-over-modal'
                        }
                    });
                    setReservas(reservas.map(r =>
                        r._id === selectedReservaForCancel._id ? response.data : r
                    ));
                    setSelectedReservaForCancel(null);
                }
            } else {
                setOpenCancelDialog(true);
            }
        } catch (error: any) {
            console.error('Error al cancelar la reserva:', error);
            setOpenCancelDialog(false);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Error al cancelar la reserva',
                customClass: {
                    container: 'swal-over-modal'
                }
            });
            setOpenCancelDialog(true);
        }
    };

    const handlePrintReserva = (reserva: any) => {
        setSelectedReservaForPDF(reserva);
        setShowReservaPDF(true);
    };

    const handlePrintLiquidacion = (reserva: any, liquidacionData: any) => {
        setSelectedReservaForPDF(reserva);
        setSelectedLiquidacionData(liquidacionData);
        setShowLiquidacionPDF(true);
    };

    const handleSaveServicios = async (servicios: Servicio[]) => {
        console.log('Guardando servicios:', servicios);
        try {
            for (const servicio of servicios) {
                try {
                    if (servicio.id) {
                        // Si tiene ID, intentar actualizar
                        console.log('Actualizando servicio:', servicio);
                        await axios.patch(`${API_BASE_URL}/servicios/${servicio.id}`, servicio, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                    } else {
                        // Si no tiene ID, crear como nuevo
                        console.log('Creando nuevo servicio:', servicio);
                        await axios.post(`${API_BASE_URL}/servicios`, servicio, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                    }
                } catch (error) {
                    if (error instanceof AxiosError && error.response?.status === 404) {
                        // Si no existe, crear como nuevo
                        console.log('Servicio no encontrado, creando como nuevo:', servicio);
                        await axios.post(`${API_BASE_URL}/servicios`, servicio, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                    } else {
                        throw error;
                    }
                }
            }
            // Recargar servicios después de guardar
            await fetchServicios();
            setSnackbar({
                open: true,
                message: 'Servicios guardados correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error saving servicios:', error);
            setSnackbar({
                open: true,
                message: 'Error al guardar los servicios',
                severity: 'error'
            });
        }
    };

    const handleSaveSuplementos = async (suplementos: Suplemento[]) => {
        try {
            console.log('Guardando suplementos:', suplementos);
            const updatedSuplementos = [...suplementosList]; // Copiar la lista actual
            let hasChanges = false;

            for (const suplemento of suplementos) {
                try {
                    // Buscar si el suplemento ya existe en la lista actual por _id
                    const existingSuplemento = suplementosList.find(s => s._id === suplemento._id);

                    if (existingSuplemento) {
                        // Verificar si realmente hay cambios
                        const hasRealChanges =
                            existingSuplemento.nombre !== suplemento.nombre ||
                            existingSuplemento.precio !== suplemento.precio ||
                            existingSuplemento.tipo !== suplemento.tipo ||
                            existingSuplemento.activo !== suplemento.activo;

                        if (hasRealChanges) {
                            // Es un suplemento existente con cambios, actualizarlo
                            console.log('Actualizando suplemento existente:', {
                                id: existingSuplemento._id,
                                cambios: {
                                    nombre: suplemento.nombre,
                                    precio: suplemento.precio,
                                    tipo: suplemento.tipo,
                                    activo: suplemento.activo
                                }
                            });

                            const response = await axios.patch(`${API_BASE_URL}/servicios/suplementos/${existingSuplemento._id}`, {
                                nombre: suplemento.nombre,
                                precio: suplemento.precio,
                                tipo: suplemento.tipo,
                                activo: suplemento.activo
                            }, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            console.log('Suplemento actualizado:', response.data);

                            // Actualizar en la lista local
                            const index = updatedSuplementos.findIndex(s => s._id === suplemento._id);
                            if (index !== -1) {
                                updatedSuplementos[index] = response.data;
                                hasChanges = true;
                            }
                        } else {
                            console.log('No hay cambios reales en el suplemento:', suplemento.nombre);
                        }
                    } else {
                        // Es un suplemento nuevo, crearlo
                        console.log('Creando nuevo suplemento:', suplemento);
                        const response = await axios.post(`${API_BASE_URL}/servicios/suplementos`, {
                            id: suplemento.id,
                            nombre: suplemento.nombre,
                            precio: suplemento.precio,
                            tipo: suplemento.tipo,
                            activo: suplemento.activo
                        }, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        console.log('Suplemento creado:', response.data);
                        updatedSuplementos.push(response.data);
                        hasChanges = true;
                    }
                } catch (error: any) {
                    console.error('Error al guardar suplemento:', error);
                    if (error.response?.data?.message) {
                        alert(`Error al guardar suplemento ${suplemento.nombre}: ${error.response.data.message}`);
                    } else {
                        alert(`Error al guardar suplemento ${suplemento.nombre}: ${error.message}`);
                    }
                }
            }

            // Solo actualizar el estado y recargar si hubo cambios
            if (hasChanges) {
                setSuplementosList(updatedSuplementos);
                await fetchSuplementos(); // Recargar los suplementos del backend
                setSnackbar({
                    open: true,
                    message: 'Suplementos guardados correctamente',
                    severity: 'success'
                });
            } else {
                console.log('No hubo cambios que guardar');
            }
        } catch (error: any) {
            console.error('Error al guardar suplementos:', error);
            setSnackbar({
                open: true,
                message: 'Error al guardar suplementos: ' + error.message,
                severity: 'error'
            });
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Reservas
                </Typography>
                <Box>
                    {user && user.role === 'ADMINISTRADOR' && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => setOpenGestionServicios(true)}
                                sx={{ mr: 2 }}
                            >
                                Gestionar Servicios
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => setOpenGestionSuplementos(true)}
                                sx={{ mr: 2 }}
                            >
                                Gestionar Suplementos
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nueva Reserva
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '33%' } }}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <StyledCalendar
                                value={selectedDate}
                                onChange={(newDate) => setSelectedDate(newDate)}
                                slots={{
                                    day: (props) => (
                                        <Box>
                                            <PickersDay {...props} />
                                            {renderDayContent(props.day as Date)}
                                        </Box>
                                    )
                                }}
                            />
                        </LocalizationProvider>
                    </Paper>
                    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Leyenda
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {servicios.filter(s => s.activo).map((servicio) => (
                                    <Box key={servicio.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.color,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {servicio.nombre}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.colorConObservaciones,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {servicio.nombre} (con observaciones)
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#ff9800',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Lista de espera
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#2e7d32',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Completada y pagada
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#9e9e9e',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Cancelada
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ width: { xs: '100%', md: '67%' } }}>
                    {selectedDate && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Reservas para {format(selectedDate, 'PPP', { locale: es })}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {getReservasForDate(selectedDate).map((reserva) => (
                                    <Card key={reserva._id} sx={{
                                        borderLeft: 4,
                                        borderColor: getReservaColor(reserva)
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">
                                                    {servicios.find(s => s.id === reserva.tipoInstalacion.toLowerCase())?.nombre}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {isSameDay(new Date(), parseISO(reserva.fecha)) &&
                                                        reserva.estado !== 'COMPLETADA' && (
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => handleOpenLiquidacionDialog(reserva)}
                                                            >
                                                                Liquidar
                                                            </Button>
                                                        )}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleOpenDialog(reserva)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDelete(reserva._id)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                    {reserva.estado !== 'COMPLETADA' && reserva.estado !== 'CANCELADA' && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => handleCancelClick(reserva)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<PrintIcon />}
                                                        onClick={() => handlePrintReserva(reserva)}
                                                    >
                                                        Imprimir Reserva
                                                    </Button>
                                                    {reserva.estado === 'COMPLETADA' && (
                                                        <Button
                                                            variant="outlined"
                                                            color="success"
                                                            startIcon={<PrintIcon />}
                                                            onClick={() => handlePrintLiquidacion(reserva, {
                                                                montoAbonado: reserva.montoAbonado,
                                                                metodoPago: reserva.metodoPago,
                                                                suplementos: reserva.suplementos,
                                                                observaciones: reserva.observaciones
                                                            })}
                                                        >
                                                            Imprimir Liquidación
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Socio
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {reserva.socio.nombre.nombre} {reserva.socio.nombre.primerApellido} {reserva.socio.nombre.segundoApellido || ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Fecha y Hora
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {format(parseISO(reserva.fecha), 'PPP', { locale: es })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Estado
                                                        </Typography>
                                                        <Chip
                                                            label={reserva.estado}
                                                            color={
                                                                reserva.estado === 'COMPLETADA' ? 'success' :
                                                                    reserva.estado === 'CANCELADA' ? 'error' :
                                                                        reserva.estado === 'LISTA_ESPERA' ? 'warning' :
                                                                            'primary'
                                                            }
                                                            size="small"
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Precio Total
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {reserva.precio.toFixed(2)}€
                                                        </Typography>
                                                    </Box>
                                                    {reserva.montoAbonado !== undefined && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Monto Abonado
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {reserva.montoAbonado.toFixed(2)}€
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {reserva.metodoPago && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Método de Pago
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {reserva.metodoPago.charAt(0).toUpperCase() + reserva.metodoPago.slice(1)}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                {reserva.suplementos && reserva.suplementos.length > 0 && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Suplementos
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            {reserva.suplementos.map((sup, index) => {
                                                                const suplemento = suplementosList.find(s => s.id === sup.id);
                                                                return suplemento ? (
                                                                    <Chip
                                                                        key={index}
                                                                        label={`${suplemento.nombre}${sup.cantidad ? ` (${sup.cantidad})` : ''}`}
                                                                        size="small"
                                                                    />
                                                                ) : null;
                                                            })}
                                                        </Box>
                                                    </Box>
                                                )}
                                                {reserva.observaciones && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Observaciones
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {reserva.observaciones}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Modal para PDF de Reserva */}
            <Dialog
                open={showReservaPDF}
                onClose={() => setShowReservaPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Comprobante de Reserva
                    <IconButton
                        onClick={() => setShowReservaPDF(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedReservaForPDF && (
                        <ReservaPDF
                            reserva={selectedReservaForPDF}
                            socio={socios.find(s => s._id === selectedReservaForPDF.socio._id)}
                            servicio={servicios.find(s => s.id === selectedReservaForPDF.tipoInstalacion.toLowerCase())}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal para PDF de Liquidación */}
            <Dialog
                open={showLiquidacionPDF}
                onClose={() => setShowLiquidacionPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Comprobante de Liquidación
                    <IconButton
                        onClick={() => setShowLiquidacionPDF(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedReservaForPDF && selectedLiquidacionData && (
                        <LiquidacionPDF
                            reserva={selectedReservaForPDF}
                            socio={socios.find(s => s._id === selectedReservaForPDF.socio._id)}
                            servicio={servicios.find(s => s.id === selectedReservaForPDF.tipoInstalacion.toLowerCase())}
                            liquidacionData={selectedLiquidacionData}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Gestión de Servicios */}
            <GestionServicios
                open={openGestionServicios}
                onClose={() => setOpenGestionServicios(false)}
                servicios={servicios}
                onSaveServicios={handleSaveServicios}
            />

            {/* Modal de Gestión de Suplementos */}
            <GestionSuplementos
                open={openGestionSuplementos}
                onClose={() => setOpenGestionSuplementos(false)}
                suplementos={suplementosList}
                onSaveSuplementos={handleSaveSuplementos}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity as 'success' | 'error'}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}; 