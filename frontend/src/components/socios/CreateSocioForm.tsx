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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CreateSocioInput, Nombre, Direccion, Banco, Contacto, Asociado, Socio } from '../../types/socio';
import RemoveIcon from '@mui/icons-material/Remove';

// Componentes personalizados para solucionar los errores de TypeScript con Grid
const GridItem = (props: any) => <Grid item component="div" {...props} />;
const GridContainer = (props: any) => <Grid container component="div" {...props} />;

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

    // Obtener el token
    const token = localStorage.getItem('token') ||
        localStorage.getItem('gestion-terranova') ||
        localStorage.getItem('access_token');

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
    });

    // Cargar datos del socio si estamos en modo edición
    const { data: socioData, isLoading: isLoadingSocio } = useQuery({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!editMode || !id) return null;

            console.log('Cargando datos del socio:', id);
            const response = await axios.get(`http://localhost:3000/socios/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
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
            };

            setFormData(formattedData);
        }
    }, [editMode, socioData]);

    // Mutación para crear/actualizar socio
    const socioMutation = useMutation({
        mutationFn: async (data: CreateSocioInput) => {
            if (editMode && id) {
                console.log('Actualizando socio:', id, data);
                const response = await axios.put(`http://localhost:3000/socios/${id}`, data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return response.data;
            } else {
                console.log('Creando socio:', data);
                const response = await axios.post('http://localhost:3000/socios', data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return response.data;
            }
        },
        onSuccess: (data) => {
            console.log(editMode ? 'Socio actualizado exitosamente:' : 'Socio creado exitosamente:', data);
            navigate('/socios');
        },
        onError: (error) => {
            console.error(editMode ? 'Error al actualizar socio:' : 'Error al crear socio:', error);
            setFormError(`Error al ${editMode ? 'actualizar' : 'crear'} socio. Por favor intenta nuevamente.`);
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

    // Agregar miembro especial
    const handleAddEspecial = () => {
        const especiales = [
            ...(formData.especiales || []),
            { nombre: '', fechaNacimiento: '' },
        ];
        setFormData({ ...formData, especiales });
    };

    // Actualizar miembro especial
    const handleEspecialChange = (index: number, field: keyof Asociado, value: string) => {
        const especiales = [...(formData.especiales || [])];
        especiales[index] = { ...especiales[index], [field]: value };
        setFormData({ ...formData, especiales });
    };

    // Eliminar miembro especial
    const handleDeleteEspecial = (index: number) => {
        const especiales = [...(formData.especiales || [])];
        especiales.splice(index, 1);
        setFormData({ ...formData, especiales });
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
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar datos obligatorios
        if (!formData.rgpd) {
            setFormError('Debes aceptar el tratamiento de datos según RGPD.');
            setActiveStep(0);
            return;
        }

        if (!formData.nombre.nombre || !formData.nombre.primerApellido) {
            setFormError('Por favor completa los campos obligatorios de nombre.');
            setActiveStep(0);
            return;
        }

        if (!formData.direccion.calle || !formData.direccion.poblacion) {
            setFormError('Por favor completa los campos obligatorios de dirección.');
            setActiveStep(1);
            return;
        }

        if (!formData.direccion.numero || formData.direccion.numero === '0') {
            setFormError('El número de casa debe ser mayor que cero.');
            setActiveStep(1);
            return;
        }

        if (!formData.contacto?.telefonos?.[0]) {
            setFormError('Al menos un teléfono de contacto es obligatorio.');
            setActiveStep(1);
            return;
        }

        if (!formData.cuota || formData.cuota <= 0) {
            setFormError('La cuota debe ser mayor que cero.');
            setActiveStep(2);
            return;
        }

        // Actualizar total de miembros
        const totalMiembros = (formData.asociados?.length || 0) + 1; // +1 por el socio principal
        const socioData = {
            ...formData,
            casa: parseInt(formData.direccion.numero) || 1,
            numPersonas: totalMiembros,
            totalSocios: totalMiembros,
        };

        // Enviar datos
        socioMutation.mutate(socioData);
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

    // Función para renderizar el paso activo del formulario
    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Los campos marcados con * son obligatorios.
                        </Alert>

                        <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                            RGPD
                        </Typography>

                        <GridItem xs={12}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.rgpd}
                                        onChange={handleInputChange}
                                        name="rgpd"
                                        color="primary"
                                    />
                                }
                                label="Acepto el tratamiento de datos según RGPD *"
                            />
                        </GridItem>

                        <Box sx={{ width: '100%', height: 20 }} />

                        <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                            DATOS PERSONALES
                        </Typography>

                        <Box sx={{ width: '100%', height: 20 }} />

                        <Grid container spacing={2}>
                            <GridItem xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Nombre *"
                                    name="nombre.nombre"
                                    value={formData.nombre.nombre}
                                    onChange={(e) => handleNestedChange('nombre', 'nombre', e.target.value)}
                                    variant="outlined"
                                    required
                                />
                            </GridItem>
                            <GridItem xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Primer Apellido *"
                                    name="nombre.primerApellido"
                                    value={formData.nombre.primerApellido}
                                    onChange={(e) => handleNestedChange('nombre', 'primerApellido', e.target.value)}
                                    variant="outlined"
                                    required
                                />
                            </GridItem>
                            <GridItem xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label="Segundo Apellido"
                                    name="nombre.segundoApellido"
                                    value={formData.nombre.segundoApellido}
                                    onChange={(e) => handleNestedChange('nombre', 'segundoApellido', e.target.value)}
                                    variant="outlined"
                                />
                            </GridItem>
                        </Grid>

                        <Box sx={{ width: '100%', height: 20 }} />

                        <Grid container spacing={2}>
                            <GridItem xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="DNI/NIE"
                                    name="dni"
                                    value={formData.dni || ''}
                                    onChange={(e) => handleInputChange(e)}
                                    variant="outlined"
                                />
                            </GridItem>
                            <GridItem xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Menores de 3 años"
                                    name="menor3Años"
                                    type="number"
                                    value={formData.menor3Años}
                                    onChange={(e) => handleInputChange(e)}
                                    variant="outlined"
                                    InputProps={{ inputProps: { min: 0 } }}
                                />
                            </GridItem>
                        </Grid>


                    </>
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
            <GridItem xs={12}>
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    DIRECCIÓN
                </Typography>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem container spacing={2}>
                <GridItem xs={12} sm={6}>
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
                </GridItem>

                <GridItem xs={12} sm={6}>
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
                </GridItem>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem container spacing={2}>
                <GridItem xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                        Piso
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="2º A"
                        value={formData.direccion.piso}
                        onChange={(e) => handleNestedChange('direccion', 'piso', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={12} sm={6}>
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
                </GridItem>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem container spacing={2}>
                <GridItem xs={12} sm={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        Código Postal
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="28001"
                        value={formData.direccion.cp}
                        onChange={(e) => handleNestedChange('direccion', 'cp', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={12} sm={3}>
                    <Typography variant="subtitle2" gutterBottom>
                        Provincia
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="Madrid"
                        value={formData.direccion.provincia}
                        onChange={(e) => handleNestedChange('direccion', 'provincia', e.target.value)}
                    />
                </GridItem>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN DE CONTACTO
                </Typography>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem xs={12}>
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
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem xs={12}>
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
            </GridItem>
        </Grid>
    );

    // Renderizar paso 3: Datos Económicos (combinando cuota y datos bancarios)
    const renderDatosEconomicos = () => (
        <Grid container spacing={3}>
            <GridItem xs={12}>
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN ECONÓMICA
                </Typography>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem container spacing={2}>
                <GridItem xs={12} sm={6}>
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
                </GridItem>

            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                    INFORMACIÓN BANCARIA
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                    Esta información es opcional y se utilizará para domiciliaciones.
                </Typography>
            </GridItem>

            <Box sx={{ width: '100%', height: 20 }} />

            <GridItem xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Cuenta bancaria
                </Typography>
            </GridItem>

            <Box sx={{ width: '100%', height: 10 }} />

            <GridItem container spacing={2}>
                <GridItem xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        IBAN
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="ES00"
                        value={formData.banco?.iban || ''}
                        onChange={(e) => handleNestedChange('banco', 'iban', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        Entidad
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000"
                        value={formData.banco?.entidad || ''}
                        onChange={(e) => handleNestedChange('banco', 'entidad', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        Oficina
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000"
                        value={formData.banco?.oficina || ''}
                        onChange={(e) => handleNestedChange('banco', 'oficina', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={6} md={2}>
                    <Typography variant="subtitle2" gutterBottom>
                        DC
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="00"
                        value={formData.banco?.dc || ''}
                        onChange={(e) => handleNestedChange('banco', 'dc', e.target.value)}
                    />
                </GridItem>

                <GridItem xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                        Cuenta
                    </Typography>
                    <TextField
                        fullWidth
                        placeholder="0000000000"
                        value={formData.banco?.cuenta || ''}
                        onChange={(e) => handleNestedChange('banco', 'cuenta', e.target.value)}
                    />
                </GridItem>
            </GridItem>
        </Grid>
    );

    // Renderizar paso 4: Miembros Asociados
    const renderMiembrosAsociados = () => {
        // Estado local para controlar qué miembros están expandidos
        const [expandedAsociados, setExpandedAsociados] = useState<{ [key: number]: boolean }>({});
        const [expandedEspeciales, setExpandedEspeciales] = useState<{ [key: number]: boolean }>({});

        // Función para alternar la expansión de un miembro
        const toggleAsociadoExpand = (index: number) => {
            setExpandedAsociados(prev => ({
                ...prev,
                [index]: !prev[index]
            }));
        };

        // Función para alternar la expansión de un miembro especial
        const toggleEspecialExpand = (index: number) => {
            setExpandedEspeciales(prev => ({
                ...prev,
                [index]: !prev[index]
            }));
        };

        return (
            <Grid container spacing={3}>
                <GridItem xs={12}>
                    <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                        MIEMBROS ASOCIADOS
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Añade los miembros de la unidad familiar además del socio principal.
                    </Typography>
                </GridItem>

                {formData.asociados && formData.asociados.length > 0 ? (
                    formData.asociados.map((asociado, index) => (
                        <GridItem xs={12} key={index}>
                            <Paper elevation={1} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
                                <Grid container spacing={2}>
                                    <GridItem xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Miembro {index + 1}: {asociado.nombre || 'Sin nombre'}
                                        </Typography>
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
                                    </GridItem>

                                    {expandedAsociados[index] ? (
                                        <>
                                            <GridItem xs={12}>
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
                                            </GridItem>

                                            <GridItem xs={12}>
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
                                            </GridItem>
                                        </>
                                    ) : (
                                        <GridItem xs={12}>
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
                                        </GridItem>
                                    )}
                                </Grid>
                            </Paper>
                        </GridItem>
                    ))
                ) : (
                    <GridItem xs={12}>
                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            No hay miembros asociados. Añade nuevos miembros usando el botón de abajo.
                        </Typography>
                    </GridItem>
                )}

                <GridItem xs={12}>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddAsociado}
                        variant="outlined"
                        color="primary"
                        sx={{ mt: 1 }}
                    >
                        Añadir miembro
                    </Button>
                </GridItem>

                <GridItem xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ bgcolor: 'primary.light', p: 1, color: 'white', borderRadius: 1 }}>
                        MIEMBROS ESPECIALES
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Añade otros miembros que no forman parte de la unidad familiar principal.
                    </Typography>
                </GridItem>

                {formData.especiales && formData.especiales.length > 0 ? (
                    formData.especiales.map((especial, index) => (
                        <GridItem xs={12} key={index}>
                            <Paper elevation={1} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
                                <Grid container spacing={2}>
                                    <GridItem xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Miembro especial {index + 1}: {especial.nombre || 'Sin nombre'}
                                        </Typography>
                                        <Box>
                                            <IconButton
                                                color="info"
                                                size="small"
                                                onClick={() => toggleEspecialExpand(index)}
                                                sx={{ mr: 1 }}
                                            >
                                                {expandedEspeciales[index] ? <RemoveIcon /> : <AddIcon />}
                                            </IconButton>
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteEspecial(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </GridItem>

                                    {expandedEspeciales[index] ? (
                                        <>
                                            <GridItem xs={12}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Nombre completo *
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    placeholder="Nombre y apellidos"
                                                    value={especial.nombre}
                                                    onChange={(e) => handleEspecialChange(index, 'nombre', e.target.value)}
                                                    required
                                                />
                                            </GridItem>

                                            <GridItem xs={12}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Fecha de nacimiento
                                                </Typography>
                                                <TextField
                                                    fullWidth
                                                    type="date"
                                                    value={especial.fechaNacimiento || ''}
                                                    onChange={(e) => handleEspecialChange(index, 'fechaNacimiento', e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </GridItem>
                                        </>
                                    ) : (
                                        <GridItem xs={12}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
                                                {especial.fechaNacimiento && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        Fecha de nacimiento: {new Date(especial.fechaNacimiento).toLocaleDateString()}
                                                    </Typography>
                                                )}
                                                <Typography variant="body2" color="info.main" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                    Haz clic en el botón + para editar los detalles
                                                </Typography>
                                            </Box>
                                        </GridItem>
                                    )}
                                </Grid>
                            </Paper>
                        </GridItem>
                    ))
                ) : (
                    <GridItem xs={12}>
                        <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            No hay miembros especiales. Añade nuevos miembros usando el botón de abajo.
                        </Typography>
                    </GridItem>
                )}

                <GridItem xs={12}>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddEspecial}
                        variant="outlined"
                        color="secondary"
                        sx={{ mt: 1 }}
                    >
                        Añadir miembro especial
                    </Button>
                </GridItem>
            </Grid>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={handleCancel}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" sx={{ ml: 2 }}>
                    {editMode ? 'Editar Socio' : 'Crear Nuevo Socio'}
                </Typography>
            </Box>

            {formError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {formError}
                </Alert>
            )}

            {isLoadingSocio ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Cargando datos del socio...</Typography>
                </Box>
            ) : (
                <>
                    <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    <Paper elevation={3} sx={{ p: 3 }}>
                        <form onSubmit={handleSubmit}>
                            {renderStepContent(activeStep)}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={activeStep === 0 ? handleCancel : handleBack}
                                    disabled={isAddMemberMode}
                                >
                                    {activeStep === 0 ? 'Cancelar' : 'Anterior'}
                                </Button>
                                <Box>
                                    {activeStep === steps.length - 1 ? (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            type="submit"
                                            disabled={socioMutation.isPending}
                                        >
                                            {socioMutation.isPending ? (
                                                <>
                                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                                    Guardando...
                                                </>
                                            ) : (
                                                editMode ? 'Guardar Cambios' : 'Guardar Socio'
                                            )}
                                        </Button>
                                    ) : (
                                        <Button variant="contained" onClick={handleNext}>
                                            Siguiente
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </form>
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default CreateSocioForm; 