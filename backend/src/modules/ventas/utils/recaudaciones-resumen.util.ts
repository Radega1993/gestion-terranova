import { montoRecaudacion, roundMoney } from '../../../common/money';

export interface RecaudacionRow {
  _id: string | { toString(): string };
  tipo: string;
  fecha: string | Date;
  socio?: { codigo?: string; nombre?: string };
  usuario?: { _id?: string | { toString(): string }; username?: string };
  trabajador?: { _id?: string | { toString(): string }; nombre?: string; identificador?: string };
  total?: number;
  pagado?: number;
  pagadoRecaudacion?: number;
  metodoPago?: string;
  estado?: string;
  detalles?: Array<{
    nombre: string;
    cantidad: number;
    precio?: number;
    total: number;
    categoria?: string;
  }>;
  pagos?: Array<{ fecha?: string; monto?: number; metodoPago?: string }>;
}

export interface ResumenGeneralDto {
  totalesGenerales: {
    total: number;
    categorias: Record<string, number>;
  };
  totalesPorMetodoPago: { efectivo: number; tarjeta: number };
  porTrabajador: Array<{
    nombre: string;
    efectivo: number;
    tarjeta: number;
    total: number;
  }>;
  productos: Array<{ nombre: string; cantidad: number; total: number }>;
}

export interface ResumenSociosDto {
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

function metodoPagoDeFila(venta: RecaudacionRow): string {
  return (
    venta.metodoPago ||
    (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '') ||
    ''
  );
}

function etiquetaMetodo(metodoPago: string): string {
  if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') return 'Efectivo';
  if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') return 'Tarjeta';
  return metodoPago;
}

function fechaConsumoKey(fecha: string | Date): string {
  const d = new Date(fecha);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Agrega recaudaciones al formato usado por el PDF de resumen general.
 * Replica la lógica del frontend para no cambiar totales.
 */
export function buildResumenGeneral(
  ventas: RecaudacionRow[],
  categorias: string[],
): ResumenGeneralDto {
  const cats = (categorias || []).map((c) => String(c).toUpperCase());
  const ventasProcesadas = new Set<string>();

  type TrabAcc = {
    total: number;
    categorias: Record<string, number>;
    productos: Map<string, { cantidad: number; total: number }>;
    metodoPago: { efectivo: number; tarjeta: number };
  };

  const ventasPorTrabajador: Record<string, TrabAcc> = {};

  for (const venta of ventas) {
    const key = venta.trabajador
      ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
      : venta.usuario?.username || 'Sin usuario';

    if (!ventasPorTrabajador[key]) {
      ventasPorTrabajador[key] = {
        total: 0,
        categorias: cats.reduce(
          (acc, cat) => {
            acc[cat.toLowerCase()] = 0;
            return acc;
          },
          { reservas: 0, otros: 0 } as Record<string, number>,
        ),
        productos: new Map(),
        metodoPago: { efectivo: 0, tarjeta: 0 },
      };
    }

    const acc = ventasPorTrabajador[key];
    const pagadoRedondeado = roundMoney(montoRecaudacion({
      tipo: venta.tipo,
      pagado: venta.pagado ?? 0,
      pagadoRecaudacion: venta.pagadoRecaudacion,
    }));
    acc.total = roundMoney(acc.total + pagadoRedondeado);

    const metodoPago = metodoPagoDeFila(venta);
    if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
      acc.metodoPago.efectivo = roundMoney(acc.metodoPago.efectivo + pagadoRedondeado);
    } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
      acc.metodoPago.tarjeta = roundMoney(acc.metodoPago.tarjeta + pagadoRedondeado);
    }

    const ventaKey = `${String(venta._id)}-${venta.tipo}`;
    const esVentaNueva = !ventasProcesadas.has(ventaKey);
    const detalles = venta.detalles || [];

    if (venta.tipo === 'RESERVA') {
      acc.categorias.reservas = roundMoney(acc.categorias.reservas + pagadoRedondeado);
      const productoKey = `Reserva - ${detalles[0]?.nombre || 'Reserva'}`;
      if (!acc.productos.has(productoKey)) {
        acc.productos.set(productoKey, { cantidad: 0, total: 0 });
      }
      const productoData = acc.productos.get(productoKey)!;
      productoData.total = roundMoney(productoData.total + pagadoRedondeado);
      if (esVentaNueva) {
        productoData.cantidad += 1;
        ventasProcesadas.add(ventaKey);
      }
    } else if (esVentaNueva) {
      const totalProductos = detalles.reduce((sum, p) => sum + (p.total || 0), 0);
      for (const producto of detalles) {
        const categoria = (producto.categoria || 'OTROS').toUpperCase();
        const categoriaLower = categoria.toLowerCase();
        const productoTotalRedondeado = roundMoney(producto.total || 0);
        const totalProductosRedondeado = roundMoney(totalProductos);
        const proporcion =
          totalProductosRedondeado > 0 ? productoTotalRedondeado / totalProductosRedondeado : 0;
        const montoCategoria = roundMoney(pagadoRedondeado * proporcion);

        if (cats.includes(categoria) && acc.categorias[categoriaLower] !== undefined) {
          acc.categorias[categoriaLower] = roundMoney(
            acc.categorias[categoriaLower] + montoCategoria,
          );
        } else {
          acc.categorias.otros = roundMoney(acc.categorias.otros + montoCategoria);
        }

        const productoKey = producto.nombre;
        if (!acc.productos.has(productoKey)) {
          acc.productos.set(productoKey, { cantidad: 0, total: 0 });
        }
        const productoData = acc.productos.get(productoKey)!;
        productoData.cantidad += producto.cantidad;
        productoData.total = roundMoney(productoData.total + productoTotalRedondeado);
      }
      ventasProcesadas.add(ventaKey);
    } else {
      const totalProductos = detalles.reduce((sum, p) => sum + (p.total || 0), 0);
      for (const producto of detalles) {
        const categoria = (producto.categoria || 'OTROS').toUpperCase();
        const categoriaLower = categoria.toLowerCase();
        const productoTotalRedondeado = roundMoney(producto.total || 0);
        const totalProductosRedondeado = roundMoney(totalProductos);
        const proporcion =
          totalProductosRedondeado > 0 ? productoTotalRedondeado / totalProductosRedondeado : 0;
        const montoCategoria = roundMoney(pagadoRedondeado * proporcion);

        if (cats.includes(categoria) && acc.categorias[categoriaLower] !== undefined) {
          acc.categorias[categoriaLower] = roundMoney(
            acc.categorias[categoriaLower] + montoCategoria,
          );
        } else {
          acc.categorias.otros = roundMoney(acc.categorias.otros + montoCategoria);
        }
      }
    }
  }

  const totalesGenerales = Object.values(ventasPorTrabajador).reduce(
    (acc, trabajador) => {
      acc.total = roundMoney(acc.total + trabajador.total);
      Object.keys(trabajador.categorias).forEach((categoria) => {
        if (!acc.categorias[categoria]) acc.categorias[categoria] = 0;
        acc.categorias[categoria] = roundMoney(
          acc.categorias[categoria] + trabajador.categorias[categoria],
        );
      });
      return acc;
    },
    { total: 0, categorias: {} as Record<string, number> },
  );

  const totalesPorMetodoPago = ventas.reduce(
    (acc, venta) => {
      const metodoPago = metodoPagoDeFila(venta);
      const pagadoRedondeado = roundMoney(montoRecaudacion({
        tipo: venta.tipo,
        pagado: venta.pagado ?? 0,
        pagadoRecaudacion: venta.pagadoRecaudacion,
      }));
      if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
        acc.efectivo = roundMoney(acc.efectivo + pagadoRedondeado);
      } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
        acc.tarjeta = roundMoney(acc.tarjeta + pagadoRedondeado);
      }
      return acc;
    },
    { efectivo: 0, tarjeta: 0 },
  );

  const productosMap = new Map<string, { cantidad: number; total: number }>();
  Object.values(ventasPorTrabajador).forEach((trabajador) => {
    trabajador.productos.forEach((datos, nombre) => {
      if (!productosMap.has(nombre)) {
        productosMap.set(nombre, { cantidad: 0, total: 0 });
      }
      const prod = productosMap.get(nombre)!;
      prod.cantidad += datos.cantidad;
      prod.total = roundMoney(prod.total + datos.total);
    });
  });

  return {
    totalesGenerales,
    totalesPorMetodoPago,
    porTrabajador: Object.entries(ventasPorTrabajador)
      .map(([nombre, datos]) => ({
        nombre,
        efectivo: datos.metodoPago.efectivo,
        tarjeta: datos.metodoPago.tarjeta,
        total: datos.total,
      }))
      .sort((a, b) => b.total - a.total),
    productos: Array.from(productosMap.entries())
      .map(([nombre, datos]) => ({
        nombre,
        cantidad: datos.cantidad,
        total: datos.total,
      }))
      .sort((a, b) => b.total - a.total),
  };
}

export function buildResumenSocios(ventas: RecaudacionRow[]): ResumenSociosDto {
  const sociosMap = new Map<
    string,
    {
      codigo: string;
      nombre: string;
      totalPagado: number;
      totalVentas: number;
      diasConsumo: Set<string>;
      productos: Map<string, { cantidad: number; total: number }>;
      transacciones: ResumenSociosDto['socios'][0]['transacciones'];
    }
  >();

  for (const venta of ventas) {
    const codigoSocio = venta.socio?.codigo || 'SIN-CODIGO';
    if (!sociosMap.has(codigoSocio)) {
      sociosMap.set(codigoSocio, {
        codigo: codigoSocio,
        nombre: venta.socio?.nombre || '',
        totalPagado: 0,
        totalVentas: 0,
        diasConsumo: new Set(),
        productos: new Map(),
        transacciones: [],
      });
    }

    const socioData = sociosMap.get(codigoSocio)!;
    socioData.diasConsumo.add(fechaConsumoKey(venta.fecha));
    const montoVenta = montoRecaudacion({
      tipo: venta.tipo,
      pagado: venta.pagado ?? 0,
      pagadoRecaudacion: venta.pagadoRecaudacion,
    });
    socioData.totalPagado = roundMoney(socioData.totalPagado + montoVenta);
    socioData.totalVentas += 1;

    const metodoPago = metodoPagoDeFila(venta);
    const detalles = (venta.detalles || []).map((d) => ({
      nombre: d.nombre,
      cantidad: d.cantidad,
      total: d.total,
    }));

    socioData.transacciones.push({
      fecha: typeof venta.fecha === 'string' ? venta.fecha : new Date(venta.fecha).toISOString(),
      tipo: venta.tipo,
      productos: detalles,
      pagado: montoVenta,
      metodoPago: etiquetaMetodo(metodoPago),
    });

    for (const producto of venta.detalles || []) {
      const productoKey = producto.nombre;
      if (!socioData.productos.has(productoKey)) {
        socioData.productos.set(productoKey, { cantidad: 0, total: 0 });
      }
      const prodData = socioData.productos.get(productoKey)!;
      prodData.cantidad += producto.cantidad;
      prodData.total = roundMoney(prodData.total + (producto.total || 0));
    }
  }

  const socios = Array.from(sociosMap.values())
    .map((socio) => ({
      codigo: socio.codigo,
      nombre: socio.nombre,
      totalPagado: socio.totalPagado,
      totalVentas: socio.totalVentas,
      diasConsumo: Array.from(socio.diasConsumo).sort(),
      productos: Array.from(socio.productos.entries()).map(([nombre, datos]) => ({
        nombre,
        ...datos,
      })),
      transacciones: socio.transacciones,
    }))
    .sort((a, b) => b.totalPagado - a.totalPagado);

  const totales = socios.reduce(
    (acc, socio) => {
      acc.totalPagado = roundMoney(acc.totalPagado + socio.totalPagado);
      acc.totalVentas += socio.totalVentas;
      acc.totalSocios += 1;
      return acc;
    },
    { totalPagado: 0, totalVentas: 0, totalSocios: 0 },
  );

  return { totales, socios };
}
