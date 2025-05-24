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
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { CreateSocioInput, Nombre, Direccion, Banco, Contacto, Asociado, Socio } from '../../types/socio';
import RemoveIcon from '@mui/icons-material/Remove';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../config/axios';

// Pasos del formulario - Reorganizados para mejor flujo
const steps = ['Datos Personales', 'Dirección y Contacto', 'Datos Económicos', 'Miembros Asociados'];

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
    const { token, checkAuth } = useAuth();

    // Verificar autenticación al montar el componente
    useEffect(() => {
        if (!checkAuth()) {
            return;
        }
    }, [checkAuth]);

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

    // Estado inicial del formulario
    const [formData, setFormData] = useState<CreateSocioInput>({
        rgpd: false,
        casa: 1,
        totalSocios: 1,
        numPersonas: 1,
        adheridos: 0,
        menor3Años: 0,
        cuota: 0,
        nombre: {
            nombre: '',
            primerApellido: '',
            segundoApellido: '',
        },
        direccion: {
            calle: '',
            numero: '1',
            piso: '',
            poblacion: '',
            cp: '',
            provincia: '',
        },
        banco: {
            iban: '',
            entidad: '',
            oficina: '',
            dc: '',
            cuenta: '',
        },
        contacto: {
            telefonos: [''],
            emails: [''],
        },
        asociados: [],
        especiales: [],
        notas: '',
        fotografia: '',
    });

    // Cargar datos del socio si estamos en modo edición
    const { data: socioData, isLoading: isLoadingSocio } = useQuery({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!editMode || !id) return null;

            console.log('Cargando datos del socio:', id);
            const response = await axiosInstance.get(`/socios/${id}`);
            console.log('Datos del socio cargados:', response.data);
            return response.data;
        },
        enabled: editMode && !!id && !!token,
    });

    // Actualizar el formulario con los datos del socio cuando se cargan
    useEffect(() => {
        if (editMode && socioData) {
            const socio = socioData as Socio;

            // Normalizar los datos del socio al formato del formulario
            const formattedData: CreateSocioInput = {
                rgpd: true, // Asumimos que ya aceptó RGPD
                casa: socio.casa || 1,
                totalSocios: socio.totalSocios || 1,
                numPersonas: socio.numPersonas || 1,
                adheridos: socio.adheridos || 0,
                menor3Años: socio.menor3Años || 0,
                cuota: socio.cuota || 0,
                dni: socio.dni || '',
                socio: socio.socio || '',
                notas: socio.notas || '',
                nombre: {
                    nombre: socio.nombre?.nombre || '',
                    primerApellido: socio.nombre?.primerApellido || '',
                    segundoApellido: socio.nombre?.segundoApellido || '',
                },
                direccion: {
                    calle: socio.direccion?.calle || '',
                    numero: socio.direccion?.numero || '1',
                    piso: socio.direccion?.piso || '',
                    poblacion: socio.direccion?.poblacion || '',
                    cp: socio.direccion?.cp || '',
                    provincia: socio.direccion?.provincia || '',
                },
                banco: {
                    iban: socio.banco?.iban || '',
                    entidad: socio.banco?.entidad || '',
                    oficina: socio.banco?.oficina || '',
                    dc: socio.banco?.dc || '',
                    cuenta: socio.banco?.cuenta || '',
                },
                contacto: {
                    telefonos: socio.contacto?.telefonos?.length
                        ? [...socio.contacto.telefonos]
                        : [''],
                    emails: socio.contacto?.emails?.length
                        ? [...socio.contacto.emails]
                        : [''],
                },
                asociados: socio.asociados?.length
                    ? [...socio.asociados]
                    : [],
                especiales: socio.especiales?.length
                    ? [...socio.especiales]
                    : [],
                fotografia: socio.fotografia || '',
            };

            setFormData(formattedData);
        }
    }, [editMode, socioData]);

    // Mutación para crear/actualizar socio
    const socioMutation = useMutation({
        mutationFn: async (data: CreateSocioInput) => {
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            if (editMode && id) {
                console.log('Actualizando socio:', id, data);
                const response = await axiosInstance.put(`/socios/${id}`, data);
                return response.data;
            } else {
                console.log('Creando socio:', data);
                const response = await axiosInstance.post('/socios', data);
                return response.data;
            }
        },
        onSuccess: (data) => {
            console.log(editMode ? 'Socio actualizado exitosamente:' : 'Socio creado exitosamente:', data);
            navigate('/socios');
        },
        onError: (error: AxiosError) => {
            console.error(editMode ? 'Error al actualizar socio:' : 'Error al crear socio:', error);
            if (error.response?.status === 401) {
                setFormError('Sesión expirada. Por favor, vuelve a iniciar sesión.');
                navigate('/login');
            } else {
                setFormError(`Error al ${editMode ? 'actualizar' : 'crear'} socio. Por favor intenta nuevamente.`);
            }
        },
    });

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
            { nombre: '', fechaNacimiento: '' },
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
    const handleNext = () => {
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
            const formData = new FormData(e.target as HTMLFormElement);
            const socioData = {
                // ... existing form data ...
            };

            if (id) {
                // Actualizar socio existente
                const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(socioData)
                });

                if (!response.ok) {
                    throw new Error('Error al actualizar el socio');
                }

                // Si hay una nueva foto, actualizarla por separado
                const fotoFile = formData.get('foto') as File;
                if (fotoFile && fotoFile.size > 0) {
                    const fotoFormData = new FormData();
                    fotoFormData.append('foto', fotoFile);

                    const fotoResponse = await fetch(`${API_BASE_URL}/socios/${id}/foto`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: fotoFormData
                    });

                    if (!fotoResponse.ok) {
                        throw new Error('Error al actualizar la foto');
                    }
                }

                navigate('/socios');
            } else {
                // Crear nuevo socio
                const response = await fetch(`${API_BASE_URL}/socios`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(socioData)
                });

                if (!response.ok) {
                    throw new Error('Error al crear el socio');
                }

                navigate('/socios');
            }
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error al usuario
        }
    };

    // Volver a la lista de socios
    const handleCancel = () => {
        navigate('/socios');
    };

    useEffect(() => {
        // Calcular automáticamente el número de adheridos basado en los miembros especiales
        if (formData.especiales && formData.especiales.length > 0) {
            setFormData({
                ...formData,
                adheridos: formData.especiales.length
            });
        }
    }, [formData.especiales]);

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Los campos marcados con * son obligatorios
                        </Alert>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={formData.fotografia}
                                        sx={{ width: 120, height: 120 }}
                                    />
                                    {!editMode && (
                                        <>
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="foto-socio"
                                                type="file"
                                                onChange={handleFotoSocioChange}
                                            />
                                            <label htmlFor="foto-socio">
                                                <IconButton
                                                    color="primary"
                                                    component="span"
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        bgcolor: 'background.paper'
                                                    }}
                                                >
                                                    <PhotoCamera />
                                                </IconButton>
                                            </label>
                                        </>
                                    )}
                                </Box>
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
            case 3:
                return renderMiembrosAsociados();
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
                        value={formData.direccion.numero}
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

    const renderMiembrosAsociados = () => {
        const toggleAsociadoExpand = (index: number) => {
            setExpandedAsociados(prev => ({
                ...prev,
                [index]: !prev[index]
            }));
        };

        return (
            <Grid container spacing={3}>
                <Grid>
                    <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                        MIEMBROS ASOCIADOS
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Añade los miembros de la unidad familiar además del socio principal.
                    </Typography>
                </Grid>

                {formData.asociados && formData.asociados.length > 0 ? (
                    formData.asociados.map((asociado, index) => (
                        <Grid key={index}>
                            <Paper elevation={1} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                                <Grid container spacing={2}>
                                    <Grid sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box sx={{ position: 'relative', mr: 2 }}>
                                                <Avatar
                                                    src={asociado.fotografia}
                                                    sx={{ width: 60, height: 60 }}
                                                />
                                                <input
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    id={`foto-asociado-${index}`}
                                                    type="file"
                                                    onChange={(e) => handleFotoAsociadoChange(index, e)}
                                                />
                                                <label htmlFor={`foto-asociado-${index}`}>
                                                    <IconButton
                                                        color="primary"
                                                        component="span"
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            right: 0,
                                                            bgcolor: 'background.paper'
                                                        }}
                                                    >
                                                        <PhotoCamera />
                                                    </IconButton>
                                                </label>
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Miembro {index + 1}: {asociado.nombre || 'Sin nombre'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                color="info"
                                                size="small"
                                                onClick={() => toggleAsociadoExpand(index)}
                                                sx={{ mr: 1 }}
                                            >
                                                {expandedAsociados[index] ? <RemoveIcon /> : <AddIcon />}
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteAsociado(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </Grid>

                                    {expandedAsociados[index] ? (
                                        <>
                                            <Grid>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Nombre completo *
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Nombre y apellidos"
                                                    value={asociado.nombre}
                                                    onChange={(e) => handleAsociadoChange(index, 'nombre', e.target.value)}
                                                    required
                                                />
                                            </Grid>

                                            <Grid>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Fecha de nacimiento
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    value={asociado.fechaNacimiento || ''}
                                                    onChange={(e) => handleAsociadoChange(index, 'fechaNacimiento', e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                        </>
                                    ) : (
                                        <Grid>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                                                {asociado.fechaNacimiento && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Fecha de nacimiento: {new Date(asociado.fechaNacimiento).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                    Haz clic en el botón + para editar los detalles
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>
                    ))
                ) : (
                    <Grid>
                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            No hay miembros asociados. Añade nuevos miembros usando el botón de abajo.
                        </Typography>
                    </Grid>
                )}

                <Grid>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddAsociado}
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 1 }}
                    >
                        Añadir miembro
                    </Button>
                </Grid>
            </Grid>
        );
    };

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