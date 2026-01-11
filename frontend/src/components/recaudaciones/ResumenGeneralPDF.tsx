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
                setCategorias(data);
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };
        fetchCategorias();
    }, [token]);

    // Agrupar ventas por trabajador/usuario usando useMemo para evitar recalcular
    const { ventasPorTrabajador, totalesGenerales, totalesPorMetodoPago, productosAcumulados } = useMemo(() => {
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
            // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
            const montoVenta = venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined 
                ? (venta as any).pagadoRecaudacion 
                : (venta.pagado || 0);
            const pagadoRedondeado = Number(montoVenta.toFixed(2));
            acc[key].total = Number((acc[key].total + pagadoRedondeado).toFixed(2));

            // Método de pago
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
                acc[key].metodoPago.efectivo = Number((acc[key].metodoPago.efectivo + pagadoRedondeado).toFixed(2));
            } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
                acc[key].metodoPago.tarjeta = Number((acc[key].metodoPago.tarjeta + pagadoRedondeado).toFixed(2));
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
            socioData.total = Number((socioData.total + pagadoRedondeado).toFixed(2));

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
                    prodData.total = Number((prodData.total + Number((producto.total || 0).toFixed(2))).toFixed(2));
                });
            }
            
            if (venta.tipo === 'RESERVA') {
                // Para reservas, distribuir el pagado proporcionalmente
                if (esVentaNueva) {
                    // Usar el pagado de esta transacción para las categorías
                    acc[key].categorias.reservas = Number((acc[key].categorias.reservas + pagadoRedondeado).toFixed(2));
                    // Agregar reserva como producto
                    const productoKey = `Reserva - ${venta.detalles[0]?.nombre || 'Reserva'}`;
                    if (!acc[key].productos.has(productoKey)) {
                        acc[key].productos.set(productoKey, { cantidad: 0, total: 0 });
                    }
                    const productoData = acc[key].productos.get(productoKey);
                    productoData.cantidad += 1;
                    productoData.total = Number((productoData.total + pagadoRedondeado).toFixed(2));
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
                        const productoTotalRedondeado = Number((producto.total || 0).toFixed(2));
                        const totalProductosRedondeado = Number(totalProductos.toFixed(2));
                        const proporcion = totalProductosRedondeado > 0 ? productoTotalRedondeado / totalProductosRedondeado : 0;
                        const montoCategoria = Number((pagadoRedondeado * proporcion).toFixed(2));
                        
                        // Si la categoría existe en las categorías del inventario, usarla
                        // Si no, usar 'otros'
                        if (categorias.includes(categoria) && acc[key].categorias[categoriaLower] !== undefined) {
                            acc[key].categorias[categoriaLower] = Number((acc[key].categorias[categoriaLower] + montoCategoria).toFixed(2));
                        } else {
                            acc[key].categorias.otros = Number((acc[key].categorias.otros + montoCategoria).toFixed(2));
                        }

                        // Agregar producto al detalle (usar el total del producto para cantidad/precio)
                        const productoKey = producto.nombre;
                        if (!acc[key].productos.has(productoKey)) {
                            acc[key].productos.set(productoKey, { cantidad: 0, total: 0 });
                        }
                        const productoData = acc[key].productos.get(productoKey);
                        productoData.cantidad += producto.cantidad;
                        // Para productos, usar el total del producto (no el pagado proporcional)
                        productoData.total = Number((productoData.total + productoTotalRedondeado).toFixed(2));
                    });
                    ventasProcesadas.add(ventaKey);
                } else {
                    // Si ya procesamos esta venta pero hay otro pago, distribuir este pago también
                    const totalProductos = venta.detalles.reduce((sum, p) => sum + p.total, 0);
                    
                    venta.detalles.forEach((producto) => {
                        const categoria = (producto.categoria || 'OTROS').toUpperCase();
                        const categoriaLower = categoria.toLowerCase();
                        
                        const productoTotalRedondeado = Number((producto.total || 0).toFixed(2));
                        const totalProductosRedondeado = Number(totalProductos.toFixed(2));
                        const proporcion = totalProductosRedondeado > 0 ? productoTotalRedondeado / totalProductosRedondeado : 0;
                        const montoCategoria = Number((pagadoRedondeado * proporcion).toFixed(2));
                        
                        if (categorias.includes(categoria) && acc[key].categorias[categoriaLower] !== undefined) {
                            acc[key].categorias[categoriaLower] = Number((acc[key].categorias[categoriaLower] + montoCategoria).toFixed(2));
                        } else {
                            acc[key].categorias.otros = Number((acc[key].categorias.otros + montoCategoria).toFixed(2));
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
            acc.total += Number((trabajador.total || 0).toFixed(2));
            Object.keys(trabajador.categorias).forEach(categoria => {
                if (!acc.categorias[categoria]) {
                    acc.categorias[categoria] = 0;
                }
                acc.categorias[categoria] += Number((trabajador.categorias[categoria] || 0).toFixed(2));
            });
            return acc;
        }, { total: 0, categorias: {} });
        
        // Redondear el total general
        totalesGeneralesResult.total = Number(totalesGeneralesResult.total.toFixed(2));
        Object.keys(totalesGeneralesResult.categorias).forEach(categoria => {
            totalesGeneralesResult.categorias[categoria] = Number(totalesGeneralesResult.categorias[categoria].toFixed(2));
        });

        // Calcular totales por método de pago
        const totalesPorMetodoPagoResult = ventas.reduce((acc: { efectivo: number; tarjeta: number }, venta) => {
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
            const montoVenta = venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined 
                ? (venta as any).pagadoRecaudacion 
                : (venta.pagado || 0);
            const pagadoRedondeado = Number(montoVenta.toFixed(2));
            if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
                acc.efectivo += pagadoRedondeado;
            } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
                acc.tarjeta += pagadoRedondeado;
            }
            return acc;
        }, { efectivo: 0, tarjeta: 0 });
        
        // Redondear los totales por método de pago
        totalesPorMetodoPagoResult.efectivo = Number(totalesPorMetodoPagoResult.efectivo.toFixed(2));
        totalesPorMetodoPagoResult.tarjeta = Number(totalesPorMetodoPagoResult.tarjeta.toFixed(2));


        // Convertir Maps a objetos para poder serializar y redondear valores
        const ventasPorTrabajadorSerializado: any = {};
        Object.keys(ventasPorTrabajadorResult).forEach(key => {
            const trabajador = ventasPorTrabajadorResult[key];
            ventasPorTrabajadorSerializado[key] = {
                ...trabajador,
                total: Number((trabajador.total || 0).toFixed(2)),
                categorias: Object.keys(trabajador.categorias).reduce((acc: any, cat) => {
                    acc[cat] = Number((trabajador.categorias[cat] || 0).toFixed(2));
                    return acc;
                }, {}),
                metodoPago: {
                    efectivo: Number((trabajador.metodoPago?.efectivo || 0).toFixed(2)),
                    tarjeta: Number((trabajador.metodoPago?.tarjeta || 0).toFixed(2))
                },
                productos: Array.from(trabajador.productos.entries()).map(([nombre, datos]: [string, any]) => ({
                    nombre,
                    cantidad: datos.cantidad || 0,
                    total: Number((datos.total || 0).toFixed(2))
                })),
                ventasPorSocio: Array.from(trabajador.ventasPorSocio.entries()).map(([codigo, datos]: [string, any]) => ({
                    codigo,
                    nombre: datos.nombre,
                    total: Number((datos.total || 0).toFixed(2)),
                    cantidad: datos.cantidad || 0,
                    productos: Array.from(datos.productos.entries()).map(([nombre, prodDatos]: [string, any]) => ({
                        nombre,
                        cantidad: prodDatos.cantidad || 0,
                        total: Number((prodDatos.total || 0).toFixed(2))
                    }))
                }))
            };
        });

        // Calcular productos acumulados (suma de todos los trabajadores)
        const productosAcumulados = new Map<string, { cantidad: number; total: number }>();
        Object.values(ventasPorTrabajadorSerializado).forEach((trabajador: any) => {
            // trabajador.productos ya es un array después de la serialización
            if (trabajador.productos && Array.isArray(trabajador.productos)) {
                trabajador.productos.forEach((producto: any) => {
                    const nombre = producto.nombre;
                    if (!productosAcumulados.has(nombre)) {
                        productosAcumulados.set(nombre, { cantidad: 0, total: 0 });
                    }
                    const prodData = productosAcumulados.get(nombre)!;
                    prodData.cantidad += producto.cantidad || 0;
                    prodData.total += Number((producto.total || 0).toFixed(2));
                });
            }
        });

        const productosAcumuladosArray = Array.from(productosAcumulados.entries())
            .map(([nombre, datos]) => ({
                nombre,
                cantidad: datos.cantidad,
                total: Number(datos.total.toFixed(2))
            }))
            .sort((a, b) => b.total - a.total); // Ordenar por total descendente

        return {
            ventasPorTrabajador: ventasPorTrabajadorSerializado,
            totalesGenerales: totalesGeneralesResult,
            totalesPorMetodoPago: totalesPorMetodoPagoResult,
            productosAcumulados: productosAcumuladosArray
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
                {/* Primera página: Productos Acumulados */}
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen de Productos</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Tabla de Productos Acumulados */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Productos Consumidos (Acumulado Total)</Text>
                        {productosAcumulados && productosAcumulados.length > 0 && (
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
                                {productosAcumulados.map((producto: any, index: number) => (
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
                                {/* Fila de totales */}
                                <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>TOTAL</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {productosAcumulados.reduce((sum, p) => sum + p.cantidad, 0)}
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {productosAcumulados.reduce((sum, p) => sum + p.total, 0).toFixed(2)}€
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

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

                {/* Páginas siguientes: Resumen por Trabajador */}
                {Object.entries(ventasPorTrabajador).map(([trabajador, datos]: [string, any]) => (
                    <Page key={trabajador} size="A4" style={styles.page}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Resumen de Productos</Text>
                            <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                            <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                        </View>

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

                            <View style={styles.totalRow}>
                                <Text style={styles.label}>Total Trabajador:</Text>
                                <Text style={styles.value}>{datos.total.toFixed(2)}€</Text>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                        </View>
                    </Page>
                ))}
            </Document>
        </PDFViewer>
    );
}; 