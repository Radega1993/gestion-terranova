import React, { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { configuracionService } from '../../services/configuracion';
import { useAuthStore } from '../../stores/authStore';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '40%',
        fontWeight: 'bold',
    },
    value: {
        width: '60%',
    },
    suplementoRow: {
        flexDirection: 'row',
        marginBottom: 5,
        marginLeft: 20,
    },
    suplementoLabel: {
        width: '40%',
    },
    suplementoValue: {
        width: '60%',
    },
    totalSection: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTop: 1,
        paddingTop: 20,
    },
    signature: {
        marginTop: 50,
        borderTop: 1,
        paddingTop: 10,
        textAlign: 'center',
    },
    pendingAmount: {
        color: 'red',
        fontWeight: 'bold',
    },
    normativaSection: {
        marginTop: 20,
        padding: 15,
        flexGrow: 1,
    },
    normativaTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    normativaText: {
        fontSize: 9,
        lineHeight: 1.5,
        marginBottom: 4,
        textAlign: 'left',
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
    const suplementosAgrupados = reserva.suplementos.reduce((acc: SuplementoAgrupado[], sup: Suplemento) => {
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
        return null;
    }

    // Si no hay texto de normativa cargado, mostrar un mensaje de carga
    if (!normativaTexto && token) {
        return (
            <PDFViewer style={{ width: '100%', height: '100vh' }}>
                <Document>
                    <Page size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Cargando normativa...</Text>
                        </View>
                    </Page>
                </Document>
            </PDFViewer>
        );
    }

    return (
        <PDFViewer style={{ width: '100%', height: '100vh' }}>
            <Document>
                <Page size="A4" style={styles.page} wrap>
                    <View style={styles.header}>
                        <Text style={styles.title}>Reserva de Instalación</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    </View>

                    <View style={styles.section}>
                        {socio ? (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Número de Socio:</Text>
                                    <Text style={styles.value}>{socio.socio}</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Nombre:</Text>
                                    <Text style={styles.value}>{`${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`}</Text>
                                </View>
                            </>
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
                            <>
                                <Text style={{ marginTop: 10, marginBottom: 5, fontWeight: 'bold' }}>Suplementos:</Text>
                                {suplementosAgrupados.map((sup: SuplementoAgrupado, index: number) => (
                                    <View key={index} style={styles.suplementoRow}>
                                        <Text style={styles.suplementoLabel}>{sup.nombre}:</Text>
                                        <Text style={styles.suplementoValue}>
                                            {sup.precio}€ {sup.tipo === 'porHora' ? `(${sup.cantidad} horas)` : ''} = {(sup.tipo === 'fijo' ? sup.precio : sup.precio * sup.cantidad).toFixed(2)}€
                                        </Text>
                                    </View>
                                ))}
                                <View style={[styles.suplementoRow, { marginTop: 5 }]}>
                                    <Text style={[styles.suplementoLabel, { fontWeight: 'bold' }]}>Total Suplementos:</Text>
                                    <Text style={[styles.suplementoValue, { fontWeight: 'bold' }]}>{totalSuplementos.toFixed(2)}€</Text>
                                </View>
                            </>
                        )}

                        <View style={styles.totalSection}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Precio Base:</Text>
                                <Text style={styles.value}>{servicio.precio}€</Text>
                            </View>
                            {totalSuplementos > 0 && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Total Suplementos:</Text>
                                    <Text style={styles.value}>{totalSuplementos}€</Text>
                                </View>
                            )}
                            <View style={styles.row}>
                                <Text style={styles.label}>Precio Total:</Text>
                                <Text style={styles.value}>{precioTotal}€</Text>
                            </View>

                            {reserva.montoAbonado > 0 && (
                                <>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Monto Abonado:</Text>
                                        <Text style={styles.value}>{reserva.montoAbonado}€</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Método de Pago:</Text>
                                        <Text style={styles.value}>{reserva.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</Text>
                                    </View>
                                    <View style={styles.row}>
                                        <Text style={styles.label}>Monto Pendiente:</Text>
                                        <Text style={[styles.value, styles.pendingAmount]}>{montoPendiente}€</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {reserva.observaciones && (
                            <View style={{ marginTop: 10 }}>
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
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 20 }}>Firma del Socio</Text>
                        <Text style={{ fontSize: 10, marginBottom: 10 }}>
                            Al firmar este documento, el socio acepta y se compromete a cumplir todas las normas y reglamentos de la Asociación.
                        </Text>
                        {reserva.firmaSocio && (
                            <View style={{ marginTop: 10, padding: 10, border: 1 }}>
                                <Text style={{ fontSize: 10, color: 'gray' }}>
                                    Firma registrada: {reserva.firmaSocio.substring(0, 50)}...
                                </Text>
                            </View>
                        )}
                        {!reserva.firmaSocio && (
                            <View style={{ marginTop: 30, borderTop: 1, paddingTop: 10 }}>
                                <Text style={{ fontSize: 10, color: 'gray' }}>_________________________</Text>
                                <Text style={{ fontSize: 9, color: 'gray', marginTop: 5 }}>Firma del Socio</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text>Este documento sirve como comprobante de la reserva realizada.</Text>
                        <Text>Por favor, conserve este documento hasta el día de la reserva.</Text>
                    </View>
                </Page>

                {/* Segunda página: Normativa */}
                {normativaTexto && (
                    <Page size="A4" style={styles.page} wrap>
                        <View style={styles.header}>
                            <Text style={styles.title}>NORMATIVA Y REGLAMENTO</Text>
                            <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        </View>

                        <View style={styles.normativaSection}>
                            {normativaTexto.split('\n').map((linea, index) => {
                                const lineaTrimmed = linea.trim();
                                if (!lineaTrimmed) {
                                    return <Text key={index} style={styles.normativaText}> </Text>;
                                }
                                return (
                                    <Text key={index} style={styles.normativaText}>
                                        {lineaTrimmed}
                                    </Text>
                                );
                            })}
                        </View>

                        <View style={styles.signature}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 20 }}>Firma del Socio</Text>
                            <Text style={{ fontSize: 10, marginBottom: 10 }}>
                                Al firmar este documento, el socio acepta y se compromete a cumplir todas las normas y reglamentos de la Asociación.
                            </Text>
                            {reserva.firmaSocio && (
                                <View style={{ marginTop: 10, padding: 10, border: 1 }}>
                                    <Text style={{ fontSize: 10, color: 'gray' }}>
                                        Firma registrada: {reserva.firmaSocio.substring(0, 50)}...
                                    </Text>
                                </View>
                            )}
                            {!reserva.firmaSocio && (
                                <View style={{ marginTop: 30, borderTop: 1, paddingTop: 10 }}>
                                    <Text style={{ fontSize: 10, color: 'gray' }}>_________________________</Text>
                                    <Text style={{ fontSize: 9, color: 'gray', marginTop: 5 }}>Firma del Socio</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.footer}>
                            <Text>Este documento forma parte de la reserva realizada.</Text>
                            <Text>Por favor, conserve este documento junto con el comprobante de reserva.</Text>
                        </View>
                    </Page>
                )}
            </Document>
        </PDFViewer>
    );
}; 