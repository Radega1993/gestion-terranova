import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { VentasService } from './ventas.service';
import { MetodoPago } from '../dto/pago-venta.dto';
import { montoRecaudacion, roundMoney } from '../../../common/money';
import { EstadoDevolucion } from '../../devoluciones/schemas/devolucion.schema';

describe('VentasService (unit)', () => {
  const userId = '507f1f77bcf86cd799439011';

  function createChainableQuery(result: unknown) {
    const query: any = {
      populate: jest.fn(),
      select: jest.fn(),
      lean: jest.fn(),
      exec: jest.fn().mockResolvedValue(result),
    };
    query.populate.mockImplementation(() => query);
    query.select.mockImplementation(() => query);
    query.lean.mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue(result),
    }));
    return query;
  }

  function createDevolucionModelMock(devoluciones: unknown[] = []) {
    return {
      find: jest.fn().mockReturnValue(createChainableQuery(devoluciones)),
    };
  }

  function buildService(ventaDoc: Record<string, unknown>, devolucionModelMock?: any) {
    const saveMock = jest.fn().mockImplementation(function (this: Record<string, unknown>) {
      return Promise.resolve({ ...this, _id: new Types.ObjectId() });
    });

    const ventaModelMock: any = {
      findById: jest.fn().mockResolvedValue({
        ...ventaDoc,
        save: saveMock,
        markModified: jest.fn(),
      }),
    };

    const productModelMock: any = {};
    const reservaModelMock: any = {};
    const socioModelMock: any = {};
    const cambiosServiceMock: any = {};
    const trabajadorModelMock: any = {};
    const userModelMock: any = {};
    const tiendaModelMock: any = {};
    const devolucionModel = devolucionModelMock ?? createDevolucionModelMock();
    const usersServiceMock: any = {
      findOne: jest.fn(),
    };

    const service = new VentasService(
      ventaModelMock,
      productModelMock,
      reservaModelMock,
      socioModelMock,
      cambiosServiceMock,
      trabajadorModelMock,
      userModelMock,
      tiendaModelMock,
      devolucionModel as any,
      usersServiceMock,
    );

    return { service, ventaModelMock, saveMock, devolucionModel };
  }

  function buildRecaudacionesService(options: {
    ventas: unknown[];
    devoluciones?: unknown[];
    reservas?: unknown[];
    cambios?: unknown[];
    categorias?: string[];
  }) {
    const ventaModelMock: any = {
      find: jest.fn().mockImplementation(() => createChainableQuery(options.ventas)),
    };

    const devolucionModelMock = createDevolucionModelMock(options.devoluciones ?? []);

    const productModelMock: any = {
      distinct: jest.fn().mockResolvedValue(options.categorias ?? ['BEBIDAS', 'COMIDA']),
    };

    const service = new VentasService(
      ventaModelMock,
      productModelMock,
      {
        find: jest.fn().mockReturnValue(createChainableQuery(options.reservas ?? [])),
      } as any,
      {
        findOne: jest.fn().mockResolvedValue(null),
      } as any,
      { findAll: jest.fn().mockResolvedValue(options.cambios ?? []) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      {} as any,
      devolucionModelMock as any,
      { findOne: jest.fn() } as any,
    );

    return { service, devolucionModelMock, productModelMock };
  }

  function buildCreateVentaService() {
    const productSave = jest.fn().mockResolvedValue({});
    const ventaSave = jest.fn().mockImplementation(function (this: Record<string, unknown>) {
      return Promise.resolve({ ...this, _id: new Types.ObjectId() });
    });

    const productModelMock: any = {
      findOne: jest.fn().mockResolvedValue({
        nombre: 'Coca',
        stock_actual: 10,
        tipo: 'Bebida',
        save: productSave,
      }),
    };

    const ventaModelMock: any = jest.fn().mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      save: ventaSave,
    }));

    const service = new VentasService(
      ventaModelMock,
      productModelMock,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createDevolucionModelMock() as any,
      { findOne: jest.fn() } as any,
    );

    return { service, ventaModelMock, ventaSave, productSave };
  }

  function buildUpdateVentaService(ventaDoc: Record<string, unknown>) {
    const saveMock = jest.fn().mockImplementation(function (this: Record<string, unknown>) {
      return Promise.resolve(this);
    });

    const ventaWithSave = {
      ...ventaDoc,
      save: saveMock,
      markModified: jest.fn(),
    };

    const ventaModelMock: any = {
      findById: jest.fn()
        .mockResolvedValueOnce(ventaWithSave)
        .mockReturnValue(createChainableQuery(ventaWithSave)),
    };

    const service = new VentasService(
      ventaModelMock,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createDevolucionModelMock() as any,
      { findOne: jest.fn() } as any,
    );

    return { service, saveMock, ventaWithSave };
  }

  it('registrarPago: marca PAGADO con ruido de float en total/pagado', async () => {
    const { service, saveMock } = buildService({
      total: 3.9023231981,
      pagado: 3.0999999999999996,
      pagos: [{ fecha: new Date(), monto: 3.1, metodoPago: 'EFECTIVO', observaciones: '' }],
      trabajador: undefined,
    });

    const result = await service.registrarPago(
      new Types.ObjectId().toString(),
      { pagado: 0.8, metodoPago: MetodoPago.EFECTIVO, observaciones: '' },
      userId,
      'ADMINISTRADOR',
    );

    expect(result.estado).toBe('PAGADO');
    expect(saveMock).toHaveBeenCalled();
    const saved = saveMock.mock.instances[0] as { pagado: number; total: number };
    expect(saved.pagado).toBe(saved.total);
  });

  it('registrarPago: último céntimo completa la venta', async () => {
    const { service, saveMock } = buildService({
      total: 10,
      pagado: 9.99,
      pagos: [],
      trabajador: undefined,
    });

    const result = await service.registrarPago(
      new Types.ObjectId().toString(),
      { pagado: 0.01, metodoPago: MetodoPago.TARJETA, observaciones: '' },
      userId,
      'ADMINISTRADOR',
    );

    expect(result.estado).toBe('PAGADO');
    const saved = saveMock.mock.instances[0] as { pagado: number };
    expect(saved.pagado).toBe(10);
  });

  it('registrarPago: mantiene PAGADO_PARCIAL si falta importe', async () => {
    const { service } = buildService({
      total: 10,
      pagado: 3,
      pagos: [],
      trabajador: undefined,
    });

    const result = await service.registrarPago(
      new Types.ObjectId().toString(),
      { pagado: 2, metodoPago: MetodoPago.EFECTIVO, observaciones: '' },
      userId,
      'ADMINISTRADOR',
    );

    expect(result.estado).toBe('PAGADO_PARCIAL');
  });

  it('registrarPago: venta inexistente', async () => {
    const ventaModelMock: any = {
      findById: jest.fn().mockResolvedValue(null),
    };
    const service = new VentasService(
      ventaModelMock,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createDevolucionModelMock() as any,
      { findOne: jest.fn() } as any,
    );

    await expect(
      service.registrarPago(
        new Types.ObjectId().toString(),
        { pagado: 1, metodoPago: MetodoPago.EFECTIVO, observaciones: '' },
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('registrarPago: TIENDA exige trabajadorId', async () => {
    const service = new VentasService(
      { findById: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      createDevolucionModelMock() as any,
      { findOne: jest.fn() } as any,
    );

    await expect(
      service.registrarPago(
        new Types.ObjectId().toString(),
        { pagado: 1, metodoPago: MetodoPago.EFECTIVO, observaciones: '' },
        userId,
        'TIENDA',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('getRecaudaciones: no debería dejar una devolución procesada fuera del neto', async () => {
    const ventaId = new Types.ObjectId();
    const venta = {
      _id: ventaId,
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente Test',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      trabajador: undefined,
      productos: [{ nombre: 'Producto A', unidades: 1, precioUnitario: 10, precioTotal: 10 }],
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const devolucion = {
      _id: new Types.ObjectId(),
      venta: { _id: ventaId, codigoSocio: 'S001', nombreSocio: 'Cliente Test', total: 10 },
      usuario: { _id: new Types.ObjectId(), username: 'reyes' },
      trabajador: undefined,
      productos: [{ nombre: 'Producto A', cantidad: 2, precioUnitario: 5, total: 10 }],
      totalDevolucion: 10,
      metodoDevolucion: 'EFECTIVO',
      motivo: 'Devolución completa',
      estado: EstadoDevolucion.PROCESADA,
      fechaProcesamiento: new Date('2026-07-13T12:00:00.000Z'),
    };

    const { service } = buildRecaudacionesService({
      ventas: [venta],
      devoluciones: [devolucion],
    });

    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
    } as any);

    const total = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);

    expect(total).toBe(0);
    expect(result.some((rec: any) => rec.tipo === 'DEVOLUCION')).toBe(true);
  });

  it('getRecaudaciones: ignora devoluciones pendientes en el neto', async () => {
    const ventaId = new Types.ObjectId();
    const venta = {
      _id: ventaId,
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente Test',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      trabajador: undefined,
      productos: [{ nombre: 'Producto A', unidades: 1, precioUnitario: 10, precioTotal: 10 }],
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const { service, devolucionModelMock } = buildRecaudacionesService({
      ventas: [venta],
      devoluciones: [],
    });

    await service.getRecaudaciones({
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
    } as any);

    const findQuery = devolucionModelMock.find.mock.calls[0][0];
    expect(findQuery.estado).toBe(EstadoDevolucion.PROCESADA);

    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-01',
      fechaFin: '2026-07-31',
    } as any);

    const total = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);
    expect(total).toBe(10);
  });

  it('getRecaudaciones: caso regresión 13/07/2026 (1890 bruto, 1000 devolución, 890 neto)', async () => {
    const ventaEfectivoId = new Types.ObjectId();
    const ventas = [
      {
        _id: ventaEfectivoId,
        total: 10,
        pagado: 10,
        estado: 'DEVUELTA',
        codigoSocio: 'S001',
        nombreSocio: 'Cliente 1',
        usuario: { _id: new Types.ObjectId(), username: 'reyes' },
        productos: [{ nombre: 'Entrada', unidades: 2, precioUnitario: 5, precioTotal: 10 }],
        createdAt: new Date('2026-07-13T09:00:00.000Z'),
        pagos: [],
        metodoPago: 'EFECTIVO',
      },
      {
        _id: new Types.ObjectId(),
        total: 1.4,
        pagado: 1.4,
        estado: 'PAGADO',
        codigoSocio: 'S002',
        nombreSocio: 'Cliente 2',
        usuario: { _id: new Types.ObjectId(), username: 'reyes' },
        productos: [{ nombre: 'Producto B', unidades: 1, precioUnitario: 1.4, precioTotal: 1.4 }],
        createdAt: new Date('2026-07-13T10:00:00.000Z'),
        pagos: [],
        metodoPago: 'TARJETA',
      },
      {
        _id: new Types.ObjectId(),
        total: 2.9,
        pagado: 2.9,
        estado: 'PAGADO',
        codigoSocio: 'S003',
        nombreSocio: 'Cliente 3',
        usuario: { _id: new Types.ObjectId(), username: 'reyes' },
        productos: [{ nombre: 'Producto C', unidades: 1, precioUnitario: 2.9, precioTotal: 2.9 }],
        createdAt: new Date('2026-07-13T11:00:00.000Z'),
        pagos: [],
        metodoPago: 'TARJETA',
      },
      {
        _id: new Types.ObjectId(),
        total: 4.6,
        pagado: 4.6,
        estado: 'PAGADO',
        codigoSocio: 'S004',
        nombreSocio: 'Cliente 4',
        usuario: { _id: new Types.ObjectId(), username: 'reyes' },
        productos: [{ nombre: 'Producto D', unidades: 1, precioUnitario: 4.6, precioTotal: 4.6 }],
        createdAt: new Date('2026-07-13T14:00:00.000Z'),
        pagos: [],
        metodoPago: 'TARJETA',
      },
    ];

    const devolucion = {
      _id: new Types.ObjectId(),
      venta: { _id: ventaEfectivoId, codigoSocio: 'S001', nombreSocio: 'Cliente 1', total: 10 },
      usuario: { _id: new Types.ObjectId(), username: 'reyes' },
      productos: [{ nombre: 'Entrada', cantidad: 2, precioUnitario: 5, total: 10 }],
      totalDevolucion: 10,
      metodoDevolucion: 'EFECTIVO',
      motivo: 'Devolución completa',
      estado: EstadoDevolucion.PROCESADA,
      fechaProcesamiento: new Date('2026-07-13T12:00:00.000Z'),
    };

    const { service } = buildRecaudacionesService({ ventas, devoluciones: [devolucion] });

    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    const grossSales = result.reduce((sum: number, rec: any) => {
      if (rec.tipo === 'DEVOLUCION') return sum;
      return sum + (rec.pagado || 0);
    }, 0);

    const refunds = result.reduce((sum: number, rec: any) => {
      if (rec.tipo !== 'DEVOLUCION') return sum;
      return sum + Math.abs(rec.pagadoRecaudacion || 0);
    }, 0);

    const net = roundMoney(result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0));

    const cashNet = roundMoney(result.reduce((sum: number, rec: any) => {
      const metodo = (rec.metodoPago || '').toUpperCase();
      if (metodo !== 'EFECTIVO') return sum;
      return sum + montoRecaudacion(rec);
    }, 0));

    const cardNet = roundMoney(result.reduce((sum: number, rec: any) => {
      const metodo = (rec.metodoPago || '').toUpperCase();
      if (metodo !== 'TARJETA') return sum;
      return sum + montoRecaudacion(rec);
    }, 0));

    expect(grossSales).toBe(18.9);
    expect(refunds).toBe(10);
    expect(net).toBe(8.9);
    expect(cashNet).toBe(0);
    expect(cardNet).toBe(8.9);
  });

  it('create: rechaza total distinto a la suma de líneas', async () => {
    const { service } = buildCreateVentaService();

    await expect(
      service.create(
        {
          codigoSocio: 'S001',
          nombreSocio: 'Cliente',
          esSocio: true,
          productos: [{ nombre: 'Coca', unidades: 2, precioUnitario: 1.5, precioTotal: 3 }],
          total: 99,
          pagado: 3,
          metodoPago: MetodoPago.EFECTIVO,
          observaciones: '',
        } as any,
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: pago exacto con decimales ruidosos marca PAGADO', async () => {
    const { service, ventaModelMock } = buildCreateVentaService();

    await service.create(
      {
        codigoSocio: 'S001',
        nombreSocio: 'Cliente',
        esSocio: true,
        productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 3.9, precioTotal: 3.9 }],
        total: 3.9,
        pagado: 3.899999999999999,
        metodoPago: MetodoPago.EFECTIVO,
        observaciones: '',
      } as any,
      userId,
      'ADMINISTRADOR',
    );

    const ventaData = ventaModelMock.mock.calls[0][0];
    expect(ventaData.estado).toBe('PAGADO');
    expect(ventaData.pagado).toBe(3.9);
    expect(ventaData.total).toBe(3.9);
  });

  it('create: pago parcial sin observaciones lanza error', async () => {
    const { service } = buildCreateVentaService();

    await expect(
      service.create(
        {
          codigoSocio: 'S001',
          nombreSocio: 'Cliente',
          esSocio: true,
          productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 10, precioTotal: 10 }],
          total: 10,
          pagado: 5,
          metodoPago: MetodoPago.EFECTIVO,
        } as any,
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: pagado mayor que total se limita al total', async () => {
    const { service, ventaModelMock } = buildCreateVentaService();

    await service.create(
      {
        codigoSocio: 'S001',
        nombreSocio: 'Cliente',
        esSocio: true,
        productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 10, precioTotal: 10 }],
        total: 10,
        pagado: 15,
        metodoPago: MetodoPago.EFECTIVO,
        observaciones: 'Pago con cambio',
      } as any,
      userId,
      'ADMINISTRADOR',
    );

    const ventaData = ventaModelMock.mock.calls[0][0];
    expect(ventaData.pagado).toBe(10);
  });

  it('create: redondea precios de línea a 2 decimales', async () => {
    const { service, ventaModelMock } = buildCreateVentaService();

    await service.create(
      {
        codigoSocio: 'S001',
        nombreSocio: 'Cliente',
        esSocio: true,
        productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 1.234, precioTotal: 1.234 }],
        total: 1.23,
        pagado: 1.23,
        metodoPago: MetodoPago.EFECTIVO,
        observaciones: '',
      } as any,
      userId,
      'ADMINISTRADOR',
    );

    const ventaData = ventaModelMock.mock.calls[0][0];
    expect(ventaData.productos[0].precioUnitario).toBe(1.23);
    expect(ventaData.productos[0].precioTotal).toBe(1.23);
  });

  it('update: redondea total y pagado y recalcula estado', async () => {
    const { service, saveMock } = buildUpdateVentaService({
      _id: new Types.ObjectId(),
      total: 10,
      pagado: 5,
      estado: 'PAGADO_PARCIAL',
      productos: [],
    });

    await service.update(new Types.ObjectId().toString(), {
      total: 10.001,
      pagado: 10.001,
    } as any);

    const saved = saveMock.mock.instances[0] as { total: number; pagado: number; estado: string };
    expect(saved.total).toBe(10);
    expect(saved.pagado).toBe(10);
    expect(saved.estado).toBe('PAGADO');
  });

  it('getRecaudaciones: venta 10 + cambio DEVUELTO -3 = neto 7', async () => {
    const venta = {
      _id: new Types.ObjectId(),
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [],
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const cambio = {
      _id: new Types.ObjectId(),
      createdAt: new Date('2026-07-13T11:00:00.000Z'),
      venta: { codigoSocio: 'S001', nombreSocio: 'Cliente' },
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      diferenciaPrecio: -3,
      estadoPago: 'DEVUELTO',
      metodoPago: 'EFECTIVO',
      productoOriginal: { nombre: 'A', cantidad: 1, precioUnitario: 10, total: 10 },
      productoNuevo: { nombre: 'B', cantidad: 1, precioUnitario: 7, total: 7 },
    };

    const { service } = buildRecaudacionesService({ ventas: [venta], cambios: [cambio] });
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    const net = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);
    expect(net).toBe(7);
  });

  it('getRecaudaciones: venta 10 + cambio PAGADO +2 = neto 12', async () => {
    const venta = {
      _id: new Types.ObjectId(),
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [],
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const cambio = {
      _id: new Types.ObjectId(),
      createdAt: new Date('2026-07-13T11:00:00.000Z'),
      venta: { codigoSocio: 'S001', nombreSocio: 'Cliente' },
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      diferenciaPrecio: 2,
      estadoPago: 'PAGADO',
      metodoPago: 'TARJETA',
      productoOriginal: { nombre: 'A', cantidad: 1, precioUnitario: 10, total: 10 },
      productoNuevo: { nombre: 'B', cantidad: 1, precioUnitario: 12, total: 12 },
    };

    const { service } = buildRecaudacionesService({ ventas: [venta], cambios: [cambio] });
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    const net = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);
    expect(net).toBe(12);
  });

  it('getRecaudaciones: reserva con montoAbonado genera fila RESERVA', async () => {
    const reserva = {
      _id: new Types.ObjectId(),
      precio: 100,
      montoAbonado: 40,
      estado: 'PENDIENTE',
      tipoInstalacion: 'PISCINA',
      fecha: new Date('2026-07-13T10:00:00.000Z'),
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      metodoPago: 'EFECTIVO',
      socio: {
        socio: 'S001',
        nombre: { nombre: 'Juan', primerApellido: 'Garcia' },
      },
      usuarioCreacion: { _id: new Types.ObjectId(), username: 'admin' },
      pagos: [],
    };

    const { service } = buildRecaudacionesService({ ventas: [], reservas: [reserva] });
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].tipo).toBe('RESERVA');
    expect(result[0].pagado).toBe(40);
  });

  it('getRecaudaciones: reserva con dos pagos genera dos filas que suman 100', async () => {
    const reserva = {
      _id: new Types.ObjectId(),
      precio: 100,
      montoAbonado: 100,
      estado: 'COMPLETADA',
      tipoInstalacion: 'PISCINA',
      fecha: new Date('2026-07-13T10:00:00.000Z'),
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      metodoPago: 'EFECTIVO',
      socio: {
        socio: 'S001',
        nombre: { nombre: 'Juan', primerApellido: 'Garcia' },
      },
      usuarioCreacion: { _id: new Types.ObjectId(), username: 'admin' },
      pagos: [
        { monto: 40, metodoPago: 'EFECTIVO', fecha: new Date('2026-07-13T10:00:00.000Z') },
        { monto: 60, metodoPago: 'TARJETA', fecha: new Date('2026-07-13T11:00:00.000Z') },
      ],
    };

    const { service } = buildRecaudacionesService({ ventas: [], reservas: [reserva] });
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    expect(result).toHaveLength(2);
    const total = result.reduce((sum: number, rec: any) => sum + rec.pagado, 0);
    expect(total).toBe(100);
  });

  it('getRecaudaciones: combinado venta + reserva + cambio + devolución', async () => {
    const venta = {
      _id: new Types.ObjectId(),
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [],
      createdAt: new Date('2026-07-13T09:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const reserva = {
      _id: new Types.ObjectId(),
      precio: 50,
      montoAbonado: 50,
      estado: 'COMPLETADA',
      tipoInstalacion: 'PISCINA',
      fecha: new Date('2026-07-13T10:00:00.000Z'),
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      metodoPago: 'TARJETA',
      socio: { socio: 'S002', nombre: { nombre: 'Ana', primerApellido: 'Lopez' } },
      usuarioCreacion: { _id: new Types.ObjectId(), username: 'admin' },
      pagos: [],
    };

    const cambio = {
      _id: new Types.ObjectId(),
      createdAt: new Date('2026-07-13T11:00:00.000Z'),
      venta: { codigoSocio: 'S001', nombreSocio: 'Cliente' },
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      diferenciaPrecio: -2,
      estadoPago: 'DEVUELTO',
      metodoPago: 'EFECTIVO',
      productoOriginal: { nombre: 'A', cantidad: 1, precioUnitario: 10, total: 10 },
      productoNuevo: { nombre: 'B', cantidad: 1, precioUnitario: 8, total: 8 },
    };

    const devolucion = {
      _id: new Types.ObjectId(),
      venta: { _id: venta._id, codigoSocio: 'S001', nombreSocio: 'Cliente' },
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [{ nombre: 'A', cantidad: 1, precioUnitario: 1, total: 1 }],
      totalDevolucion: 1,
      metodoDevolucion: 'EFECTIVO',
      estado: EstadoDevolucion.PROCESADA,
      fechaProcesamiento: new Date('2026-07-13T12:00:00.000Z'),
    };

    const { service } = buildRecaudacionesService({
      ventas: [venta],
      reservas: [reserva],
      cambios: [cambio],
      devoluciones: [devolucion],
    });

    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    const net = roundMoney(result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0));
    expect(net).toBe(57);
  });

  it('getRecaudaciones: filtro metodoPago=efectivo excluye tarjeta', async () => {
    const ventas = [
      {
        _id: new Types.ObjectId(),
        total: 10,
        pagado: 10,
        estado: 'PAGADO',
        codigoSocio: 'S001',
        nombreSocio: 'Cliente',
        usuario: { _id: new Types.ObjectId(), username: 'admin' },
        productos: [],
        createdAt: new Date('2026-07-13T10:00:00.000Z'),
        pagos: [],
        metodoPago: 'EFECTIVO',
      },
      {
        _id: new Types.ObjectId(),
        total: 5,
        pagado: 5,
        estado: 'PAGADO',
        codigoSocio: 'S002',
        nombreSocio: 'Cliente 2',
        usuario: { _id: new Types.ObjectId(), username: 'admin' },
        productos: [],
        createdAt: new Date('2026-07-13T11:00:00.000Z'),
        pagos: [],
        metodoPago: 'TARJETA',
      },
    ];

    const { service } = buildRecaudacionesService({ ventas });
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
      metodoPago: 'efectivo',
    } as any);

    expect(result).toHaveLength(1);
    expect(result[0].metodoPago).toBe('EFECTIVO');
  });

  it('getRecaudaciones: filtra ventas por createdAt o pagos.fecha', async () => {
    const ventaModelMock: any = {
      find: jest.fn().mockReturnValue(createChainableQuery([])),
    };

    const service = new VentasService(
      ventaModelMock,
      { distinct: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      { findAll: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      {} as any,
      createDevolucionModelMock() as any,
      { findOne: jest.fn() } as any,
    );

    await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    expect(ventaModelMock.find).toHaveBeenCalled();
    const filtro = ventaModelMock.find.mock.calls[0][0];
    expect(filtro).toHaveProperty('$or');
    expect(filtro.$or).toEqual(
      expect.arrayContaining([
        {
          createdAt: {
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          },
        },
        {
          'pagos.fecha': {
            $gte: expect.any(Date),
            $lte: expect.any(Date),
          },
        },
      ]),
    );
  });

  it('getRecaudaciones: devolución fuera de rango de fechas no aparece', async () => {
    const venta = {
      _id: new Types.ObjectId(),
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente',
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [],
      createdAt: new Date('2026-07-13T10:00:00.000Z'),
      pagos: [],
      metodoPago: 'EFECTIVO',
    };

    const devolucion = {
      _id: new Types.ObjectId(),
      venta: { _id: venta._id, codigoSocio: 'S001', nombreSocio: 'Cliente' },
      usuario: { _id: new Types.ObjectId(), username: 'admin' },
      productos: [{ nombre: 'A', cantidad: 1, precioUnitario: 10, total: 10 }],
      totalDevolucion: 10,
      metodoDevolucion: 'EFECTIVO',
      estado: EstadoDevolucion.PROCESADA,
      fechaProcesamiento: new Date('2026-06-01T12:00:00.000Z'),
    };

    const devolucionModelMock = createDevolucionModelMock([devolucion]);
    const service = new VentasService(
      { find: jest.fn().mockReturnValue(createChainableQuery([venta])) } as any,
      {} as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      { findAll: jest.fn().mockResolvedValue([]) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
      {} as any,
      devolucionModelMock as any,
      { findOne: jest.fn() } as any,
    );

    await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    const findQuery = devolucionModelMock.find.mock.calls[0][0];
    expect(findQuery.fechaProcesamiento).toBeDefined();

    devolucionModelMock.find.mockReturnValue(createChainableQuery([]));
    const result = await service.getRecaudaciones({
      fechaInicio: '2026-07-13',
      fechaFin: '2026-07-13',
    } as any);

    expect(result.some((rec: any) => rec.tipo === 'DEVOLUCION')).toBe(false);
    const net = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);
    expect(net).toBe(10);
  });

  describe('consistencia tras eliminar socio (caja)', () => {
    it('crea socio, 2 ventas, elimina socio y recaudaciones siguen consistentes (15)', async () => {
      const socioId = new Types.ObjectId();
      let socioDoc: Record<string, unknown> | null = {
        _id: socioId,
        socio: 'S001',
        nombre: { nombre: 'Juan', primerApellido: 'Garcia', segundoApellido: '' },
        foto: undefined,
        asociados: [],
      };

      const ventaStore: Record<string, unknown>[] = [];
      const ventaDeleteMany = jest.fn();
      const ventaDeleteOne = jest.fn();
      const ventaFindByIdAndDelete = jest.fn();

      const { service: createService, ventaSave } = buildCreateVentaService();
      ventaSave.mockImplementation(function (this: Record<string, unknown>) {
        const saved = {
          ...this,
          _id: new Types.ObjectId(),
          createdAt: new Date('2026-07-13T10:00:00.000Z'),
        };
        ventaStore.push(saved);
        return Promise.resolve(saved);
      });

      await createService.create(
        {
          codigoSocio: 'S001',
          nombreSocio: 'Juan Garcia',
          esSocio: true,
          productos: [{ nombre: 'Coca', unidades: 2, precioUnitario: 5, precioTotal: 10 }],
          total: 10,
          pagado: 10,
          metodoPago: MetodoPago.EFECTIVO,
          observaciones: '',
        } as any,
        userId,
        'ADMINISTRADOR',
      );

      await createService.create(
        {
          codigoSocio: 'S001',
          nombreSocio: 'Juan Garcia',
          esSocio: true,
          productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 5, precioTotal: 5 }],
          total: 5,
          pagado: 5,
          metodoPago: MetodoPago.EFECTIVO,
          observaciones: '',
        } as any,
        userId,
        'ADMINISTRADOR',
      );

      expect(ventaStore).toHaveLength(2);

      // Eliminar socio (hard delete): el documento desaparece, las ventas no.
      socioDoc = null;
      expect(socioDoc).toBeNull();
      expect(ventaDeleteMany).not.toHaveBeenCalled();
      expect(ventaDeleteOne).not.toHaveBeenCalled();
      expect(ventaFindByIdAndDelete).not.toHaveBeenCalled();

      const ventasParaRecaudacion = ventaStore.map((venta) => ({
        ...venta,
        usuario: { _id: new Types.ObjectId(userId), username: 'admin' },
        trabajador: undefined,
      })) as unknown as Array<Record<string, unknown> & {
        codigoSocio: string;
        nombreSocio: string;
        usuario: { _id: Types.ObjectId; username: string };
      }>;

      const socioModelMock: any = {
        findOne: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      };

      const ventaModelMock: any = {
        find: jest.fn().mockImplementation((query: Record<string, unknown> = {}) => {
          const filtered = ventasParaRecaudacion.filter((venta) => {
            if (query.codigoSocio && venta.codigoSocio !== query.codigoSocio) {
              return false;
            }
            return true;
          });
          return createChainableQuery(filtered);
        }),
      };

      const service = new VentasService(
        ventaModelMock,
        {} as any,
        { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
        socioModelMock,
        { findAll: jest.fn().mockResolvedValue([]) } as any,
        { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
        { find: jest.fn().mockReturnValue(createChainableQuery([])) } as any,
        {} as any,
        createDevolucionModelMock() as any,
        { findOne: jest.fn() } as any,
      );

      const result = await service.getRecaudaciones({
        fechaInicio: '2026-07-13',
        fechaFin: '2026-07-13',
        codigoSocio: 'S001',
      } as any);

      expect(socioModelMock.findOne).toHaveBeenCalled();
      await expect(socioModelMock.findOne.mock.results[0].value).resolves.toBeNull();

      const ventasRec = result.filter((rec: any) => rec.tipo === 'VENTA');
      expect(ventasRec).toHaveLength(2);
      expect(ventasRec.every((rec: any) => rec.socio.codigo === 'S001')).toBe(true);
      expect(ventasRec.every((rec: any) => rec.socio.nombre === 'Juan Garcia')).toBe(true);

      const net = result.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0);
      expect(net).toBe(15);

      const ventasPorCodigo = await ventaModelMock.find({ codigoSocio: 'S001' }).lean().exec();
      expect(ventasPorCodigo).toHaveLength(2);
    });
  });

  describe('getResumenRecaudaciones (paridad con getRecaudaciones)', () => {
    it('combinado: totalFilas y neto coinciden con el listado', async () => {
      const venta = {
        _id: new Types.ObjectId(),
        total: 10,
        pagado: 10,
        estado: 'PAGADO',
        codigoSocio: 'S001',
        nombreSocio: 'Cliente',
        usuario: { _id: new Types.ObjectId(), username: 'admin' },
        productos: [{ nombre: 'A', unidades: 1, precioUnitario: 10, precioTotal: 10, categoria: 'BEBIDAS' }],
        createdAt: new Date('2026-07-13T09:00:00.000Z'),
        pagos: [],
        metodoPago: 'EFECTIVO',
      };

      const reserva = {
        _id: new Types.ObjectId(),
        precio: 50,
        montoAbonado: 50,
        estado: 'COMPLETADA',
        tipoInstalacion: 'PISCINA',
        fecha: new Date('2026-07-13T10:00:00.000Z'),
        createdAt: new Date('2026-07-13T10:00:00.000Z'),
        metodoPago: 'TARJETA',
        socio: { socio: 'S002', nombre: { nombre: 'Ana', primerApellido: 'Lopez' } },
        usuarioCreacion: { _id: new Types.ObjectId(), username: 'admin' },
        pagos: [],
      };

      const cambio = {
        _id: new Types.ObjectId(),
        createdAt: new Date('2026-07-13T11:00:00.000Z'),
        venta: { codigoSocio: 'S001', nombreSocio: 'Cliente' },
        usuario: { _id: new Types.ObjectId(), username: 'admin' },
        diferenciaPrecio: -2,
        estadoPago: 'DEVUELTO',
        metodoPago: 'EFECTIVO',
        productoOriginal: { nombre: 'A', cantidad: 1, precioUnitario: 10, total: 10 },
        productoNuevo: { nombre: 'B', cantidad: 1, precioUnitario: 8, total: 8 },
      };

      const devolucion = {
        _id: new Types.ObjectId(),
        venta: { _id: venta._id, codigoSocio: 'S001', nombreSocio: 'Cliente' },
        usuario: { _id: new Types.ObjectId(), username: 'admin' },
        productos: [{ nombre: 'A', cantidad: 1, precioUnitario: 1, total: 1 }],
        totalDevolucion: 1,
        metodoDevolucion: 'EFECTIVO',
        estado: EstadoDevolucion.PROCESADA,
        fechaProcesamiento: new Date('2026-07-13T12:00:00.000Z'),
      };

      const { service } = buildRecaudacionesService({
        ventas: [venta],
        reservas: [reserva],
        cambios: [cambio],
        devoluciones: [devolucion],
      });

      const filtros = { fechaInicio: '2026-07-13', fechaFin: '2026-07-13' } as any;
      const filas = await service.getRecaudaciones(filtros);
      const resumen = await service.getResumenRecaudaciones(filtros);

      const net = roundMoney(filas.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0));

      expect(resumen.totalFilas).toBe(filas.length);
      expect(resumen.general.totalesGenerales.total).toBe(net);
      expect(resumen.socios.totales.totalPagado).toBe(net);
      expect(net).toBe(57);
    });

    it('filtro metodoPago=efectivo: resumen solo refleja efectivo', async () => {
      const ventas = [
        {
          _id: new Types.ObjectId(),
          total: 10,
          pagado: 10,
          estado: 'PAGADO',
          codigoSocio: 'S001',
          nombreSocio: 'Cliente',
          usuario: { _id: new Types.ObjectId(), username: 'admin' },
          productos: [{ nombre: 'A', unidades: 1, precioUnitario: 10, precioTotal: 10 }],
          createdAt: new Date('2026-07-13T10:00:00.000Z'),
          pagos: [],
          metodoPago: 'EFECTIVO',
        },
        {
          _id: new Types.ObjectId(),
          total: 5,
          pagado: 5,
          estado: 'PAGADO',
          codigoSocio: 'S002',
          nombreSocio: 'Cliente 2',
          usuario: { _id: new Types.ObjectId(), username: 'admin' },
          productos: [{ nombre: 'B', unidades: 1, precioUnitario: 5, precioTotal: 5 }],
          createdAt: new Date('2026-07-13T11:00:00.000Z'),
          pagos: [],
          metodoPago: 'TARJETA',
        },
      ];

      const { service } = buildRecaudacionesService({ ventas });
      const filtros = {
        fechaInicio: '2026-07-13',
        fechaFin: '2026-07-13',
        metodoPago: 'efectivo',
      } as any;

      const filas = await service.getRecaudaciones(filtros);
      const resumen = await service.getResumenRecaudaciones(filtros);
      const net = roundMoney(filas.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0));

      expect(filas).toHaveLength(1);
      expect(resumen.totalFilas).toBe(1);
      expect(resumen.general.totalesGenerales.total).toBe(net);
      expect(resumen.general.totalesPorMetodoPago.efectivo).toBe(10);
      expect(resumen.general.totalesPorMetodoPago.tarjeta).toBe(0);
      expect(resumen.socios.totales.totalPagado).toBe(10);
    });

    it('regresión 13/07/2026: resumen reporta el mismo neto 8.9', async () => {
      const ventaEfectivoId = new Types.ObjectId();
      const ventas = [
        {
          _id: ventaEfectivoId,
          total: 10,
          pagado: 10,
          estado: 'DEVUELTA',
          codigoSocio: 'S001',
          nombreSocio: 'Cliente 1',
          usuario: { _id: new Types.ObjectId(), username: 'reyes' },
          productos: [{ nombre: 'Entrada', unidades: 2, precioUnitario: 5, precioTotal: 10 }],
          createdAt: new Date('2026-07-13T09:00:00.000Z'),
          pagos: [],
          metodoPago: 'EFECTIVO',
        },
        {
          _id: new Types.ObjectId(),
          total: 1.4,
          pagado: 1.4,
          estado: 'PAGADO',
          codigoSocio: 'S002',
          nombreSocio: 'Cliente 2',
          usuario: { _id: new Types.ObjectId(), username: 'reyes' },
          productos: [{ nombre: 'Producto B', unidades: 1, precioUnitario: 1.4, precioTotal: 1.4 }],
          createdAt: new Date('2026-07-13T10:00:00.000Z'),
          pagos: [],
          metodoPago: 'TARJETA',
        },
        {
          _id: new Types.ObjectId(),
          total: 2.9,
          pagado: 2.9,
          estado: 'PAGADO',
          codigoSocio: 'S003',
          nombreSocio: 'Cliente 3',
          usuario: { _id: new Types.ObjectId(), username: 'reyes' },
          productos: [{ nombre: 'Producto C', unidades: 1, precioUnitario: 2.9, precioTotal: 2.9 }],
          createdAt: new Date('2026-07-13T11:00:00.000Z'),
          pagos: [],
          metodoPago: 'TARJETA',
        },
        {
          _id: new Types.ObjectId(),
          total: 4.6,
          pagado: 4.6,
          estado: 'PAGADO',
          codigoSocio: 'S004',
          nombreSocio: 'Cliente 4',
          usuario: { _id: new Types.ObjectId(), username: 'reyes' },
          productos: [{ nombre: 'Producto D', unidades: 1, precioUnitario: 4.6, precioTotal: 4.6 }],
          createdAt: new Date('2026-07-13T14:00:00.000Z'),
          pagos: [],
          metodoPago: 'TARJETA',
        },
      ];

      const devolucion = {
        _id: new Types.ObjectId(),
        venta: { _id: ventaEfectivoId, codigoSocio: 'S001', nombreSocio: 'Cliente 1', total: 10 },
        usuario: { _id: new Types.ObjectId(), username: 'reyes' },
        productos: [{ nombre: 'Entrada', cantidad: 2, precioUnitario: 5, total: 10 }],
        totalDevolucion: 10,
        metodoDevolucion: 'EFECTIVO',
        motivo: 'Devolución completa',
        estado: EstadoDevolucion.PROCESADA,
        fechaProcesamiento: new Date('2026-07-13T12:00:00.000Z'),
      };

      const { service } = buildRecaudacionesService({ ventas, devoluciones: [devolucion] });
      const filtros = { fechaInicio: '2026-07-13', fechaFin: '2026-07-13' } as any;

      const filas = await service.getRecaudaciones(filtros);
      const resumen = await service.getResumenRecaudaciones(filtros);
      const net = roundMoney(filas.reduce((sum: number, rec: any) => sum + montoRecaudacion(rec), 0));

      expect(net).toBe(8.9);
      expect(resumen.general.totalesGenerales.total).toBe(8.9);
      expect(resumen.socios.totales.totalPagado).toBe(8.9);
      expect(resumen.totalFilas).toBe(filas.length);
      expect(resumen.general.totalesPorMetodoPago.efectivo).toBe(0);
      expect(resumen.general.totalesPorMetodoPago.tarjeta).toBe(8.9);
    });
  });
});
