import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Grid,
    Paper,
    FormControlLabel,
    Checkbox,
    Divider,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Avatar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CreateSocioInput, Nombre, Direccion, Banco, Contacto, Asociado, Socio } from '../../types/socio';
import RemoveIcon from '@mui/icons-material/Remove';
import { useAuthStore } from '../../stores/authStore';
import axiosInstance from '../../config/axios';
import { API_BASE_URL } from '../../config';
import { createSocio, updateSocio } from '../../services/socios';
import Swal from 'sweetalert2';

// Pasos del formulario - Reorganizados para mejor flujo
const steps = ['Datos Personales', 'Dirección y Contacto', 'Datos Económicos'];

interface CreateSocioFormProps {
    viewOnly?: boolean;
    editMode?: boolean;
}

const CreateSocioForm: React.FC<CreateSocioFormProps> = ({ viewOnly = false, editMode = false }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [activeStep, setActiveStep] = useState(0);
    const [formError, setFormError] = useState<string | null>(null);
    const [isAddMemberMode, setIsAddMemberMode] = useState(false);
    const [expandedAsociados, setExpandedAsociados] = useState<{ [key: number]: boolean }>({});
    const { token } = useAuthStore();
    const queryClient = useQueryClient();

    // Verificar autenticación al montar el componente
    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
    }, [token, navigate]);

    // Verificar si se debe ir directamente a la sección de miembros
    useEffect(() => {
        // Buscar parámetro addMember en la URL
        const searchParams = new URLSearchParams(location.search);
        const shouldAddMember = searchParams.get('addMember') === 'true';

        if (shouldAddMember && editMode) {
            // Ir directamente al paso de miembros asociados (índice 3)
            setActiveStep(3);
            // Activar el modo de solo añadir miembro
            setIsAddMemberMode(true);
        }
    }, [location.search, editMode]);

    const initialFormState: CreateSocioInput = {
        socio: '',
        nombre: {
            nombre: '',
            primerApellido: '',
            segundoApellido: ''
        },
        direccion: {
            calle: '',
            numero: '',
            piso: '',
            poblacion: '',
            cp: '',
            provincia: ''
        },
        banco: {
            iban: '',
            entidad: '',
            oficina: '',
            dc: '',
            cuenta: ''
        },
        contacto: {
            telefonos: [''],
            emails: ['']
        },
        casa: 0,
        totalSocios: 0,
        numPersonas: 0,
        adheridos: 0,
        menor3Años: 0,
        cuota: 0,
        rgpd: false,
        dni: '',
        notas: '',
        fotografia: '',
        foto: '',
        asociados: [],
        isActive: true,
        fechaNacimiento: new Date().toISOString().split('T')[0]
    };

    const [formData, setFormData] = useState<CreateSocioInput>(initialFormState);

    // Cargar datos del socio si estamos en modo edición
    const { data: socioData, isLoading: isLoadingSocio } = useQuery({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!editMode || !id) return null;

            console.log('Cargando datos del socio:', id);
            const response = await axiosInstance.get(`/socios/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('Datos del socio cargados:', response.data);
            return response.data;
        },
        enabled: editMode && !!id && !!token,
    });

    // Obtener el último número de socio
    const { data: lastSocioNumber, isLoading: isLoadingLastNumber } = useQuery({
        queryKey: ['lastSocioNumber'],
        queryFn: async () => {
            const response = await axiosInstance.get('/socios/last-number', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        },
        enabled: !editMode && !!token,
    });

    // Validar número de socio
    const validateSocioNumber = async (number: string) => {
        // Si estamos en modo edición y el número es el mismo que ya tiene el socio, retornamos true
        if (editMode && socioData && number === socioData.socio) {
            return true;
        }

        try {
            const response = await axiosInstance.get(`/socios/validate-number/${number}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.available;
        } catch (error) {
            console.error('Error validating socio number:', error);
            return false;
        }
    };

    // Mutación para crear/actualizar socio
    const mutation = useMutation({
        mutationFn: async (data: CreateSocioInput) => {
            const socioData = {
                ...data,
                nombre: {
                    nombre: data.nombre.nombre || '',
                    primerApellido: data.nombre.primerApellido || '',
                    segundoApellido: data.nombre.segundoApellido || '',
                },
                direccion: {
                    calle: data.direccion.calle || '',
                    numero: data.direccion.numero || '',
                    piso: data.direccion.piso || '',
                    poblacion: data.direccion.poblacion || '',
                    cp: data.direccion.cp || '',
                    provincia: data.direccion.provincia || '',
                },
                contacto: {
                    telefonos: data.contacto.telefonos.filter(t => t.trim() !== ''),
                    emails: data.contacto.emails.filter(e => e.trim() !== ''),
                },
                banco: data.banco ? {
                    entidad: data.banco.entidad || '',
                    oficina: data.banco.oficina || '',
                    dc: data.banco.dc || '',
                    cuenta: data.banco.cuenta || '',
                    iban: data.banco.iban || '',
                } : undefined,
                fechaNacimiento: data.fechaNacimiento || undefined,
                cuota: data.cuota || 0,
                rgpd: data.rgpd || false,
                isActive: data.isActive || false,
            };

            // Limpiar campos vacíos
            const cleanData = Object.fromEntries(
                Object.entries(socioData).filter(([_, value]) => {
                    if (value === null || value === undefined || value === '') return false;
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        return Object.values(value).some(v => v !== null && v !== undefined && v !== '');
                    }
                    return true;
                })
            );

            console.log('Datos originales del formulario:', data);
            console.log('Datos preparados antes de limpiar:', socioData);
            console.log('Datos limpios a enviar:', cleanData);

            if (editMode && id) {
                console.log('Enviando actualización al backend:', id, cleanData);
                const response = await axiosInstance.put(`/socios/${id}`, cleanData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Respuesta del backend:', response.data);
                return response.data;
            } else {
                console.log('Enviando creación al backend:', cleanData);
                const response = await axiosInstance.post('/socios', cleanData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('Respuesta del backend:', response.data);
                return response.data;
            }
        },
        onSuccess: (data) => {
            console.log('Respuesta del servidor:', data);
            Swal.fire({
                icon: 'success',
                title: id ? 'Socio actualizado correctamente' : 'Socio creado correctamente',
                showConfirmButton: false,
                timer: 1500
            });
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            navigate('/socios');
        },
        onError: (error: any) => {
            console.error('Error completo:', error);
            if (error.response?.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Sesión expirada',
                    text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    showConfirmButton: false,
                    timer: 2000
                }).then(() => {
                    window.location.href = '/login';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Error al guardar el socio'
                });
            }
        }
    });

    // Actualizar el formulario con los datos del socio cuando se cargan
    useEffect(() => {
        if (editMode && socioData) {
            setFormData({
                socio: socioData.socio,
                nombre: {
                    nombre: socioData.nombre.nombre,
                    primerApellido: socioData.nombre.primerApellido,
                    segundoApellido: socioData.nombre.segundoApellido || ''
                },
                direccion: {
                    calle: socioData.direccion.calle,
                    numero: socioData.direccion.numero,
                    piso: socioData.direccion.piso || '',
                    poblacion: socioData.direccion.poblacion,
                    cp: socioData.direccion.cp || '',
                    provincia: socioData.direccion.provincia || ''
                },
                banco: {
                    iban: socioData.banco?.iban || '',
                    entidad: socioData.banco?.entidad || '',
                    oficina: socioData.banco?.oficina || '',
                    dc: socioData.banco?.dc || '',
                    cuenta: socioData.banco?.cuenta || ''
                },
                contacto: {
                    telefonos: socioData.contacto?.telefonos || [''],
                    emails: socioData.contacto?.emails || ['']
                },
                casa: socioData.casa,
                totalSocios: socioData.totalSocios,
                numPersonas: socioData.numPersonas,
                adheridos: socioData.adheridos,
                menor3Años: socioData.menor3Años,
                cuota: socioData.cuota,
                rgpd: socioData.rgpd,
                dni: socioData.dni || '',
                notas: socioData.notas || '',
                fotografia: socioData.fotografia || '',
                foto: socioData.foto || '',
                isActive: socioData.isActive,
                fechaNacimiento: socioData.fechaNacimiento || new Date().toISOString().split('T')[0],
                asociados: []
            });
        } else if (!editMode && lastSocioNumber) {
            setFormData(prev => ({
                ...prev,
                socio: lastSocioNumber
            }));
        }
    }, [editMode, socioData, lastSocioNumber]);

    // Manejo de cambios en el número de socio
    const handleSocioNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        if (!/^AET\d{0,3}$/.test(value)) {
            return;
        }

        setFormData(prev => ({
            ...prev,
            socio: value
        } as CreateSocioInput));

        // Validar si el número está completo
        if (value.length === 6) {
            const isValid = await validateSocioNumber(value);
            if (!isValid) {
                setFormError('Este número de socio ya está en uso');
            } else {
                setFormError(null);
            }
        }
    };

    // Manejo de cambios en el formulario para campos simples
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const target = e.target as HTMLInputElement;

        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: target.checked });
        } else if (type === 'number') {
            setFormData({ ...formData, [name]: parseFloat(value) || 0 });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Manejo de carga de foto del socio
    const handleFotoSocioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Verificar el tamaño del archivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setFormError('La imagen no puede ser mayor a 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Comprimir la imagen antes de guardarla
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                    setFormData({
                        ...formData,
                        fotografia: compressedImage
                    });
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // Manejo de carga de foto de miembro asociado
    const handleFotoAsociadoChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Verificar el tamaño del archivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setFormError('La imagen no puede ser mayor a 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Comprimir la imagen antes de guardarla
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                    const asociados = [...(formData.asociados || [])];
                    asociados[index] = {
                        ...asociados[index],
                        fotografia: compressedImage
                    };
                    setFormData({ ...formData, asociados });
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // Manejo de cambios en objetos anidados (nombre, direccion, etc.)
    const handleNestedChange = (
        section: 'nombre' | 'direccion' | 'banco' | 'contacto',
        field: string,
        value: string | string[]
    ) => {
        setFormData({
            ...formData,
            [section]: {
                ...formData[section],
                [field]: value,
            },
        });
    };

    // Agregar un nuevo teléfono
    const handleAddTelefono = () => {
        const telefonos = [...(formData.contacto?.telefonos || []), ''];
        handleNestedChange('contacto', 'telefonos', telefonos);
    };

    // Agregar un nuevo correo
    const handleAddEmail = () => {
        const emails = [...(formData.contacto?.emails || []), ''];
        handleNestedChange('contacto', 'emails', emails);
    };

    // Actualizar teléfono en posición específica
    const handleTelefonoChange = (index: number, value: string) => {
        const telefonos = [...(formData.contacto?.telefonos || [])];
        telefonos[index] = value;
        handleNestedChange('contacto', 'telefonos', telefonos);
    };

    // Actualizar email en posición específica
    const handleEmailChange = (index: number, value: string) => {
        const emails = [...(formData.contacto?.emails || [])];
        emails[index] = value;
        handleNestedChange('contacto', 'emails', emails);
    };

    // Eliminar teléfono
    const handleDeleteTelefono = (index: number) => {
        const telefonos = [...(formData.contacto?.telefonos || [])];
        telefonos.splice(index, 1);
        handleNestedChange('contacto', 'telefonos', telefonos);
    };

    // Eliminar email
    const handleDeleteEmail = (index: number) => {
        const emails = [...(formData.contacto?.emails || [])];
        emails.splice(index, 1);
        handleNestedChange('contacto', 'emails', emails);
    };

    // Agregar miembro asociado
    const handleAddAsociado = () => {
        const asociados = [
            ...(formData.asociados || []),
            {
                _id: new Date().getTime().toString(), // Generamos un ID temporal
                nombre: '',
                fechaNacimiento: '',
                parentesco: '',
                fotografia: '',
                foto: ''
            },
        ];
        setFormData({ ...formData, asociados });
    };

    // Actualizar miembro asociado
    const handleAsociadoChange = (index: number, field: keyof Asociado, value: string) => {
        const asociados = [...(formData.asociados || [])];
        asociados[index] = { ...asociados[index], [field]: value };
        setFormData({ ...formData, asociados });
    };

    // Eliminar miembro asociado
    const handleDeleteAsociado = (index: number) => {
        const asociados = [...(formData.asociados || [])];
        asociados.splice(index, 1);
        setFormData({ ...formData, asociados });
    };

    // Cambiar al siguiente paso con validación
    const handleNext = async () => {
        // Validación de datos según el paso actual
        if (activeStep === 0) {
            if (!formData.rgpd) {
                setFormError('Debes aceptar el tratamiento de datos según RGPD.');
                return;
            }
            if (!formData.nombre.nombre || !formData.nombre.primerApellido) {
                setFormError('Por favor completa los campos obligatorios de nombre.');
                return;
            }
            // Validar el número de socio
            if (!formData.socio || !/^AET\d{3}$/.test(formData.socio)) {
                setFormError('El número de socio debe tener el formato AET000');
                return;
            }
            // Verificar si el número está disponible
            const isValid = await validateSocioNumber(formData.socio);
            if (!isValid) {
                setFormError('Este número de socio ya está en uso');
                return;
            }
        } else if (activeStep === 1) {
            if (!formData.direccion.calle || !formData.direccion.poblacion) {
                setFormError('Por favor completa los campos obligatorios de dirección.');
                return;
            }
            if (!formData.direccion.numero || formData.direccion.numero === '0') {
                setFormError('El número de casa debe ser mayor que cero.');
                return;
            }
            if (!formData.contacto?.telefonos?.[0]) {
                setFormError('Al menos un teléfono de contacto es obligatorio.');
                return;
            }
        } else if (activeStep === 2) {
            if (!formData.cuota || formData.cuota <= 0) {
                setFormError('La cuota debe ser mayor que cero.');
                return;
            }
        }

        setFormError(null);
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    // Volver al paso anterior
    const handleBack = () => {
        // En modo addMember no permitir ir hacia atrás
        if (isAddMemberMode) {
            return;
        }

        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    // Enviar formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await mutation.mutateAsync(formData);
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error al usuario
        }
    };

    // Volver a la lista de socios
    const handleCancel = () => {
        navigate('/socios');
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Los campos marcados con * son obligatorios
                        </Alert>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Identificador de Socio"
                                    name="socio"
                                    value={formData.socio}
                                    onChange={handleSocioNumberChange}
                                    error={!!formError}
                                    helperText={formError || "Formato: AET000"}
                                    inputProps={{
                                        maxLength: 6,
                                        pattern: "^AET\\d{3}$"
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Fecha de Nacimiento"
                                    name="fechaNacimiento"
                                    type="date"
                                    value={formData.fechaNacimiento || ''}
                                    onChange={handleInputChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Nombre"
                                    name="nombre.nombre"
                                    value={formData.nombre.nombre}
                                    onChange={(e) => handleNestedChange('nombre', 'nombre', e.target.value)}
                                    error={!!formError}
                                    helperText={formError}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Primer Apellido"
                                    name="nombre.primerApellido"
                                    value={formData.nombre.primerApellido}
                                    onChange={(e) => handleNestedChange('nombre', 'primerApellido', e.target.value)}
                                    error={!!formError}
                                    helperText={formError}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Segundo Apellido"
                                    name="nombre.segundoApellido"
                                    value={formData.nombre.segundoApellido}
                                    onChange={(e) => handleNestedChange('nombre', 'segundoApellido', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.rgpd}
                                            onChange={handleInputChange}
                                            name="rgpd"
                                            color="primary"
                                        />
                                    }
                                    label="Acepto la política de protección de datos"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                );
            case 1:
                return renderDireccionContacto();
            case 2:
                return renderDatosEconomicos();
            default:
                return 'Unknown step';
        }
    };

    // Renderizar paso 2: Dirección y Contacto
    const renderDireccionContacto = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    DIRECCIÓN
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Número de casa *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="1"
                        value={formData.direccion.numero || ''}
                        onChange={(e) => handleNestedChange('direccion', 'numero', e.target.value)}
                        type="number"
                        InputProps={{
                            inputProps: { min: 1 }
                        }}
                        required
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Calle *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Calle Ejemplo"
                        value={formData.direccion.calle}
                        onChange={(e) => handleNestedChange('direccion', 'calle', e.target.value)}
                        required
                    />
                </Grid>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Piso
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="2º A"
                        value={formData.direccion.piso}
                        onChange={(e) => handleNestedChange('direccion', 'piso', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Población *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Madrid"
                        value={formData.direccion.poblacion}
                        onChange={(e) => handleNestedChange('direccion', 'poblacion', e.target.value)}
                        required
                    />
                </Grid>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        Código Postal
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="28001"
                        value={formData.direccion.cp}
                        onChange={(e) => handleNestedChange('direccion', 'cp', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        Provincia
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Madrid"
                        value={formData.direccion.provincia}
                        onChange={(e) => handleNestedChange('direccion', 'provincia', e.target.value)}
                    />
                </Grid>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN DE CONTACTO
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Teléfonos
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    El primer teléfono es obligatorio.
                </Typography>
                {formData.contacto?.telefonos?.map((telefono, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                            fullWidth
                            placeholder="600 000 000"
                            label={index === 0 ? `Teléfono ${index + 1} *` : `Teléfono ${index + 1}`}
                            value={telefono}
                            onChange={(e) => handleTelefonoChange(index, e.target.value)}
                            sx={{ mr: 1 }}
                            required={index === 0}
                        />
                        <IconButton
                            color="error"
                            onClick={() => handleDeleteTelefono(index)}
                            disabled={formData.contacto?.telefonos?.length === 1 && index === 0}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddTelefono}
                    variant="outlined"
                    sx={{ mt: 1 }}
                >
                    Añadir teléfono
                </Button>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Correos electrónicos
                </Typography>
                {formData.contacto?.emails?.map((email, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                            fullWidth
                            placeholder="ejemplo@email.com"
                            label={`Email ${index + 1}`}
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            sx={{ mr: 1 }}
                        />
                        <IconButton
                            color="error"
                            onClick={() => handleDeleteEmail(index)}
                            disabled={formData.contacto?.emails?.length === 1 && index === 0}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                ))}
                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddEmail}
                    variant="outlined"
                    sx={{ mt: 1 }}
                >
                    Añadir correo
                </Button>
            </Grid>
        </Grid>
    );

    // Renderizar paso 3: Datos Económicos (combinando cuota y datos bancarios)
    const renderDatosEconomicos = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN ECONÓMICA
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Cuota (€) *
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="37,70"
                        name="cuota"
                        type="number"
                        value={formData.cuota}
                        onChange={handleInputChange}
                        InputProps={{
                            inputProps: { min: 0, step: 0.01 }
                        }}
                        required
                    />
                </Grid>

            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN BANCARIA
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    Esta información es opcional y se utilizará para domiciliaciones.
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', height: 20 }} />

            <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Cuenta bancaria
                </Typography>
            </Grid>

            <Box sx={{ width: '100%', height: 10 }} />

            <Grid container spacing={2}>
                <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        IBAN
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="ES00"
                        value={formData.banco?.iban || ''}
                        onChange={(e) => handleNestedChange('banco', 'iban', e.target.value)}
                    />
                </Grid>

                <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        Entidad
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000"
                        value={formData.banco?.entidad || ''}
                        onChange={(e) => handleNestedChange('banco', 'entidad', e.target.value)}
                    />
                </Grid>

                <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        Oficina
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000"
                        value={formData.banco?.oficina || ''}
                        onChange={(e) => handleNestedChange('banco', 'oficina', e.target.value)}
                    />
                </Grid>

                <Grid item xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        DC
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="00"
                        value={formData.banco?.dc || ''}
                        onChange={(e) => handleNestedChange('banco', 'dc', e.target.value)}
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                        Cuenta
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000000000"
                        value={formData.banco?.cuenta || ''}
                        onChange={(e) => handleNestedChange('banco', 'cuenta', e.target.value)}
                    />
                </Grid>
            </Grid>
        </Grid>
    );

    return (
        <Card>
            <CardContent>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={handleCancel}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ ml: 2 }}>
                            {editMode ? 'Editar Socio' : 'Nuevo Socio'}
                        </Typography>
                    </Box>

                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Box sx={{ mt: 4 }}>
                        {renderStepContent(activeStep)}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            variant="outlined"
                            onClick={handleBack}
                            disabled={activeStep === 0}
                        >
                            Atrás
                        </Button>
                        <Button
                            variant="contained"
                            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                        >
                            {activeStep === steps.length - 1 ? 'Guardar' : 'Siguiente'}
                        </Button>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default CreateSocioForm; 