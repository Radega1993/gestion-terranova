import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

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
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        borderBottom: 1,
        paddingBottom: 5,
    },
    label: {
        width: '60%',
    },
    value: {
        width: '40%',
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 10,
        paddingTop: 10,
        borderTop: 1,
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
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 5,
        marginBottom: 10,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableColFecha: {
        width: '20%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColProducto: {
        width: '35%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColCantidad: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColTotal: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColMetodo: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 'auto',
        padding: 3,
        fontSize: 9,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    socioSection: {
        marginBottom: 15,
        padding: 8,
        backgroundColor: '#f9f9f9',
    },
    socioTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
});

export interface ResumenSociosData {
    totales: {
        totalSocios: number;
        totalVentas: number;
        totalPagado: number;
    };
    socios: Array<{
        codigo: string;
        nombre: string;
        totalPagado: number;
        totalVentas: number;
        diasConsumo: string[];
        productos: Array<{ nombre: string; cantidad: number; total: number }>;
        transacciones: Array<{
            fecha: string;
            tipo: string;
            productos: Array<{ nombre: string; cantidad: number; total: number }>;
            pagado: number;
            metodoPago: string;
        }>;
    }>;
}

interface ResumenSociosPDFProps {
    resumen: ResumenSociosData;
    fechaInicio: Date;
    fechaFin: Date;
}

/** PDF de socios a partir de datos ya agregados en el servidor. */
export const ResumenSociosPDF: React.FC<ResumenSociosPDFProps> = ({
    resumen,
    fechaInicio,
    fechaFin,
}) => {
    const { socios, totales } = resumen;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Resumen de Socios</Text>
                    <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    <Text>
                        Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}
                    </Text>
                </View>

                {socios.map((socio) => (
                    <View key={socio.codigo} style={styles.socioSection} wrap={false}>
                        <Text style={styles.socioTitle}>
                            {socio.codigo} - {socio.nombre}
                        </Text>

                        <View style={styles.row}>
                            <Text style={styles.label}>Total Pagado:</Text>
                            <Text style={styles.value}>{socio.totalPagado.toFixed(2)}€</Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>Total de Transacciones:</Text>
                            <Text style={styles.value}>{socio.totalVentas}</Text>
                        </View>

                        <View style={styles.row}>
                            <Text style={styles.label}>Días de Consumo:</Text>
                            <Text style={styles.value}>{socio.diasConsumo.length}</Text>
                        </View>

                        {socio.diasConsumo.length > 0 && (
                            <View style={{ marginTop: 5, marginBottom: 5 }}>
                                <Text style={{ fontSize: 9, marginBottom: 3 }}>Fechas:</Text>
                                <Text style={{ fontSize: 8 }}>
                                    {socio.diasConsumo
                                        .map((fecha) => format(new Date(fecha), 'dd/MM/yyyy'))
                                        .join(', ')}
                                </Text>
                            </View>
                        )}

                        {socio.productos.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 3 }}>
                                    Productos Consumidos:
                                </Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableHeader]}>
                                        <View style={styles.tableColProducto}>
                                            <Text style={styles.tableCell}>Producto</Text>
                                        </View>
                                        <View style={styles.tableColCantidad}>
                                            <Text style={styles.tableCell}>Cantidad</Text>
                                        </View>
                                        <View style={styles.tableColTotal}>
                                            <Text style={styles.tableCell}>Total</Text>
                                        </View>
                                    </View>
                                    {socio.productos.map((producto, prodIndex) => (
                                        <View key={prodIndex} style={styles.tableRow}>
                                            <View style={styles.tableColProducto}>
                                                <Text style={styles.tableCell}>{producto.nombre}</Text>
                                            </View>
                                            <View style={styles.tableColCantidad}>
                                                <Text style={styles.tableCell}>{producto.cantidad}</Text>
                                            </View>
                                            <View style={styles.tableColTotal}>
                                                <Text style={styles.tableCell}>
                                                    {producto.total.toFixed(2)}€
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {socio.transacciones.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 3 }}>
                                    Detalle de Transacciones:
                                </Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableHeader]}>
                                        <View style={styles.tableColFecha}>
                                            <Text style={styles.tableCell}>Fecha</Text>
                                        </View>
                                        <View style={styles.tableColProducto}>
                                            <Text style={styles.tableCell}>Productos</Text>
                                        </View>
                                        <View style={styles.tableColCantidad}>
                                            <Text style={styles.tableCell}>Pagado</Text>
                                        </View>
                                        <View style={styles.tableColMetodo}>
                                            <Text style={styles.tableCell}>Método</Text>
                                        </View>
                                    </View>
                                    {socio.transacciones.map((transaccion, transIndex) => (
                                        <View key={transIndex} style={styles.tableRow}>
                                            <View style={styles.tableColFecha}>
                                                <Text style={styles.tableCell}>
                                                    {format(new Date(transaccion.fecha), 'dd/MM/yyyy')}
                                                </Text>
                                            </View>
                                            <View style={styles.tableColProducto}>
                                                <Text style={styles.tableCell}>
                                                    {transaccion.productos
                                                        .map((p) => `${p.cantidad}x ${p.nombre}`)
                                                        .join(', ')}
                                                </Text>
                                            </View>
                                            <View style={styles.tableColCantidad}>
                                                <Text style={styles.tableCell}>
                                                    {transaccion.pagado.toFixed(2)}€
                                                </Text>
                                            </View>
                                            <View style={styles.tableColMetodo}>
                                                <Text style={styles.tableCell}>
                                                    {transaccion.metodoPago}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Totales Generales</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Socios:</Text>
                        <Text style={styles.value}>{totales.totalSocios}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Transacciones:</Text>
                        <Text style={styles.value}>{totales.totalVentas}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.label}>Total Recaudado:</Text>
                        <Text style={styles.value}>{totales.totalPagado.toFixed(2)}€</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                </View>
            </Page>
        </Document>
    );
};
