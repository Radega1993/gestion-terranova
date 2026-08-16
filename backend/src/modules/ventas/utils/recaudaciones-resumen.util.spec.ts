import { montoRecaudacion, roundMoney } from '../../../common/money';
import {
  buildResumenGeneral,
  buildResumenSocios,
  RecaudacionRow,
} from './recaudaciones-resumen.util';

function sumMonto(filas: RecaudacionRow[]): number {
  return roundMoney(
    filas.reduce(
      (sum, rec) =>
        sum +
        montoRecaudacion({
          tipo: rec.tipo,
          pagado: rec.pagado ?? 0,
          pagadoRecaudacion: rec.pagadoRecaudacion,
        }),
      0,
    ),
  );
}

describe('recaudaciones-resumen.util', () => {
  describe('buildResumenGeneral', () => {
    it('total general = suma de montoRecaudacion de las filas', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'A' },
          usuario: { username: 'admin' },
          pagado: 10,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'Coca', cantidad: 2, total: 10, categoria: 'BEBIDAS' }],
        },
        {
          _id: 'v2',
          tipo: 'VENTA',
          fecha: '2026-07-13T11:00:00.000Z',
          socio: { codigo: 'S002', nombre: 'B' },
          usuario: { username: 'admin' },
          pagado: 5,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'Snack', cantidad: 1, total: 5, categoria: 'COMIDA' }],
        },
      ];

      const resumen = buildResumenGeneral(filas, ['BEBIDAS', 'COMIDA']);
      expect(resumen.totalesGenerales.total).toBe(sumMonto(filas));
      expect(resumen.totalesGenerales.total).toBe(15);
    });

    it('separa efectivo y tarjeta', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          usuario: { username: 'caja' },
          pagado: 20,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'A', cantidad: 1, total: 20, categoria: 'OTROS' }],
        },
        {
          _id: 'v2',
          tipo: 'VENTA',
          fecha: '2026-07-13T11:00:00.000Z',
          usuario: { username: 'caja' },
          pagado: 7.5,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'B', cantidad: 1, total: 7.5, categoria: 'OTROS' }],
        },
      ];

      const resumen = buildResumenGeneral(filas, []);
      expect(resumen.totalesPorMetodoPago.efectivo).toBe(20);
      expect(resumen.totalesPorMetodoPago.tarjeta).toBe(7.5);
    });

    it('reparte pagado por categorías y acumula productos', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          usuario: { username: 'admin' },
          pagado: 30,
          metodoPago: 'EFECTIVO',
          detalles: [
            { nombre: 'Cerveza', cantidad: 2, total: 10, categoria: 'BEBIDAS' },
            { nombre: 'Bocadillo', cantidad: 1, total: 20, categoria: 'COMIDA' },
          ],
        },
      ];

      const resumen = buildResumenGeneral(filas, ['BEBIDAS', 'COMIDA']);
      expect(resumen.totalesGenerales.categorias.bebidas).toBe(10);
      expect(resumen.totalesGenerales.categorias.comida).toBe(20);
      expect(resumen.productos).toEqual(
        expect.arrayContaining([
          { nombre: 'Cerveza', cantidad: 2, total: 10 },
          { nombre: 'Bocadillo', cantidad: 1, total: 20 },
        ]),
      );
    });

    it('reserva va a reservas y no duplica cantidad en pagos parciales', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'r1',
          tipo: 'RESERVA',
          fecha: '2026-07-13T10:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'Ana' },
          usuario: { username: 'admin' },
          pagado: 40,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'Piscina', cantidad: 1, total: 100 }],
        },
        {
          _id: 'r1',
          tipo: 'RESERVA',
          fecha: '2026-07-13T12:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'Ana' },
          usuario: { username: 'admin' },
          pagado: 60,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'Piscina', cantidad: 1, total: 100 }],
        },
      ];

      const resumen = buildResumenGeneral(filas, []);
      expect(resumen.totalesGenerales.total).toBe(100);
      expect(resumen.totalesGenerales.categorias.reservas).toBe(100);
      const reservaProd = resumen.productos.find((p) => p.nombre === 'Reserva - Piscina');
      expect(reservaProd).toEqual({ nombre: 'Reserva - Piscina', cantidad: 1, total: 100 });
      expect(resumen.totalesPorMetodoPago.efectivo).toBe(40);
      expect(resumen.totalesPorMetodoPago.tarjeta).toBe(60);
    });

    it('cambio/devolución con pagadoRecaudacion negativo reduce el total', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          usuario: { username: 'admin' },
          pagado: 10,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'A', cantidad: 1, total: 10, categoria: 'OTROS' }],
        },
        {
          _id: 'c1',
          tipo: 'CAMBIO',
          fecha: '2026-07-13T11:00:00.000Z',
          usuario: { username: 'admin' },
          pagado: 3,
          pagadoRecaudacion: -3,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'Cambio', cantidad: 1, total: 3 }],
        },
        {
          _id: 'd1',
          tipo: 'DEVOLUCION',
          fecha: '2026-07-13T12:00:00.000Z',
          usuario: { username: 'admin' },
          pagado: 2,
          pagadoRecaudacion: -2,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'Dev', cantidad: 1, total: 2 }],
        },
      ];

      const resumen = buildResumenGeneral(filas, []);
      expect(resumen.totalesGenerales.total).toBe(sumMonto(filas));
      expect(resumen.totalesGenerales.total).toBe(5);
    });

    it('agrupa por trabajador cuando existe, si no por username', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          usuario: { username: 'admin' },
          trabajador: { nombre: 'Pepe', identificador: 'T01' },
          pagado: 10,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'A', cantidad: 1, total: 10 }],
        },
        {
          _id: 'v2',
          tipo: 'VENTA',
          fecha: '2026-07-13T11:00:00.000Z',
          usuario: { username: 'junta' },
          pagado: 4,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'B', cantidad: 1, total: 4 }],
        },
      ];

      const resumen = buildResumenGeneral(filas, []);
      const nombres = resumen.porTrabajador.map((t) => t.nombre);
      expect(nombres).toContain('Pepe (T01)');
      expect(nombres).toContain('junta');
      expect(resumen.porTrabajador.find((t) => t.nombre === 'Pepe (T01)')?.total).toBe(10);
      expect(resumen.porTrabajador.find((t) => t.nombre === 'junta')?.total).toBe(4);
    });
  });

  describe('buildResumenSocios', () => {
    it('un socio: totales, días, productos y transacciones', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'Cliente Uno' },
          usuario: { username: 'admin' },
          pagado: 10,
          metodoPago: 'EFECTIVO',
          detalles: [
            { nombre: 'Coca', cantidad: 2, total: 6 },
            { nombre: 'Snack', cantidad: 1, total: 4 },
          ],
        },
        {
          _id: 'v2',
          tipo: 'VENTA',
          fecha: '2026-07-14T10:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'Cliente Uno' },
          usuario: { username: 'admin' },
          pagado: 5,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'Coca', cantidad: 1, total: 5 }],
        },
      ];

      const resumen = buildResumenSocios(filas);
      expect(resumen.socios).toHaveLength(1);
      const socio = resumen.socios[0];
      expect(socio.codigo).toBe('S001');
      expect(socio.totalPagado).toBe(15);
      expect(socio.totalVentas).toBe(2);
      expect(socio.diasConsumo).toHaveLength(2);
      expect(socio.transacciones).toHaveLength(2);
      expect(socio.productos.find((p) => p.nombre === 'Coca')?.cantidad).toBe(3);
      expect(resumen.totales).toEqual({
        totalSocios: 1,
        totalVentas: 2,
        totalPagado: 15,
      });
    });

    it('varios socios ordenados por totalPagado desc y totales coherentes', () => {
      const filas: RecaudacionRow[] = [
        {
          _id: 'v1',
          tipo: 'VENTA',
          fecha: '2026-07-13T10:00:00.000Z',
          socio: { codigo: 'S001', nombre: 'Bajo' },
          usuario: { username: 'admin' },
          pagado: 3,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'A', cantidad: 1, total: 3 }],
        },
        {
          _id: 'v2',
          tipo: 'VENTA',
          fecha: '2026-07-13T11:00:00.000Z',
          socio: { codigo: 'S002', nombre: 'Alto' },
          usuario: { username: 'admin' },
          pagado: 20,
          metodoPago: 'TARJETA',
          detalles: [{ nombre: 'B', cantidad: 1, total: 20 }],
        },
        {
          _id: 'c1',
          tipo: 'CAMBIO',
          fecha: '2026-07-13T12:00:00.000Z',
          socio: { codigo: 'S002', nombre: 'Alto' },
          usuario: { username: 'admin' },
          pagado: 2,
          pagadoRecaudacion: -2,
          metodoPago: 'EFECTIVO',
          detalles: [{ nombre: 'Cambio', cantidad: 1, total: 2 }],
        },
      ];

      const resumen = buildResumenSocios(filas);
      expect(resumen.socios.map((s) => s.codigo)).toEqual(['S002', 'S001']);
      expect(resumen.socios[0].totalPagado).toBe(18);
      expect(resumen.totales.totalSocios).toBe(2);
      expect(resumen.totales.totalPagado).toBe(sumMonto(filas));
      expect(resumen.totales.totalVentas).toBe(3);
    });
  });
});
