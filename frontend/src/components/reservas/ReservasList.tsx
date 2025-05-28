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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
    _id?: string;
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
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const navigate = useNavigate();
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
    const [openPDF, setOpenPDF] = useState(false);
    const { token } = useAuthStore();

    // Consulta para obtener reservas
    const { data: reservasData, isLoading: isLoadingReservas } = useQuery({
        queryKey: ['reservas'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/reservas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener reservas');
            return await response.json();
        },
        enabled: !!user
    });

    // Consulta para obtener socios
    const { data: sociosData } = useQuery({
        queryKey: ['socios'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener socios');
            return await response.json();
        },
        enabled: !!user
    });

    // Consulta para obtener servicios
    const { data: serviciosData = [] } = useQuery({
        queryKey: ['servicios'],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/servicios`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) throw new Error('Error al obtener servicios');
                const data = await response.json();
                console.log('Servicios obtenidos:', data);
                return data;
            } catch (error) {
                console.error('Error al obtener servicios:', error);
                throw error;
            }
        },
        enabled: !!user
    });

    // Actualizar el estado de servicios cuando cambian los datos
    useEffect(() => {
        if (serviciosData) {
            console.log('Actualizando estado de servicios con:', serviciosData);
            setServicios(serviciosData);
        }
    }, [serviciosData]);

    // Consulta para obtener suplementos
    const { data: suplementosListData = [] } = useQuery({
        queryKey: ['suplementos'],
        queryFn: async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) throw new Error('Error al obtener suplementos');
                return await response.json();
            } catch (error) {
                console.error('Error al obtener suplementos:', error);
                throw error;
            }
        },
        enabled: !!user
    });

    // Mutación para crear/actualizar reserva
    const reservaMutation = useMutation({
        mutationFn: async (reservaData: any) => {
            const url = selectedReserva
                ? `${API_BASE_URL}/reservas/${selectedReserva._id}`
                : `${API_BASE_URL}/reservas`;

            const response = await fetch(url, {
                method: selectedReserva ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservaData)
            });

            if (!response.ok) throw new Error('Error al guardar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
            handleCloseDialog();
        },
        onError: (error: any) => {
            console.error('Error saving reserva:', error);
            alert(error.message || 'Ha ocurrido un error al procesar la reserva');
        }
    });

    // Mutación para eliminar reserva
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error('Error al eliminar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    // Mutación para liquidar reserva
    const liquidarMutation = useMutation({
        mutationFn: async (datosLiquidacion: any) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${selectedReservaLiquidacion?._id}/liquidar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosLiquidacion)
            });
            if (!response.ok) throw new Error('Error al liquidar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
            handleCloseLiquidacionDialog();
            setSnackbar({
                open: true,
                message: 'Reserva liquidada correctamente',
                severity: 'success'
            });
        },
        onError: (error: any) => {
            setSnackbar({
                open: true,
                message: error.message || 'Error al liquidar la reserva',
                severity: 'error'
            });
        }
    });

    // Mutación para cancelar reserva
    const cancelarMutation = useMutation({
        mutationFn: async (datosCancelacion: any) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${selectedReservaForCancel?._id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosCancelacion)
            });
            if (!response.ok) throw new Error('Error al cancelar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
            setOpenCancelDialog(false);
            setSelectedReservaForCancel(null);
            setSnackbar({
                open: true,
                message: cancelacionData.pendienteRevisionJunta
                    ? 'La reserva ha sido cancelada. La devolución del dinero será valorada por la Junta.'
                    : 'La reserva ha sido cancelada exitosamente',
                severity: 'success'
            });
        },
        onError: (error: any) => {
            setSnackbar({
                open: true,
                message: error.message || 'Error al cancelar la reserva',
                severity: 'error'
            });
        }
    });

    const handleOpenDialog = (reserva?: Reserva) => {
        console.log('Abriendo diálogo de reserva:', reserva ? 'edición' : 'nueva');
        if (reserva) {
            setSelectedReserva(reserva);
            // Buscar el servicio correspondiente en la lista de servicios del backend
            const servicioSeleccionado = servicios.find(s =>
                s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase()
            );

            setFormData({
                servicio: servicioSeleccionado?.id || '',
                fecha: new Date(reserva.fecha).toISOString().split('T')[0],
                socio: reserva.socio._id,
                suplementos: reserva.suplementos,
                observaciones: reserva.observaciones || '',
                montoAbonado: reserva.montoAbonado || 0,
                metodoPago: reserva.metodoPago || ''
            });
        } else {
            setSelectedReserva(null);
            const fechaInicial = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            console.log('Fecha inicial para nueva reserva:', fechaInicial);
            setFormData({
                servicio: '',
                fecha: fechaInicial,
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
            const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
            if (!servicioSeleccionado) {
                alert('Por favor, selecciona un servicio válido');
                return;
            }

            const fecha = new Date(formData.fecha);
            if (isNaN(fecha.getTime())) {
                alert('Por favor, selecciona una fecha válida');
                return;
            }

            const suplementosUnicos = formData.suplementos.reduce((acc: any[], current) => {
                const existingIndex = acc.findIndex(item => item.id === current.id);
                const suplementoInfo = suplementosList.find(s => s.id === current.id);

                if (!suplementoInfo) {
                    console.warn(`Suplemento no encontrado: ${current.id}`);
                    return acc;
                }

                if (existingIndex === -1) {
                    acc.push({
                        id: current.id,
                        nombre: suplementoInfo.nombre,
                        precio: suplementoInfo.precio,
                        cantidad: current.cantidad || 1,
                        tipo: suplementoInfo.tipo
                    });
                } else {
                    acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (current.cantidad || 1);
                }
                return acc;
            }, []);

            const reservaData = {
                fecha: fecha.toISOString(),
                tipoInstalacion: servicioSeleccionado.nombre.toUpperCase(),
                socio: formData.socio,
                usuarioCreacion: user._id,
                suplementos: suplementosUnicos,
                precio: calcularPrecioTotal(),
                observaciones: formData.observaciones,
                montoAbonado: formData.montoAbonado || 0,
                metodoPago: formData.metodoPago || ''
            };

            reservaMutation.mutate(reservaData);
        } catch (error) {
            console.error('Error preparing reserva data:', error);
            alert('Ha ocurrido un error al preparar los datos de la reserva');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
            return;
        }
        deleteMutation.mutate(id);
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean, cantidad?: number) => {
        setFormData(prev => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento) return prev;

            const suplementos = [...prev.suplementos];
            const existingIndex = suplementos.findIndex(s => s.id === suplementoId);

            if (checked) {
                // Si es un suplemento fijo y ya existe, no lo añadimos
                if (suplemento.tipo === 'fijo' && existingIndex !== -1) {
                    return prev;
                }
                // Si no existe, lo añadimos
                if (existingIndex === -1) {
                    suplementos.push({
                        id: suplementoId,
                        cantidad: suplemento.tipo === 'porHora' ? (cantidad || 1) : 1
                    });
                }
            } else {
                // Si existe, lo eliminamos
                if (existingIndex !== -1) {
                    suplementos.splice(existingIndex, 1);
                }
            }
            return { ...prev, suplementos };
        });
    };

    const handleCantidadChange = (suplementoId: string, cantidad: number) => {
        setFormData(prev => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento || suplemento.tipo !== 'porHora') return prev;

            const suplementos = prev.suplementos.map(s =>
                s.id === suplementoId ? { ...s, cantidad: Math.max(1, cantidad) } : s
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

        // Calcular precio de suplementos sin duplicados
        const suplementosPrecios = new Map();
        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: precio,
                    cantidad: cantidad,
                    tipo: suplemento.tipo
                });
            }
        });

        // Sumar los precios únicos
        suplementosPrecios.forEach(({ precio }) => {
            precioTotal += precio;
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
            montoAbonado: 0,
            metodoPago: '',
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
        return selectedReservaLiquidacion.precio;
    };

    const handleLiquidacionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservaLiquidacion) return;

        try {
            const precioTotal = selectedReservaLiquidacion.precio;
            const montoPendiente = precioTotal - (selectedReservaLiquidacion.montoAbonado || 0);

            if (liquidacionData.montoAbonado !== montoPendiente) {
                setSnackbar({
                    open: true,
                    message: `Debe abonar el monto total pendiente (${montoPendiente.toFixed(2)}€)`,
                    severity: 'error'
                });
                return;
            }

            if (!liquidacionData.metodoPago) {
                setSnackbar({
                    open: true,
                    message: 'Debe seleccionar un método de pago',
                    severity: 'error'
                });
                return;
            }

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
                observaciones: liquidacionData.observaciones,
                estado: 'COMPLETADA'
            };

            liquidarMutation.mutate(datosLiquidacion);
        } catch (error) {
            console.error('Error preparing liquidacion data:', error);
            setSnackbar({
                open: true,
                message: 'Error al preparar los datos de liquidación',
                severity: 'error'
            });
        }
    };

    const handleCancelClick = (reserva: Reserva) => {
        setSelectedReservaForCancel(reserva);
        setCancelacionData({
            motivo: 'OTRO',
            observaciones: '',
            montoDevuelto: 0,
            pendienteRevisionJunta: false
        });
        setOpenCancelDialog(true);
    };

    const handleCancelSubmit = async () => {
        if (!selectedReservaForCancel) return;

        try {
            if (cancelacionData.motivo === 'CLIMA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                if (!isSameDay(fechaReserva, fechaActual)) {
                    setSnackbar({
                        open: true,
                        message: 'Solo se puede cancelar por condiciones climáticas el mismo día de la reserva',
                        severity: 'error'
                    });
                    return;
                }
            } else if (cancelacionData.motivo === 'ANTICIPADA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

                if (diasDiferencia < 9) {
                    if (!cancelacionData.observaciones) {
                        setSnackbar({
                            open: true,
                            message: 'Debe especificar el motivo de la cancelación para que la Junta pueda valorar la devolución',
                            severity: 'error'
                        });
                        return;
                    }

                    const result = await Swal.fire({
                        title: 'Cancelación con menos de 9 días',
                        text: 'Se puede anular, pero para devolución de dinero se valorará con Junta una vez conocidos los motivos. ¿Quieres seguir adelante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'No, volver'
                    });

                    if (!result.isConfirmed) {
                        return;
                    }

                    setCancelacionData(prev => ({
                        ...prev,
                        montoDevuelto: 0,
                        observaciones: `[PENDIENTE REVISIÓN JUNTA] ${prev.observaciones}`,
                        pendienteRevisionJunta: true
                    }));
                } else {
                    if ((selectedReservaForCancel.montoAbonado || 0) > 0) {
                        if (!cancelacionData.montoDevuelto) {
                            setSnackbar({
                                open: true,
                                message: 'Debe especificar el monto a devolver',
                                severity: 'error'
                            });
                            return;
                        }

                        if (cancelacionData.montoDevuelto > (selectedReservaForCancel.montoAbonado || 0)) {
                            setSnackbar({
                                open: true,
                                message: 'El monto a devolver no puede ser mayor al monto abonado',
                                severity: 'error'
                            });
                            return;
                        }

                        const result = await Swal.fire({
                            title: 'Cancelación con más de 9 días',
                            text: `Se devolverá el dinero de la fianza (${cancelacionData.montoDevuelto}€). ¿Quieres continuar con la cancelación?`,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, continuar',
                            cancelButtonText: 'No, volver'
                        });

                        if (!result.isConfirmed) {
                            return;
                        }
                    }
                }
            }

            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar reserva',
                cancelButtonText: 'No, volver'
            });

            if (result.isConfirmed) {
                cancelarMutation.mutate(cancelacionData);
            }
        } catch (error) {
            console.error('Error preparing cancelacion data:', error);
            setSnackbar({
                open: true,
                message: 'Error al preparar los datos de cancelación',
                severity: 'error'
            });
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
        try {
            // Actualizar cada servicio individualmente
            for (const servicio of servicios) {
                if (servicio._id) {
                    // Si tiene _id, actualizar con PATCH
                    const response = await fetch(`${API_BASE_URL}/servicios/${servicio._id}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(servicio)
                    });
                    if (!response.ok) throw new Error('Error al actualizar servicio');
                } else {
                    // Si no tiene _id, crear nuevo con POST
                    const response = await fetch(`${API_BASE_URL}/servicios`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(servicio)
                    });
                    if (!response.ok) throw new Error('Error al crear servicio');
                }
            }

            // Actualizar la lista de servicios después de guardar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            setServicios(await updatedResponse.json());

            setSnackbar({
                open: true,
                message: 'Servicios guardados correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al guardar servicios:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al guardar los servicios',
                severity: 'error'
            });
        }
    };

    const handleSaveSuplementos = async (suplementos: Suplemento[]) => {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(suplementos)
            });
            if (!response.ok) throw new Error('Error al guardar suplementos');

            setSuplementosList(suplementos);
            setOpenGestionSuplementos(false);

            // Actualizar los suplementos después de guardar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener suplementos');
            setSuplementosList(await updatedResponse.json());

            setSnackbar({
                open: true,
                message: 'Suplementos guardados correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al guardar suplementos:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al guardar suplementos',
                severity: 'error'
            });
        }
    };

    const renderResumenPrecio = () => {
        const servicio = servicios.find(s => s.id === formData.servicio);
        const suplementosPrecios = new Map();

        // Calcular precios de suplementos sin duplicados
        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: precio,
                    cantidad: cantidad,
                    tipo: suplemento.tipo
                });
            }
        });

        return (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Resumen del Precio</Typography>
                {servicio && (
                    <Typography sx={{ mb: 1 }}>
                        Servicio: {servicio.precio}€
                    </Typography>
                )}
                {Array.from(suplementosPrecios.values()).map(({ nombre, precio, cantidad, tipo }, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>
                        {nombre}{tipo === 'porHora' && cantidad > 1 ? ` (${cantidad})` : ''}: {precio}€
                    </Typography>
                ))}
                <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                    Total: {calcularPrecioTotal()}€
                </Typography>
            </Box>
        );
    };

    const handleDeleteServicio = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios/${_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar servicio');
            }

            // Actualizar la lista de servicios después de eliminar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            const updatedData = await updatedResponse.json();
            setServicios(updatedData);

            setSnackbar({
                open: true,
                message: 'Servicio eliminado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al eliminar el servicio',
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
                                                    {(user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA') && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<DeleteIcon />}
                                                            onClick={() => handleDelete(reserva._id)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    )}
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
                                                            Servicio
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase())?.nombre}
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
                                                    {reserva.montoAbonado !== undefined && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Restante a Abonar
                                                            </Typography>
                                                            <Typography variant="body1" color="error.main" fontWeight="bold">
                                                                {(reserva.precio - (reserva.montoAbonado || 0)).toFixed(2)}€
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
                                                            {reserva.suplementos.reduce((acc: any[], sup) => {
                                                                const existingIndex = acc.findIndex(item => item.id === sup.id);
                                                                if (existingIndex === -1) {
                                                                    acc.push({ ...sup, cantidad: sup.cantidad || 1 });
                                                                } else {
                                                                    acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (sup.cantidad || 1);
                                                                }
                                                                return acc;
                                                            }, []).map((sup, index) => {
                                                                const suplemento = suplementosList.find(s => s.id === sup.id);
                                                                return suplemento ? (
                                                                    <Chip
                                                                        key={index}
                                                                        label={`${suplemento.nombre}${sup.cantidad > 1 ? ` (${sup.cantidad})` : ''}`}
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
                            servicio={servicios.find(s => s.nombre.toLowerCase() === selectedReservaForPDF.tipoInstalacion.toLowerCase())}
                            suplementosList={suplementosList}
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
                onDeleteServicio={handleDeleteServicio}
            />

            {/* Modal de Gestión de Suplementos */}
            <GestionSuplementos
                open={openGestionSuplementos}
                onClose={() => setOpenGestionSuplementos(false)}
                suplementos={suplementosList}
                onSaveSuplementos={handleSaveSuplementos}
            />

            {/* Modal de Nueva/Editar Reserva */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '80vh',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    pb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white'
                }}>
                    <Typography variant="h5" component="div">
                        {selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}
                    </Typography>
                    <IconButton
                        onClick={handleCloseDialog}
                        size="large"
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, p: 3 }}>
                    <Box component="form" onSubmit={handleSubmit}>
                        {/* Sección de Información Principal */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Información Principal
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha"
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.1rem',
                                                padding: '12px 14px'
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: '1.1rem'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ fontSize: '1.2rem' }}>Servicio</InputLabel>
                                        <Select
                                            value={formData.servicio}
                                            label="Servicio"
                                            onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    fontSize: '1.2rem',
                                                    padding: '11px 14px',
                                                    minHeight: '48px',
                                                    minWidth: '200px'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px'
                                                }
                                            }}
                                        >
                                            {servicios.filter(s => s.activo).map((servicio) => (
                                                <MenuItem key={servicio.id} value={servicio.id} sx={{ fontSize: '1.2rem', py: 1 }}>
                                                    {servicio.nombre} - {servicio.precio}€
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid sx={{ xs: 12 }}>
                                    <Autocomplete
                                        options={socios}
                                        getOptionLabel={(option) => `${option.nombre} ${option.apellidos} (${option.numeroSocio})`}
                                        value={socios.find(s => s._id === formData.socio) || null}
                                        onChange={(_, newValue) => setFormData({ ...formData, socio: newValue?._id || '' })}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Socio"
                                                fullWidth
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontSize: '1.2rem',
                                                        minHeight: '48px',
                                                        width: '215%'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        fontSize: '1.2rem'
                                                    },
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                        borderWidth: '2px'
                                                    },
                                                    '& .MuiAutocomplete-input': {
                                                        padding: '11px 14px'
                                                    },
                                                    '& .MuiAutocomplete-endAdornment': {
                                                        top: 'calc(50% - 14px)',
                                                        right: '14px'
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Sección de Suplementos */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Suplementos Disponibles
                            </Typography>
                            <Grid container spacing={2}>
                                {suplementosList.filter(s => s.activo).map((suplemento) => (
                                    <Grid sx={{ xs: 12, sm: 6, md: 4 }} key={suplemento.id}>
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                border: formData.suplementos.some(s => s.id === suplemento.id)
                                                    ? '2px solid'
                                                    : '1px solid',
                                                borderColor: formData.suplementos.some(s => s.id === suplemento.id)
                                                    ? 'primary.main'
                                                    : 'divider',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                            onClick={() => handleSuplementoChange(suplemento.id, !formData.suplementos.some(s => s.id === suplemento.id))}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Checkbox
                                                    checked={formData.suplementos.some(s => s.id === suplemento.id)}
                                                    onChange={(e) => handleSuplementoChange(suplemento.id, e.target.checked)}
                                                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                        {suplemento.nombre}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {suplemento.precio}€ {suplemento.tipo === 'porHora' ? '/hora' : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {suplemento.tipo === 'porHora' && formData.suplementos.some(s => s.id === suplemento.id) && (
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    label="Cantidad de horas"
                                                    value={formData.suplementos.find(s => s.id === suplemento.id)?.cantidad || 1}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleCantidadChange(suplemento.id, parseInt(e.target.value) || 1);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                        width: '100%',
                                                        mt: 1,
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '1rem',
                                                            padding: '8px 14px'
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        {/* Sección de Pago y Observaciones */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Pago y Observaciones
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Monto Abonado"
                                        value={formData.montoAbonado}
                                        onChange={(e) => setFormData({ ...formData, montoAbonado: parseFloat(e.target.value) || 0 })}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                        }}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.1rem',
                                                padding: '12px 14px'
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: '1.1rem'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ fontSize: '1.2rem' }}>Método de Pago</InputLabel>
                                        <Select
                                            value={formData.metodoPago}
                                            label="Método de Pago"
                                            onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'efectivo' | 'tarjeta' | '' })}
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    fontSize: '1.2rem',
                                                    minHeight: '48px',
                                                    minWidth: '200px'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px'
                                                }
                                            }}
                                        >
                                            <MenuItem value="efectivo" sx={{ fontSize: '1.2rem', py: 1 }}>Efectivo</MenuItem>
                                            <MenuItem value="tarjeta" sx={{ fontSize: '1.2rem', py: 1 }}>Tarjeta</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid sx={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Observaciones"
                                        value={formData.observaciones}
                                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.1rem',
                                                padding: '12px 14px'
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: '1.1rem'
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Resumen de Precio */}
                        {renderResumenPrecio()}

                        {/* Botones de Acción */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                            pt: 3
                        }}>
                            <Button
                                onClick={handleCloseDialog}
                                variant="outlined"
                                sx={{
                                    fontSize: '1.1rem',
                                    px: 3,
                                    py: 1
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    fontSize: '1.1rem',
                                    px: 3,
                                    py: 1
                                }}
                            >
                                {selectedReserva ? 'Guardar Cambios' : 'Crear Reserva'}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Modal de Liquidación */}
            <Dialog
                open={openLiquidacionDialog}
                onClose={handleCloseLiquidacionDialog}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '60vh',
                        maxHeight: '80vh'
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    pb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'primary.main',
                    color: 'white'
                }}>
                    <Typography variant="h5" component="div">
                        Liquidar Reserva
                    </Typography>
                    <IconButton
                        onClick={handleCloseLiquidacionDialog}
                        size="large"
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, p: 3 }}>
                    <Box component="form" onSubmit={handleLiquidacionSubmit}>
                        {/* Sección de Información de la Reserva */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Información de la Reserva
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Socio
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedReservaLiquidacion?.socio.nombre.nombre} {selectedReservaLiquidacion?.socio.nombre.primerApellido}
                                    </Typography>
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Servicio
                                    </Typography>
                                    <Typography variant="body1">
                                        {servicios.find(s => s.id === selectedReservaLiquidacion?.tipoInstalacion.toLowerCase())?.nombre}
                                    </Typography>
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Precio Total
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedReservaLiquidacion?.precio.toFixed(2)}€
                                    </Typography>
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Monto Pendiente
                                    </Typography>
                                    <Typography variant="body1" color="error.main" fontWeight="bold">
                                        {(selectedReservaLiquidacion?.precio || 0) - (selectedReservaLiquidacion?.montoAbonado || 0)}€
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Sección de Pago */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Información del Pago
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Monto a Abonar"
                                        value={liquidacionData.montoAbonado}
                                        onChange={(e) => {
                                            const montoPendiente = (selectedReservaLiquidacion?.precio || 0) - (selectedReservaLiquidacion?.montoAbonado || 0);
                                            const nuevoMonto = parseFloat(e.target.value) || 0;
                                            if (nuevoMonto <= montoPendiente) {
                                                setLiquidacionData({ ...liquidacionData, montoAbonado: nuevoMonto });
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                            endAdornment: (
                                                <Typography sx={{ ml: 1, fontSize: '1.1rem', color: 'text.secondary' }}>
                                                    Total pendiente: {((selectedReservaLiquidacion?.precio || 0) - (selectedReservaLiquidacion?.montoAbonado || 0)).toFixed(2)}€
                                                </Typography>
                                            )
                                        }}
                                        helperText="Debe abonar el monto total pendiente"
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                fontSize: '1.1rem',
                                                padding: '12px 14px'
                                            },
                                            '& .MuiInputLabel-root': {
                                                fontSize: '1.1rem'
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid sx={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel sx={{ fontSize: '1.2rem' }}>Método de Pago</InputLabel>
                                        <Select
                                            value={liquidacionData.metodoPago}
                                            label="Método de Pago"
                                            onChange={(e) => setLiquidacionData({ ...liquidacionData, metodoPago: e.target.value as 'efectivo' | 'tarjeta' | '' })}
                                            sx={{
                                                '& .MuiSelect-select': {
                                                    fontSize: '1.2rem',
                                                    minHeight: '48px',
                                                    minWidth: '200px'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px'
                                                }
                                            }}
                                        >
                                            <MenuItem value="efectivo" sx={{ fontSize: '1.2rem', py: 1 }}>Efectivo</MenuItem>
                                            <MenuItem value="tarjeta" sx={{ fontSize: '1.2rem', py: 1 }}>Tarjeta</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Sección de Suplementos */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Suplementos
                            </Typography>
                            <Grid container spacing={2}>
                                {suplementosList.filter(s => s.activo).map((suplemento) => (
                                    <Grid sx={{ xs: 12, sm: 6, md: 4 }} key={suplemento.id}>
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 2,
                                                border: liquidacionData.suplementos.some(s => s.id === suplemento.id)
                                                    ? '2px solid'
                                                    : '1px solid',
                                                borderColor: liquidacionData.suplementos.some(s => s.id === suplemento.id)
                                                    ? 'primary.main'
                                                    : 'divider',
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                            onClick={() => {
                                                const newSuplementos = [...liquidacionData.suplementos];
                                                const index = newSuplementos.findIndex(s => s.id === suplemento.id);
                                                if (index === -1) {
                                                    newSuplementos.push({ id: suplemento.id, cantidad: 1 });
                                                } else {
                                                    newSuplementos.splice(index, 1);
                                                }
                                                setLiquidacionData({ ...liquidacionData, suplementos: newSuplementos });
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Checkbox
                                                    checked={liquidacionData.suplementos.some(s => s.id === suplemento.id)}
                                                    onChange={(e) => {
                                                        const newSuplementos = [...liquidacionData.suplementos];
                                                        if (e.target.checked) {
                                                            newSuplementos.push({ id: suplemento.id, cantidad: 1 });
                                                        } else {
                                                            const index = newSuplementos.findIndex(s => s.id === suplemento.id);
                                                            if (index !== -1) {
                                                                newSuplementos.splice(index, 1);
                                                            }
                                                        }
                                                        setLiquidacionData({ ...liquidacionData, suplementos: newSuplementos });
                                                    }}
                                                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                        {suplemento.nombre}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {suplemento.precio}€ {suplemento.tipo === 'porHora' ? '/hora' : ''}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {suplemento.tipo === 'porHora' && liquidacionData.suplementos.some(s => s.id === suplemento.id) && (
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    label="Cantidad de horas"
                                                    value={liquidacionData.suplementos.find(s => s.id === suplemento.id)?.cantidad || 1}
                                                    onChange={(e) => {
                                                        const newSuplementos = liquidacionData.suplementos.map(s =>
                                                            s.id === suplemento.id
                                                                ? { ...s, cantidad: parseInt(e.target.value) || 1 }
                                                                : s
                                                        );
                                                        setLiquidacionData({ ...liquidacionData, suplementos: newSuplementos });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{
                                                        width: '100%',
                                                        mt: 1,
                                                        '& .MuiInputBase-input': {
                                                            fontSize: '1rem',
                                                            padding: '8px 14px'
                                                        }
                                                    }}
                                                />
                                            )}
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>

                        {/* Sección de Observaciones */}
                        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                                Observaciones
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Observaciones"
                                value={liquidacionData.observaciones}
                                onChange={(e) => setLiquidacionData({ ...liquidacionData, observaciones: e.target.value })}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontSize: '1.1rem',
                                        padding: '12px 14px'
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontSize: '1.1rem'
                                    }
                                }}
                            />
                        </Paper>

                        {/* Botones de Acción */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                            pt: 3
                        }}>
                            <Button
                                onClick={handleCloseLiquidacionDialog}
                                variant="outlined"
                                sx={{
                                    fontSize: '1.1rem',
                                    px: 3,
                                    py: 1
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    fontSize: '1.1rem',
                                    px: 3,
                                    py: 1
                                }}
                            >
                                Liquidar Reserva
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

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

            <Dialog
                open={openPDF}
                onClose={() => setOpenPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    {selectedReserva && (
                        <ReservaPDF
                            reserva={selectedReserva}
                            socio={socios.find(s => s._id === selectedReserva.socio._id)}
                            servicio={servicios.find(s => s.nombre.toLowerCase() === selectedReserva.tipoInstalacion.toLowerCase())}
                            suplementosList={suplementosList}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Cancelación */}
            <Dialog
                open={openCancelDialog}
                onClose={() => setOpenCancelDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                    pb: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: 'error.main',
                    color: 'white'
                }}>
                    <Typography variant="h5" component="div">
                        Cancelar Reserva
                    </Typography>
                    <IconButton
                        onClick={() => setOpenCancelDialog(false)}
                        size="large"
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, p: 3 }}>
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleCancelSubmit(); }}>
                        <Grid container spacing={3}>
                            <Grid xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Motivo de Cancelación</InputLabel>
                                    <Select
                                        value={cancelacionData.motivo}
                                        label="Motivo de Cancelación"
                                        onChange={(e) => setCancelacionData({ ...cancelacionData, motivo: e.target.value as 'CLIMA' | 'ANTICIPADA' | 'OTRO' })}
                                    >
                                        <MenuItem value="CLIMA">Por condiciones climáticas</MenuItem>
                                        <MenuItem value="ANTICIPADA">Cancelación anticipada</MenuItem>
                                        <MenuItem value="OTRO">Otro motivo</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            {cancelacionData.motivo === 'ANTICIPADA' && (
                                <>
                                    <Grid xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Observaciones"
                                            value={cancelacionData.observaciones}
                                            onChange={(e) => setCancelacionData({ ...cancelacionData, observaciones: e.target.value })}
                                            helperText="Especifique el motivo de la cancelación"
                                        />
                                    </Grid>
                                    {selectedReservaForCancel && (() => {
                                        const fechaReserva = new Date(selectedReservaForCancel.fecha);
                                        const fechaActual = new Date();
                                        const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

                                        if (diasDiferencia >= 9 && selectedReservaForCancel.montoAbonado) {
                                            return (
                                                <Grid xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="Monto a Devolver"
                                                        value={cancelacionData.montoDevuelto}
                                                        onChange={(e) => setCancelacionData({ ...cancelacionData, montoDevuelto: parseFloat(e.target.value) || 0 })}
                                                        InputProps={{
                                                            startAdornment: <Typography sx={{ mr: 1 }}>€</Typography>,
                                                        }}
                                                        helperText={`Monto máximo a devolver: ${selectedReservaForCancel.montoAbonado}€`}
                                                    />
                                                </Grid>
                                            );
                                        }
                                        return null;
                                    })()}
                                </>
                            )}

                            {cancelacionData.motivo === 'OTRO' && (
                                <Grid xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Observaciones"
                                        value={cancelacionData.observaciones}
                                        onChange={(e) => setCancelacionData({ ...cancelacionData, observaciones: e.target.value })}
                                    />
                                </Grid>
                            )}
                        </Grid>

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                            mt: 3,
                            pt: 2,
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                        }}>
                            <Button
                                onClick={() => setOpenCancelDialog(false)}
                                variant="outlined"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="error"
                            >
                                Confirmar Cancelación
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}; 