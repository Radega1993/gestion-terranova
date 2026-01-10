import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductoRetirado {
    _id: string;
    producto: {
        nombre: string;
        tipo: string;
        unidad_medida: string;
    };
    cantidad: number;
    motivo: string;
    usuarioRegistro: {
        username: string;
    };
    fechaRetiro: string;
    observaciones?: string;
}

interface Resumen {
    totalRegistros: number;
    totalCantidad: number;
    porMotivo: Record<string, { cantidad: number }>;
    porProducto: Record<string, { cantidad: number; nombre: string }>;
}

interface ProductosRetiradosPDFProps {
    productosRetirados: ProductoRetirado[];
    resumen?: Resumen;
    fechaInicio?: Date | null;
    fechaFin?: Date | null;
}

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica'
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    text: {
        marginBottom: 5
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row'
    },
    tableColHeader: {
        width: '14.28%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '#f0f0f0'
    },
    tableCol: {
        width: '14.28%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0
    },
    tableCellHeader: {
        margin: 5,
        fontSize: 8,
        fontWeight: 'bold'
    },
    tableCell: {
        margin: 5,
        fontSize: 8
    },
    resumen: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f9f9f9'
    },
    resumenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5
    }
});

export const ProductosRetiradosPDF: React.FC<ProductosRetiradosPDFProps> = ({
    productosRetirados,
    resumen,
    fechaInicio,
    fechaFin
}) => {
    return (
        <PDFViewer style={{ width: '100%', height: '80vh' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <Text style={styles.title}>Informe de Productos Retirados</Text>

                    {(fechaInicio || fechaFin) && (
                        <Text style={styles.text}>
                            Período: {fechaInicio ? format(fechaInicio, 'dd/MM/yyyy', { locale: es }) : 'Inicio'} -{' '}
                            {fechaFin ? format(fechaFin, 'dd/MM/yyyy', { locale: es }) : 'Fin'}
                        </Text>
                    )}

                    {resumen && (
                        <View style={styles.resumen}>
                            <Text style={styles.subtitle}>Resumen</Text>
                            <View style={styles.resumenRow}>
                                <Text>Total Registros:</Text>
                                <Text>{resumen.totalRegistros}</Text>
                            </View>
                            <View style={styles.resumenRow}>
                                <Text>Total Cantidad Retirada:</Text>
                                <Text>{resumen.totalCantidad}</Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.subtitle}>Detalle de Productos Retirados</Text>

                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Fecha</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Producto</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Cantidad</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Motivo</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Usuario</Text>
                            </View>
                            <View style={styles.tableColHeader}>
                                <Text style={styles.tableCellHeader}>Obs.</Text>
                            </View>
                        </View>
                        {productosRetirados.map((pr) => (
                            <View key={pr._id} style={styles.tableRow}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {format(new Date(pr.fechaRetiro), 'dd/MM/yyyy', { locale: es })}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{pr.producto.nombre}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {pr.cantidad} {pr.producto.unidad_medida}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{pr.motivo}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{pr.usuarioRegistro.username}</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>{pr.observaciones || '-'}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
};

