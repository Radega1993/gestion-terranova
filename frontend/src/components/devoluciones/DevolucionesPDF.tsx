import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { Devolucion, DevolucionesFilters } from '../../services/devoluciones';

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
    sectionTitle: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableCol: {
        width: '14.28%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColWide: {
        width: '20%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColNarrow: {
        width: '11%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 'auto',
        padding: 4,
        fontSize: 8,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
    },
    infoBox: {
        margin: 10,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
    },
    infoText: {
        marginBottom: 5,
        fontSize: 12,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    emptyMessage: {
        textAlign: 'center',
        padding: 10,
        fontStyle: 'italic',
        color: '#666',
    },
    totalBox: {
        marginTop: 10,
        marginHorizontal: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    totalText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
});

interface DevolucionesPDFProps {
    devoluciones: Devolucion[];
    filtros?: DevolucionesFilters;
}

function getFechaDevolucion(devolucion: Devolucion): Date {
    if (devolucion.estado === 'PROCESADA' && devolucion.fechaProcesamiento) {
        return new Date(devolucion.fechaProcesamiento);
    }
    return new Date(devolucion.createdAt);
}

function getClienteLabel(devolucion: Devolucion): string {
    if (typeof devolucion.venta === 'string') {
        return '-';
    }
    if (!devolucion.venta) {
        return '-';
    }
    const { nombreSocio, codigoSocio } = devolucion.venta;
    if (nombreSocio && codigoSocio) {
        return `${nombreSocio} (${codigoSocio})`;
    }
    return nombreSocio || codigoSocio || '-';
}

function getProductosResumen(devolucion: Devolucion): string {
    if (!devolucion.productos || devolucion.productos.length === 0) {
        return '-';
    }
    if (devolucion.productos.length === 1) {
        return devolucion.productos[0].nombre;
    }
    const nombres = devolucion.productos.map((p) => p.nombre).join(', ');
    if (nombres.length > 40) {
        return `${devolucion.productos.length} productos`;
    }
    return nombres;
}

function getUsuarioLabel(devolucion: Devolucion): string {
    if (typeof devolucion.usuario === 'string') {
        return devolucion.usuario || '-';
    }
    if (!devolucion.usuario) {
        return '-';
    }
    return devolucion.usuario.username || devolucion.usuario.nombre || '-';
}

function formatPeriodo(filtros?: DevolucionesFilters): string {
    if (!filtros?.fechaInicio && !filtros?.fechaFin) {
        return 'Sin filtro de fechas';
    }
    const inicio = filtros.fechaInicio
        ? format(new Date(filtros.fechaInicio), 'dd/MM/yyyy')
        : '...';
    const fin = filtros.fechaFin
        ? format(new Date(filtros.fechaFin), 'dd/MM/yyyy')
        : '...';
    return `${inicio} — ${fin}`;
}

export const DevolucionesPDF: React.FC<DevolucionesPDFProps> = ({
    devoluciones = [],
    filtros,
}) => {
    const totalImporte = devoluciones.reduce((sum, d) => sum + (d.totalDevolucion || 0), 0);
    const totalEfectivo = devoluciones
        .filter((d) => d.metodoDevolucion === 'EFECTIVO')
        .reduce((sum, d) => sum + (d.totalDevolucion || 0), 0);
    const totalTarjeta = devoluciones
        .filter((d) => d.metodoDevolucion === 'TARJETA')
        .reduce((sum, d) => sum + (d.totalDevolucion || 0), 0);

    const countPendiente = devoluciones.filter((d) => d.estado === 'PENDIENTE').length;
    const countProcesada = devoluciones.filter((d) => d.estado === 'PROCESADA').length;
    const countCancelada = devoluciones.filter((d) => d.estado === 'CANCELADA').length;

    const ordenadas = [...devoluciones].sort(
        (a, b) => getFechaDevolucion(b).getTime() - getFechaDevolucion(a).getTime(),
    );

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Informe de Devoluciones</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Periodo:</Text> {formatPeriodo(filtros)}
                        </Text>
                        {filtros?.ventaId ? (
                            <Text style={styles.infoText}>
                                <Text style={styles.infoLabel}>Filtro venta:</Text> {filtros.ventaId}
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.totalBox}>
                        <Text style={styles.totalText}>Resumen</Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Nº de devoluciones:</Text> {devoluciones.length}
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Importe total:</Text> {totalImporte.toFixed(2)}€
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Efectivo:</Text> {totalEfectivo.toFixed(2)}€
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Tarjeta:</Text> {totalTarjeta.toFixed(2)}€
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Pendientes:</Text> {countPendiente}
                            {'  '}
                            <Text style={styles.infoLabel}>Procesadas:</Text> {countProcesada}
                            {'  '}
                            <Text style={styles.infoLabel}>Canceladas:</Text> {countCancelada}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalle de Devoluciones</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>Fecha</Text>
                                </View>
                                <View style={styles.tableColWide}>
                                    <Text style={styles.tableCell}>Cliente</Text>
                                </View>
                                <View style={styles.tableColWide}>
                                    <Text style={styles.tableCell}>Productos</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>Total</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>Método</Text>
                                </View>
                                <View style={styles.tableColNarrow}>
                                    <Text style={styles.tableCell}>Estado</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Usuario</Text>
                                </View>
                            </View>

                            {ordenadas.length > 0 ? (
                                ordenadas.map((devolucion) => (
                                    <View key={devolucion._id} style={styles.tableRow}>
                                        <View style={styles.tableColNarrow}>
                                            <Text style={styles.tableCell}>
                                                {format(getFechaDevolucion(devolucion), 'dd/MM/yyyy HH:mm')}
                                            </Text>
                                        </View>
                                        <View style={styles.tableColWide}>
                                            <Text style={styles.tableCell}>{getClienteLabel(devolucion)}</Text>
                                        </View>
                                        <View style={styles.tableColWide}>
                                            <Text style={styles.tableCell}>{getProductosResumen(devolucion)}</Text>
                                        </View>
                                        <View style={styles.tableColNarrow}>
                                            <Text style={styles.tableCell}>
                                                {(devolucion.totalDevolucion || 0).toFixed(2)}€
                                            </Text>
                                        </View>
                                        <View style={styles.tableColNarrow}>
                                            <Text style={styles.tableCell}>{devolucion.metodoDevolucion}</Text>
                                        </View>
                                        <View style={styles.tableColNarrow}>
                                            <Text style={styles.tableCell}>{devolucion.estado}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{getUsuarioLabel(devolucion)}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.tableRow}>
                                    <View style={[styles.tableCol, { width: '100%' }]}>
                                        <Text style={[styles.tableCell, styles.emptyMessage]}>
                                            No hay devoluciones para mostrar
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};
