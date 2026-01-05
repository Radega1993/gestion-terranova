import React, { useEffect, useState, useMemo } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../../config';
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
    tableCell: {
        margin: 'auto',
        padding: 3,
        fontSize: 9,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    subSection: {
        marginTop: 5,
        marginBottom: 5,
        paddingLeft: 10,
    },
});

interface ResumenGeneralPDFProps {
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

export const ResumenGeneralPDF: React.FC<ResumenGeneralPDFProps> = ({ ventas, fechaInicio, fechaFin }) => {
    const [categorias, setCategorias] = useState<string[]>([]);
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/types`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al obtener categorías');
                }
                const data = await response.json();
                console.log('Categorías obtenidas:', data);
                setCategorias(data);
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };
        fetchCategorias();
    }, [token]);

    // Agrupar ventas por trabajador/usuario usando useMemo para evitar recalcular
    const { ventasPorTrabajador, totalesGenerales, totalesPorMetodoPago } = useMemo(() => {
        // Si no hay categorías aún, retornar valores vacíos
        if (categorias.length === 0) {
            return {
                ventasPorTrabajador: {},
                totalesGenerales: { total: 0, categorias: {} },
                totalesPorMetodoPago: { efectivo: 0, tarjeta: 0 }
            };
        }

        // Usar un Set para rastrear ventas ya procesadas para productos (evitar duplicados por múltiples pagos)
        const ventasProcesadas = new Set<string>();
        
        const ventasPorTrabajadorResult = ventas.reduce((acc: any, venta) => {
            // Determinar la clave: trabajador si existe, sino usuario
            const key = venta.trabajador 
                ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
                : venta.usuario.username;
            
            if (!acc[key]) {
                acc[key] = {
                    total: 0,
                    categorias: categorias.reduce((catAcc: any, cat) => {
                        catAcc[cat.toLowerCase()] = 0;
                        return catAcc;
                    }, { reservas: 0, otros: 0 }),
                    productos: new Map<string, { cantidad: number; total: number }>(),
                    metodoPago: { efectivo: 0, tarjeta: 0 },
                    ventasPorSocio: new Map<string, { nombre: string; total: number; cantidad: number }>()
                };
            }

            // Sumar al total del trabajador/usuario (siempre sumar el pagado de cada transacción)
            acc[key].total += venta.pagado;

            // Método de pago
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
                acc[key].metodoPago.efectivo += venta.pagado;
            } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
                acc[key].metodoPago.tarjeta += venta.pagado;
            }

            // Ventas por socio
            const socioKey = venta.socio.codigo;
            if (!acc[key].ventasPorSocio.has(socioKey)) {
                acc[key].ventasPorSocio.set(socioKey, {
                    nombre: venta.socio.nombre,
                    total: 0,
                    cantidad: 0,
                    productos: new Map<string, { cantidad: number; total: number }>()
                });
            }
            const socioData = acc[key].ventasPorSocio.get(socioKey);
            socioData.total += venta.pagado;

            // Clasificar productos por categoría
            // IMPORTANTE: Solo procesar productos una vez por venta (evitar duplicados con múltiples pagos)
            const ventaKey = `${venta._id}-${venta.tipo}`;
            const esVentaNueva = !ventasProcesadas.has(ventaKey);
            
            // Agregar productos del socio (solo una vez por venta)
            if (esVentaNueva) {
                socioData.cantidad += 1;
                venta.detalles.forEach((producto) => {
                    const productoKey = producto.nombre;
                    if (!socioData.productos.has(productoKey)) {
                        socioData.productos.set(productoKey, { cantidad: 0, total: 0 });
                    }
                    const prodData = socioData.productos.get(productoKey);
                    prodData.cantidad += producto.cantidad;
                    prodData.total += producto.total;
                });
            }
            
            if (venta.tipo === 'RESERVA') {
                // Para reservas, distribuir el pagado proporcionalmente
                if (esVentaNueva) {
                    // Usar el pagado de esta transacción para las categorías
                    acc[key].categorias.reservas += venta.pagado;
                    // Agregar reserva como producto
                    const productoKey = `Reserva - ${venta.detalles[0]?.nombre || 'Reserva'}`;
                    if (!acc[key].productos.has(productoKey)) {
                        acc[key].productos.set(productoKey, { cantidad: 0, total: 0 });
                    }
                    const productoData = acc[key].productos.get(productoKey);
                    productoData.cantidad += 1;
                    productoData.total += venta.pagado;
                    ventasProcesadas.add(ventaKey);
                }
            } else {
                // Para ventas, distribuir el pagado proporcionalmente entre productos
                if (esVentaNueva) {
                    // Calcular el total de productos para distribución proporcional
                    const totalProductos = venta.detalles.reduce((sum, p) => sum + p.total, 0);
                    
                    venta.detalles.forEach((producto) => {
                        const categoria = (producto.categoria || 'OTROS').toUpperCase();
                        const categoriaLower = categoria.toLowerCase();
                        
                        // Distribuir el pagado proporcionalmente según el total del producto
                        const proporcion = totalProductos > 0 ? producto.total / totalProductos : 0;
                        const montoCategoria = venta.pagado * proporcion;
                        
                        // Si la categoría existe en las categorías del inventario, usarla
                        // Si no, usar 'otros'
                        if (categorias.includes(categoria) && acc[key].categorias[categoriaLower] !== undefined) {
                            acc[key].categorias[categoriaLower] += montoCategoria;
                        } else {
                            acc[key].categorias.otros += montoCategoria;
                        }

                        // Agregar producto al detalle (usar el total del producto para cantidad/precio)
                        const productoKey = producto.nombre;
                        if (!acc[key].productos.has(productoKey)) {
                            acc[key].productos.set(productoKey, { cantidad: 0, total: 0 });
                        }
                        const productoData = acc[key].productos.get(productoKey);
                        productoData.cantidad += producto.cantidad;
                        // Para productos, usar el total del producto (no el pagado proporcional)
                        productoData.total += producto.total;
                    });
                    ventasProcesadas.add(ventaKey);
                } else {
                    // Si ya procesamos esta venta pero hay otro pago, distribuir este pago también
                    const totalProductos = venta.detalles.reduce((sum, p) => sum + p.total, 0);
                    
                    venta.detalles.forEach((producto) => {
                        const categoria = (producto.categoria || 'OTROS').toUpperCase();
                        const categoriaLower = categoria.toLowerCase();
                        
                        const proporcion = totalProductos > 0 ? producto.total / totalProductos : 0;
                        const montoCategoria = venta.pagado * proporcion;
                        
                        if (categorias.includes(categoria) && acc[key].categorias[categoriaLower] !== undefined) {
                            acc[key].categorias[categoriaLower] += montoCategoria;
                        } else {
                            acc[key].categorias.otros += montoCategoria;
                        }
                    });
                }
            }

            return acc;
        }, {});

        // Calcular totales generales
        const totalesGeneralesResult = Object.values(ventasPorTrabajadorResult).reduce((acc: {
            total: number;
            categorias: {
                [key: string]: number;
            };
        }, trabajador: any) => {
            acc.total += trabajador.total;
            Object.keys(trabajador.categorias).forEach(categoria => {
                if (!acc.categorias[categoria]) {
                    acc.categorias[categoria] = 0;
                }
                acc.categorias[categoria] += trabajador.categorias[categoria];
            });
            return acc;
        }, { total: 0, categorias: {} });

        // Calcular totales por método de pago
        const totalesPorMetodoPagoResult = ventas.reduce((acc: { efectivo: number; tarjeta: number }, venta) => {
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
                acc.efectivo += venta.pagado;
            } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
                acc.tarjeta += venta.pagado;
            }
            return acc;
        }, { efectivo: 0, tarjeta: 0 });

        console.log('Ventas por trabajador:', ventasPorTrabajadorResult);
        console.log('Totales generales:', totalesGeneralesResult);
        console.log('Totales por método de pago:', totalesPorMetodoPagoResult);

        // Convertir Maps a objetos para poder serializar
        const ventasPorTrabajadorSerializado: any = {};
        Object.keys(ventasPorTrabajadorResult).forEach(key => {
            ventasPorTrabajadorSerializado[key] = {
                ...ventasPorTrabajadorResult[key],
                productos: Array.from(ventasPorTrabajadorResult[key].productos.entries()).map(([nombre, datos]) => ({
                    nombre,
                    ...datos
                })),
                ventasPorSocio: Array.from(ventasPorTrabajadorResult[key].ventasPorSocio.entries()).map(([codigo, datos]) => ({
                    codigo,
                    nombre: datos.nombre,
                    total: datos.total,
                    cantidad: datos.cantidad,
                    productos: Array.from(datos.productos.entries()).map(([nombre, prodDatos]) => ({
                        nombre,
                        ...prodDatos
                    }))
                }))
            };
        });

        return {
            ventasPorTrabajador: ventasPorTrabajadorSerializado,
            totalesGenerales: totalesGeneralesResult,
            totalesPorMetodoPago: totalesPorMetodoPagoResult
        };
    }, [ventas, categorias]);

    // No renderizar el PDF hasta que las categorías estén cargadas
    if (categorias.length === 0 || Object.keys(ventasPorTrabajador).length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    return (
        <PDFViewer key={`pdf-${categorias.length}-${ventas.length}`} style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen General de Recaudaciones</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Resumen por Trabajador */}
                    {Object.entries(ventasPorTrabajador).map(([trabajador, datos]: [string, any]) => (
                        <View key={trabajador} style={styles.section}>
                            <Text style={styles.sectionTitle}>Trabajador: {trabajador}</Text>

                            {/* Totales por Categoría */}
                            <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 5, marginBottom: 3 }}>Totales por Categoría:</Text>
                            {Object.entries(datos.categorias)
                                .filter(([_, total]) => total > 0)
                                .map(([categoria, total]) => (
                                    <View key={categoria} style={styles.row}>
                                        <Text style={styles.label}>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}:</Text>
                                        <Text style={styles.value}>{(total as number).toFixed(2)}€</Text>
                                    </View>
                                ))}

                            {/* Método de Pago */}
                            <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 8, marginBottom: 3 }}>Método de Pago:</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Efectivo:</Text>
                                <Text style={styles.value}>{datos.metodoPago.efectivo.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Tarjeta:</Text>
                                <Text style={styles.value}>{datos.metodoPago.tarjeta.toFixed(2)}€</Text>
                            </View>

                            {/* Productos Vendidos */}
                            {datos.productos && datos.productos.length > 0 && (
                                <>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 8, marginBottom: 3 }}>Productos Vendidos:</Text>
                                    <View style={styles.table}>
                                        <View style={[styles.tableRow, styles.tableHeader]}>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>Producto</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>Cantidad</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>Total</Text>
                                            </View>
                                        </View>
                                        {datos.productos.map((producto: any, index: number) => (
                                            <View key={index} style={styles.tableRow}>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{producto.nombre}</Text>
                                                </View>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{producto.cantidad}</Text>
                                                </View>
                                                <View style={styles.tableCol}>
                                                    <Text style={styles.tableCell}>{producto.total.toFixed(2)}€</Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}

                            {/* Ventas por Socio */}
                            {datos.ventasPorSocio && datos.ventasPorSocio.length > 0 && (
                                <>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 8, marginBottom: 3 }}>Ventas por Socio:</Text>
                                    {datos.ventasPorSocio.map((socio: any, index: number) => (
                                        <View key={index} style={{ marginBottom: 8 }}>
                                            <View style={styles.row}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                                    {socio.codigo} - {socio.nombre} ({socio.cantidad} venta{socio.cantidad > 1 ? 's' : ''}): {socio.total.toFixed(2)}€
                                                </Text>
                                            </View>
                                            {socio.productos && socio.productos.length > 0 && (
                                                <View style={{ marginLeft: 10, marginTop: 3 }}>
                                                    <View style={styles.table}>
                                                        <View style={[styles.tableRow, styles.tableHeader]}>
                                                            <View style={styles.tableCol}>
                                                                <Text style={styles.tableCell}>Producto</Text>
                                                            </View>
                                                            <View style={styles.tableCol}>
                                                                <Text style={styles.tableCell}>Cantidad</Text>
                                                            </View>
                                                            <View style={styles.tableCol}>
                                                                <Text style={styles.tableCell}>Total</Text>
                                                            </View>
                                                        </View>
                                                        {socio.productos.map((producto: any, prodIndex: number) => (
                                                            <View key={prodIndex} style={styles.tableRow}>
                                                                <View style={styles.tableCol}>
                                                                    <Text style={styles.tableCell}>{producto.nombre}</Text>
                                                                </View>
                                                                <View style={styles.tableCol}>
                                                                    <Text style={styles.tableCell}>{producto.cantidad}</Text>
                                                                </View>
                                                                <View style={styles.tableCol}>
                                                                    <Text style={styles.tableCell}>{producto.total.toFixed(2)}€</Text>
                                                                </View>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </>
                            )}

                            <View style={styles.totalRow}>
                                <Text style={styles.label}>Total Trabajador:</Text>
                                <Text style={styles.value}>{datos.total.toFixed(2)}€</Text>
                            </View>
                        </View>
                    ))}

                    {/* Totales Generales */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Totales Generales</Text>
                        {Object.entries(totalesGenerales.categorias)
                            .filter(([_, total]) => total > 0)
                            .map(([categoria, total]) => (
                                <View key={categoria} style={styles.row}>
                                    <Text style={styles.label}>Total {categoria.charAt(0).toUpperCase() + categoria.slice(1)}:</Text>
                                    <Text style={styles.value}>{(total as number).toFixed(2)}€</Text>
                                </View>
                            ))}
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Total General:</Text>
                            <Text style={styles.value}>{totalesGenerales.total.toFixed(2)}€</Text>
                        </View>
                    </View>

                    {/* Totales por Método de Pago */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Totales por Método de Pago</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Efectivo:</Text>
                            <Text style={styles.value}>{totalesPorMetodoPago.efectivo.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Tarjeta:</Text>
                            <Text style={styles.value}>{totalesPorMetodoPago.tarjeta.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Total:</Text>
                            <Text style={styles.value}>{(totalesPorMetodoPago.efectivo + totalesPorMetodoPago.tarjeta).toFixed(2)}€</Text>
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