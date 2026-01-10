import React, { useMemo } from 'react';
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
    tableCol: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
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
    socioInfo: {
        fontSize: 10,
        marginBottom: 3,
    },
    productoRow: {
        flexDirection: 'row',
        marginLeft: 10,
        marginBottom: 2,
        fontSize: 9,
    },
});

interface ResumenSociosPDFProps {
    ventas: Array<{
        _id: string;
        tipo: 'VENTA' | 'RESERVA';
        fecha: string;
        socio: {
            codigo: string;
            nombre: string;
        };
        usuario: {
            _id: string;
            username: string;
        };
        trabajador?: {
            _id: string;
            nombre: string;
            identificador: string;
        };
        total: number;
        pagado: number;
        metodoPago?: string;
        estado: string;
        detalles: Array<{
            nombre: string;
            cantidad: number;
            precio: number;
            total: number;
            categoria?: string;
        }>;
        pagos?: Array<{
            fecha: string;
            monto: number;
            metodoPago: string;
            observaciones?: string;
        }>;
    }>;
    fechaInicio: Date;
    fechaFin: Date;
}

export const ResumenSociosPDF: React.FC<ResumenSociosPDFProps> = ({ ventas, fechaInicio, fechaFin }) => {
    // Agrupar ventas por socio
    const ventasPorSocio = useMemo(() => {
        const sociosMap = new Map<string, {
            codigo: string;
            nombre: string;
            totalPagado: number;
            totalVentas: number;
            diasConsumo: Set<string>; // Fechas únicas de consumo
            productos: Map<string, { cantidad: number; total: number }>;
            transacciones: Array<{
                fecha: string;
                tipo: string;
                productos: Array<{ nombre: string; cantidad: number; total: number }>;
                pagado: number;
                metodoPago: string;
            }>;
        }>();

        ventas.forEach(venta => {
            const codigoSocio = venta.socio.codigo;
            
            if (!sociosMap.has(codigoSocio)) {
                sociosMap.set(codigoSocio, {
                    codigo: codigoSocio,
                    nombre: venta.socio.nombre,
                    totalPagado: 0,
                    totalVentas: 0,
                    diasConsumo: new Set(),
                    productos: new Map(),
                    transacciones: []
                });
            }

            const socioData = sociosMap.get(codigoSocio)!;
            
            // Agregar fecha de consumo (solo la fecha, sin hora)
            const fechaConsumo = format(new Date(venta.fecha), 'yyyy-MM-dd');
            socioData.diasConsumo.add(fechaConsumo);
            
            // Sumar al total pagado
            // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
            const montoVenta = venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined 
                ? (venta as any).pagadoRecaudacion 
                : venta.pagado;
            socioData.totalPagado += montoVenta;
            socioData.totalVentas += 1;

            // Obtener método de pago
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            
            // Agregar transacción
            socioData.transacciones.push({
                fecha: venta.fecha,
                tipo: venta.tipo,
                productos: venta.detalles.map(d => ({
                    nombre: d.nombre,
                    cantidad: d.cantidad,
                    total: d.total
                })),
                pagado: montoVenta,
                metodoPago: metodoPago === 'EFECTIVO' || metodoPago === 'efectivo' ? 'Efectivo' : 
                           metodoPago === 'TARJETA' || metodoPago === 'tarjeta' ? 'Tarjeta' : metodoPago
            });

            // Agregar productos al total del socio
            venta.detalles.forEach(producto => {
                const productoKey = producto.nombre;
                if (!socioData.productos.has(productoKey)) {
                    socioData.productos.set(productoKey, { cantidad: 0, total: 0 });
                }
                const prodData = socioData.productos.get(productoKey)!;
                prodData.cantidad += producto.cantidad;
                prodData.total += producto.total;
            });
        });

        // Convertir Map a Array y ordenar por total pagado descendente
        return Array.from(sociosMap.values())
            .map(socio => ({
                ...socio,
                diasConsumo: Array.from(socio.diasConsumo).sort(),
                productos: Array.from(socio.productos.entries()).map(([nombre, datos]) => ({
                    nombre,
                    ...datos
                }))
            }))
            .sort((a, b) => b.totalPagado - a.totalPagado);
    }, [ventas]);

    // Calcular totales generales
    const totalesGenerales = useMemo(() => {
        return ventasPorSocio.reduce((acc, socio) => {
            acc.totalPagado += socio.totalPagado;
            acc.totalVentas += socio.totalVentas;
            acc.totalSocios += 1;
            return acc;
        }, { totalPagado: 0, totalVentas: 0, totalSocios: 0 });
    }, [ventasPorSocio]);

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen de Socios</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Resumen por Socio */}
                    {ventasPorSocio.map((socio, index) => (
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

                            {/* Fechas de consumo */}
                            {socio.diasConsumo.length > 0 && (
                                <View style={{ marginTop: 5, marginBottom: 5 }}>
                                    <Text style={{ fontSize: 9, marginBottom: 3 }}>Fechas:</Text>
                                    <Text style={{ fontSize: 8 }}>
                                        {socio.diasConsumo.map(fecha => format(new Date(fecha), 'dd/MM/yyyy')).join(', ')}
                                    </Text>
                                </View>
                            )}

                            {/* Productos consumidos */}
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
                                        {socio.productos.map((producto: any, prodIndex: number) => (
                                            <View key={prodIndex} style={styles.tableRow}>
                                                <View style={styles.tableColProducto}>
                                                    <Text style={styles.tableCell}>{producto.nombre}</Text>
                                                </View>
                                                <View style={styles.tableColCantidad}>
                                                    <Text style={styles.tableCell}>{producto.cantidad}</Text>
                                                </View>
                                                <View style={styles.tableColTotal}>
                                                    <Text style={styles.tableCell}>{producto.total.toFixed(2)}€</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Detalle de transacciones */}
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
                                                        {transaccion.productos.map(p => 
                                                            `${p.cantidad}x ${p.nombre}`
                                                        ).join(', ')}
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

                    {/* Totales Generales */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Totales Generales</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Socios:</Text>
                            <Text style={styles.value}>{totalesGenerales.totalSocios}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Transacciones:</Text>
                            <Text style={styles.value}>{totalesGenerales.totalVentas}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Total Recaudado:</Text>
                            <Text style={styles.value}>{totalesGenerales.totalPagado.toFixed(2)}€</Text>
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

