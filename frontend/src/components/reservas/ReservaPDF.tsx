import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { configuracionService } from '../../services/configuracion';
import { useAuthStore } from '../../stores/authStore';

const styles = StyleSheet.create({
    page: {
        padding: 0,
        fontSize: 12,
    },
    // Estilos para la primera página (reserva duplicada)
    contenedorPagina: {
        flexDirection: 'column',
        height: '100%',
    },
    mitadPagina: {
        height: 420, // Aproximadamente la mitad de A4 (297mm * 2.83 = 840 puntos, mitad = 420)
        padding: 15,
        paddingTop: 10,
        paddingBottom: 10,
    },
    lineaDivisoria: {
        height: 1,
        borderTop: '1px dashed #000',
        marginLeft: 20,
        marginRight: 20,
    },
    header: {
        marginBottom: 15,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 15,
    },
    section: {
        margin: 5,
        padding: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: '40%',
        fontWeight: 'bold',
        fontSize: 10,
    },
    value: {
        width: '60%',
        fontSize: 10,
    },
    suplementoRow: {
        flexDirection: 'row',
        marginBottom: 3,
        marginLeft: 15,
    },
    suplementoLabel: {
        width: '40%',
        fontSize: 9,
    },
    suplementoValue: {
        width: '60%',
        fontSize: 9,
    },
    totalSection: {
        marginTop: 8,
        paddingTop: 8,
        borderTop: 1,
    },
    signature: {
        marginTop: 20,
        borderTop: 1,
        paddingTop: 8,
        textAlign: 'center',
    },
    pendingAmount: {
        color: 'red',
        fontWeight: 'bold',
    },
    // Estilos para la segunda página (normativa duplicada)
    normativaMitad: {
        height: 420, // Aproximadamente la mitad de A4
        padding: 10,
        paddingTop: 8,
        paddingBottom: 8,
    },
    normativaHeader: {
        marginBottom: 8,
        textAlign: 'center',
    },
    normativaTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    normativaSubtitle: {
        fontSize: 10,
        marginBottom: 8,
    },
    normativaSection: {
        padding: 8,
        flexGrow: 1,
    },
    normativaText: {
        fontSize: 7,
        lineHeight: 1.3,
        marginBottom: 2,
        textAlign: 'left',
    },
    normativaSignature: {
        marginTop: 10,
        borderTop: 1,
        paddingTop: 5,
        textAlign: 'center',
    },
});

interface ReservaPDFProps {
    reserva: any;
    socio: any;
    servicio: any;
    suplementosList: SuplementoInfo[];
}

interface SuplementoAgrupado {
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    tipo: 'fijo' | 'porHora';
}

interface Suplemento {
    id: string;
    cantidad?: number;
}

interface SuplementoInfo {
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
}

export const ReservaPDF: React.FC<ReservaPDFProps> = ({ reserva, socio, servicio, suplementosList }) => {
    const { token } = useAuthStore();
    const [normativaTexto, setNormativaTexto] = useState<string>('');

    // Cargar el texto de la normativa
    useEffect(() => {
        const cargarNormativa = async () => {
            if (!token) return;
            try {
                const texto = await configuracionService.obtenerNormativa(token);
                setNormativaTexto(texto);
            } catch (error) {
                console.error('Error al cargar la normativa:', error);
                // Si hay error, usar texto por defecto
                setNormativaTexto('Error al cargar la normativa. Por favor, contacte con la administración.');
            }
        };
        cargarNormativa();
    }, [token]);

    // Agrupar suplementos por ID y calcular totales
    const suplementosAgrupados = (reserva.suplementos || []).reduce((acc: SuplementoAgrupado[], sup: Suplemento) => {
        if (!sup || !sup.id) return acc;
        
        const existingIndex = acc.findIndex(item => item.id === sup.id);
        const suplementoInfo = suplementosList.find((s: SuplementoInfo) => s.id === sup.id);

        if (!suplementoInfo) {
            console.warn(`Suplemento no encontrado: ${sup.id}`);
            return acc;
        }

        if (existingIndex === -1) {
            acc.push({
                id: sup.id,
                nombre: suplementoInfo.nombre,
                precio: suplementoInfo.precio,
                cantidad: sup.cantidad || 1,
                tipo: suplementoInfo.tipo
            });
        } else {
            acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (sup.cantidad || 1);
        }
        return acc;
    }, []);

    // Calcular el total de suplementos
    const totalSuplementos = suplementosAgrupados.reduce((total: number, sup: SuplementoAgrupado) => {
        const precioSuplemento = sup.tipo === 'fijo' ? sup.precio : sup.precio * sup.cantidad;
        return total + precioSuplemento;
    }, 0);

    // Calcular el precio total
    const precioTotal = (servicio?.precio || 0) + totalSuplementos;

    // Calcular el monto pendiente
    const montoPendiente = precioTotal - (reserva.montoAbonado || 0);

    // Asegurarse de que los datos necesarios estén presentes
    if (!reserva || !servicio) {
        return (
            <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Error: Datos incompletos</Text>
                            <Text style={styles.subtitle}>No se puede generar el PDF. Faltan datos de la reserva o servicio.</Text>
                        </View>
                    </Page>
                </Document>
            </PDFViewer>
        );
    }

    // Función para renderizar contenido de reserva (retorna JSX directamente, no un componente React)
    const renderizarContenidoReserva = () => (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Reserva de Instalación</Text>
                <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
            </View>

            <View style={styles.section}>
                {socio ? (
                    <View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Número de Socio:</Text>
                            <Text style={styles.value}>{socio.socio}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Nombre:</Text>
                            <Text style={styles.value}>{`${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.row}>
                        <Text style={styles.label}>Socio:</Text>
                        <Text style={styles.value}>No disponible</Text>
                    </View>
                )}
                <View style={styles.row}>
                    <Text style={styles.label}>Instalación:</Text>
                    <Text style={styles.value}>{servicio.nombre}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Fecha de Reserva:</Text>
                    <Text style={styles.value}>{format(new Date(reserva.fecha), 'PPP', { locale: es })}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Fecha de Creación:</Text>
                    <Text style={styles.value}>{format(new Date(reserva.createdAt), 'PPP', { locale: es })}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Precio Base:</Text>
                    <Text style={styles.value}>{servicio.precio}€</Text>
                </View>

                {suplementosAgrupados.length > 0 && (
                    <View>
                        <Text style={{ marginTop: 8, marginBottom: 4, fontWeight: 'bold', fontSize: 10 }}>Suplementos:</Text>
                        {suplementosAgrupados.map((sup: SuplementoAgrupado, index: number) => (
                            <View key={index} style={styles.suplementoRow}>
                                <Text style={styles.suplementoLabel}>{sup.nombre}:</Text>
                                <Text style={styles.suplementoValue}>
                                    {sup.precio}€ {sup.tipo === 'porHora' ? `(${sup.cantidad} horas)` : ''} = {(sup.tipo === 'fijo' ? sup.precio : sup.precio * sup.cantidad).toFixed(2)}€
                                </Text>
                            </View>
                        ))}
                        <View style={[styles.suplementoRow, { marginTop: 3 }]}>
                            <Text style={[styles.suplementoLabel, { fontWeight: 'bold' }]}>Total Suplementos:</Text>
                            <Text style={[styles.suplementoValue, { fontWeight: 'bold' }]}>{totalSuplementos.toFixed(2)}€</Text>
                        </View>
                    </View>
                )}

                <View style={styles.totalSection}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Precio Base:</Text>
                        <Text style={styles.value}>{servicio.precio}€</Text>
                    </View>
                    {totalSuplementos > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Suplementos:</Text>
                            <Text style={styles.value}>{totalSuplementos.toFixed(2)}€</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.label}>Precio Total:</Text>
                        <Text style={styles.value}>{precioTotal.toFixed(2)}€</Text>
                    </View>

                    {(reserva.montoAbonado || 0) > 0 && (
                        <View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Monto Abonado:</Text>
                                <Text style={styles.value}>{(reserva.montoAbonado || 0).toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Método de Pago:</Text>
                                <Text style={styles.value}>{reserva.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Monto Pendiente:</Text>
                                <Text style={[styles.value, styles.pendingAmount]}>{montoPendiente.toFixed(2)}€</Text>
                            </View>
                        </View>
                    )}
                </View>

                {reserva.observaciones && (
                    <View style={{ marginTop: 8 }}>
                        <Text style={styles.label}>Observaciones:</Text>
                        <Text style={styles.value}>{reserva.observaciones}</Text>
                    </View>
                )}
            </View>

            {reserva.normativaAceptada && (
                <View style={styles.section}>
                    <Text style={styles.label}>Normativa Aceptada:</Text>
                    <Text style={styles.value}>Sí - Fecha: {reserva.fechaAceptacionNormativa ? format(new Date(reserva.fechaAceptacionNormativa), 'PPP', { locale: es }) : format(new Date(reserva.fecha), 'PPP', { locale: es })}</Text>
                </View>
            )}

            <View style={styles.signature}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8 }}>Firma del Socio</Text>
                <Text style={{ fontSize: 8, marginBottom: 5 }}>
                    Al firmar este documento, el socio acepta y se compromete a cumplir todas las normas y reglamentos de la Asociación.
                </Text>
                {!reserva.firmaSocio && (
                    <View style={{ marginTop: 15, borderTop: 1, paddingTop: 5 }}>
                        <Text style={{ fontSize: 8, color: 'gray' }}>_________________________</Text>
                        <Text style={{ fontSize: 7, color: 'gray', marginTop: 3 }}>Firma del Socio</Text>
                    </View>
                )}
            </View>
        </View>
    );

    // Función auxiliar para parsear y renderizar texto formateado
    const renderizarTextoFormateado = (texto: string): Array<{ texto: string; estilo: any }> => {
        const partes: Array<{ texto: string; estilo: any }> = [];
        
        const procesar = (txt: string, estilosBase: any = {}): void => {
            let i = 0;
            let textoNormal = '';
            
            while (i < txt.length) {
                // Negrita **texto**
                if (txt.substring(i, i + 2) === '**') {
                    if (textoNormal) {
                        partes.push({ texto: textoNormal, estilo: estilosBase });
                        textoNormal = '';
                    }
                    const fin = txt.indexOf('**', i + 2);
                    if (fin !== -1) {
                        const contenido = txt.substring(i + 2, fin);
                        const nuevosEstilos = { ...estilosBase, fontWeight: 'bold' };
                        procesar(contenido, nuevosEstilos);
                        i = fin + 2;
                        continue;
                    }
                }
                
                // Subrayado __texto__
                if (txt.substring(i, i + 2) === '__') {
                    if (textoNormal) {
                        partes.push({ texto: textoNormal, estilo: estilosBase });
                        textoNormal = '';
                    }
                    const fin = txt.indexOf('__', i + 2);
                    if (fin !== -1) {
                        const contenido = txt.substring(i + 2, fin);
                        const nuevosEstilos = { ...estilosBase, textDecoration: 'underline' };
                        procesar(contenido, nuevosEstilos);
                        i = fin + 2;
                        continue;
                    }
                }
                
                // Cursiva *texto* (solo si no es **)
                if (txt[i] === '*' && txt.substring(i, i + 2) !== '**') {
                    if (textoNormal) {
                        partes.push({ texto: textoNormal, estilo: estilosBase });
                        textoNormal = '';
                    }
                    const fin = txt.indexOf('*', i + 1);
                    if (fin !== -1 && (fin === i + 1 || txt[fin - 1] !== '*')) {
                        const contenido = txt.substring(i + 1, fin);
                        const nuevosEstilos = { ...estilosBase, fontStyle: 'italic' };
                        procesar(contenido, nuevosEstilos);
                        i = fin + 1;
                        continue;
                    }
                }
                
                textoNormal += txt[i];
                i++;
            }
            
            if (textoNormal) {
                partes.push({ texto: textoNormal, estilo: estilosBase });
            }
        };
        
        procesar(texto);
        return partes.length > 0 ? partes : [{ texto: texto, estilo: {} }];
    };


    // Si no hay texto de normativa cargado pero hay token, mostrar PDF sin normativa
    // Si no hay token, también mostrar PDF sin normativa

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                {/* Primera página: Reserva duplicada */}
                <Page size="A4" style={styles.page}>
                    <View style={styles.contenedorPagina}>
                        {/* Primera mitad - Reserva */}
                        <View style={styles.mitadPagina}>
                            {renderizarContenidoReserva()}
                        </View>
                        
                        {/* Línea divisoria en el centro */}
                        <View style={styles.lineaDivisoria} />
                        
                        {/* Segunda mitad - Reserva duplicada */}
                        <View style={styles.mitadPagina}>
                            {renderizarContenidoReserva()}
                        </View>
                    </View>
                </Page>

                {/* Segunda página: Normativa duplicada */}
                {normativaTexto && (
                    <Page size="A4" style={styles.page}>
                        <View style={styles.contenedorPagina}>
                            {/* Primera mitad - Normativa */}
                            <View style={styles.normativaMitad}>
                                <View style={styles.normativaHeader}>
                                    <Text style={styles.normativaTitle}>NORMATIVA Y REGLAMENTO</Text>
                                    <Text style={styles.normativaSubtitle}>Comunidad de Vecinos Terranova</Text>
                                </View>

                                <View style={styles.normativaSection}>
                                    {normativaTexto.split('\n').map((linea, index) => {
                                        const lineaTrimmed = linea.trim();
                                        if (!lineaTrimmed) {
                                            return <Text key={index} style={styles.normativaText}> </Text>;
                                        }
                                        
                                        const partesFormateadas = renderizarTextoFormateado(lineaTrimmed);
                                        
                                        return (
                                            <Text key={index} style={styles.normativaText}>
                                                {partesFormateadas.map((parte, parteIndex) => (
                                                    <Text key={parteIndex} style={parte.estilo}>
                                                        {parte.texto}
                                                    </Text>
                                                ))}
                                            </Text>
                                        );
                                    })}
                                </View>

                                <View style={styles.normativaSignature}>
                                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 5 }}>Firma del Socio</Text>
                                    <Text style={{ fontSize: 7, marginBottom: 5 }}>
                                        Al firmar este documento, el socio acepta y se compromete a cumplir todas las normas y reglamentos de la Asociación.
                                    </Text>
                                    {!reserva.firmaSocio && (
                                        <View style={{ marginTop: 10, borderTop: 1, paddingTop: 5 }}>
                                            <Text style={{ fontSize: 7, color: 'gray' }}>_________________________</Text>
                                            <Text style={{ fontSize: 6, color: 'gray', marginTop: 2 }}>Firma del Socio</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            
                            {/* Línea divisoria en el centro */}
                            <View style={styles.lineaDivisoria} />
                            
                            {/* Segunda mitad - Normativa duplicada */}
                            <View style={styles.normativaMitad}>
                                <View style={styles.normativaHeader}>
                                    <Text style={styles.normativaTitle}>NORMATIVA Y REGLAMENTO</Text>
                                    <Text style={styles.normativaSubtitle}>Comunidad de Vecinos Terranova</Text>
                                </View>

                                <View style={styles.normativaSection}>
                                    {normativaTexto.split('\n').map((linea, index) => {
                                        const lineaTrimmed = linea.trim();
                                        if (!lineaTrimmed) {
                                            return <Text key={index} style={styles.normativaText}> </Text>;
                                        }
                                        
                                        const partesFormateadas = renderizarTextoFormateado(lineaTrimmed);
                                        
                                        return (
                                            <Text key={index} style={styles.normativaText}>
                                                {partesFormateadas.map((parte, parteIndex) => (
                                                    <Text key={parteIndex} style={parte.estilo}>
                                                        {parte.texto}
                                                    </Text>
                                                ))}
                                            </Text>
                                        );
                                    })}
                                </View>

                                <View style={styles.normativaSignature}>
                                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 5 }}>Firma del Socio</Text>
                                    <Text style={{ fontSize: 7, marginBottom: 5 }}>
                                        Al firmar este documento, el socio acepta y se compromete a cumplir todas las normas y reglamentos de la Asociación.
                                    </Text>
                                    {!reserva.firmaSocio && (
                                        <View style={{ marginTop: 10, borderTop: 1, paddingTop: 5 }}>
                                            <Text style={{ fontSize: 7, color: 'gray' }}>_________________________</Text>
                                            <Text style={{ fontSize: 6, color: 'gray', marginTop: 2 }}>Firma del Socio</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Page>
                )}
            </Document>
        </PDFViewer>
    );
}; 