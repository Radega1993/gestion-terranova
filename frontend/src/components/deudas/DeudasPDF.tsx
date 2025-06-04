import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
        width: '16.66%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 'auto',
        padding: 5,
        fontSize: 10,
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
        borderTop: 1,
        paddingTop: 20,
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
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    totalText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

interface DeudasPDFProps {
    socio: {
        codigo: string;
        nombre: string;
    };
    ventas: Array<{
        _id: string;
        createdAt: string;
        total: number;
        pagado: number;
        estado: string;
        observaciones?: string;
        productos: Array<{
            nombre: string;
            unidades: number;
            precioUnitario: number;
            precioTotal: number;
        }>;
        pagos?: Array<{
            fecha: string;
            monto: number;
            metodoPago: string;
            observaciones?: string;
        }>;
    }>;
}

export const DeudasPDF: React.FC<DeudasPDFProps> = ({
    socio,
    ventas = []
}) => {
    // Calcular totales
    const totalDeuda = ventas.reduce((sum, venta) => sum + (venta.total - venta.pagado), 0);
    const totalPagado = ventas.reduce((sum, venta) => sum + venta.pagado, 0);
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);

    // Ordenar ventas por fecha (más recientes primero)
    const ventasOrdenadas = [...ventas].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Informe de Deudas</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    </View>

                    {/* Información del Socio */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Socio:</Text> {socio?.nombre || 'No especificado'}
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Código:</Text> {socio?.codigo || 'No especificado'}
                        </Text>
                    </View>

                    {/* Resumen de Totales */}
                    <View style={styles.totalBox}>
                        <Text style={styles.totalText}>Resumen de Deudas</Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Total Ventas:</Text> {totalVentas.toFixed(2)}€
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Total Pagado:</Text> {totalPagado.toFixed(2)}€
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Total Pendiente:</Text> {totalDeuda.toFixed(2)}€
                        </Text>
                    </View>

                    {/* Detalle de Ventas */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Detalle de Ventas</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Fecha</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Total</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Pagado</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Pendiente</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Estado</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Observaciones</Text>
                                </View>
                            </View>
                            {ventasOrdenadas.length > 0 ? (
                                ventasOrdenadas.map((venta, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {format(new Date(venta.createdAt), 'dd/MM/yyyy HH:mm')}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{venta.total.toFixed(2)}€</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{venta.pagado.toFixed(2)}€</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {(venta.total - venta.pagado).toFixed(2)}€
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{venta.estado}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{venta.observaciones || '-'}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.tableRow}>
                                    <View style={[styles.tableCol, { width: '100%' }]}>
                                        <Text style={[styles.tableCell, styles.emptyMessage]}>
                                            No hay ventas registradas
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Historial de Pagos */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Historial de Pagos</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Fecha</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Monto</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Método</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Observaciones</Text>
                                </View>
                            </View>
                            {ventasOrdenadas.flatMap(venta =>
                                venta.pagos?.map((pago, index) => (
                                    <View key={`${venta._id}-${index}`} style={styles.tableRow}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm')}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{pago.monto.toFixed(2)}€</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{pago.metodoPago}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{pago.observaciones || '-'}</Text>
                                        </View>
                                    </View>
                                )) || []
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