import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { CambiosService } from './cambios.service';
import { MetodoPagoCambio } from '../dto/procesar-pago-cambio.dto';

describe('CambiosService (regresión contable)', () => {
  const userId = '507f1f77bcf86cd799439011';
  const ventaId = new Types.ObjectId();

  function createPopulateChain(result: unknown) {
    const chain: any = {
      populate: jest.fn(),
      exec: jest.fn().mockResolvedValue(result),
    };
    chain.populate.mockImplementation(() => chain);
    return chain;
  }

  function buildVentaHoy(overrides?: Partial<any>) {
    const hoy = new Date();
    return {
      _id: ventaId,
      createdAt: hoy,
      productos: [
        {
          nombre: 'Coca Cola',
          unidades: 2,
          precioUnitario: 2,
          precioTotal: 4,
        },
      ],
      total: 4,
      pagado: 4,
      estado: 'PAGADO',
      codigoSocio: 'S001',
      nombreSocio: 'Cliente Test',
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      ...overrides,
    };
  }

  function buildService(options?: {
    venta?: any;
    productoOriginal?: any;
    productoNuevo?: any;
    cambioDoc?: any;
  }) {
    const ventaDoc = options?.venta ?? buildVentaHoy();

    const productoOriginal = options?.productoOriginal ?? {
      nombre: 'Coca Cola',
      tipo: 'Bebida',
      stock_actual: 5,
      save: jest.fn().mockResolvedValue({}),
    };

    const productoNuevo = options?.productoNuevo ?? {
      nombre: 'Fanta',
      tipo: 'Bebida',
      stock_actual: 10,
      save: jest.fn().mockResolvedValue({}),
    };

    const cambioSaved = {
      _id: new Types.ObjectId(),
      diferenciaPrecio: 0,
      estadoPago: 'PAGADO',
      venta: ventaId,
      ...options?.cambioDoc,
    };

    const cambioModelMock: any = jest.fn().mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ ...cambioSaved, ...data }),
    }));
    cambioModelMock.findById = jest.fn().mockReturnValue(
      createPopulateChain({ ...cambioSaved }),
    );

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
    };

    const productModelMock: any = {
      findOne: jest.fn().mockImplementation(({ nombre }: { nombre: string }) => ({
        exec: jest.fn().mockResolvedValue(
          nombre === 'Coca Cola' ? productoOriginal : productoNuevo,
        ),
      })),
    };

    const usersServiceMock: any = { findOne: jest.fn() };

    const service = new CambiosService(
      cambioModelMock,
      ventaModelMock,
      productModelMock,
      usersServiceMock,
    );

    return {
      service,
      ventaDoc,
      cambioModelMock,
      ventaModelMock,
      productoOriginal,
      productoNuevo,
      cambioSaved,
    };
  }

  function baseDto(overrides?: Partial<any>) {
    return {
      ventaId: ventaId.toString(),
      productoOriginal: {
        nombre: 'Coca Cola',
        cantidad: 2,
        precioUnitario: 2,
        total: 4,
      },
      productoNuevo: {
        nombre: 'Fanta',
        cantidad: 2,
        precioUnitario: 2,
        total: 4,
      },
      motivo: 'Cambio de sabor',
      ...overrides,
    };
  }

  it('CAM-01: cambio mismo precio marca PAGADO y recalcula total de venta', async () => {
    const { service, ventaDoc } = buildService();

    await service.create(baseDto(), userId, 'ADMINISTRADOR');

    expect(ventaDoc.total).toBe(4);
    expect(ventaDoc.pagado).toBe(4);
    expect(ventaDoc.save).toHaveBeenCalled();
  });

  it('CAM-02: cambio a producto más caro deja diferencia positiva y estado PENDIENTE', async () => {
    const { service, ventaDoc, cambioModelMock } = buildService();

    await service.create(
      baseDto({
        productoNuevo: { nombre: 'Fanta', cantidad: 2, precioUnitario: 3.5, total: 7 },
      }),
      userId,
      'ADMINISTRADOR',
    );

    expect(ventaDoc.total).toBe(7);
    expect(ventaDoc.pagado).toBe(4);
    const cambioData = cambioModelMock.mock.calls[0][0];
    expect(cambioData.diferenciaPrecio).toBe(3);
    expect(cambioData.estadoPago).toBe('PENDIENTE');
  });

  it('CAM-03: cambio a producto más barato deja diferencia negativa y estado PENDIENTE', async () => {
    const { service, ventaDoc, cambioModelMock } = buildService();

    await service.create(
      baseDto({
        productoNuevo: { nombre: 'Fanta', cantidad: 2, precioUnitario: 1, total: 2 },
      }),
      userId,
      'ADMINISTRADOR',
    );

    expect(ventaDoc.total).toBe(2);
    expect(ventaDoc.pagado).toBe(4);
    const cambioData = cambioModelMock.mock.calls[0][0];
    expect(cambioData.diferenciaPrecio).toBe(-2);
    expect(cambioData.estadoPago).toBe('PENDIENTE');
  });

  it('CAM-04: rechaza total de línea que no coincide', async () => {
    const { service } = buildService();

    await expect(
      service.create(
        baseDto({
          productoNuevo: { nombre: 'Fanta', cantidad: 2, precioUnitario: 3, total: 99 },
        }),
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('CAM-05: cambio parcial recalcula total como suma de líneas', async () => {
    const { service, ventaDoc } = buildService();

    await service.create(
      baseDto({
        productoOriginal: { nombre: 'Coca Cola', cantidad: 1, precioUnitario: 2, total: 2 },
        productoNuevo: { nombre: 'Fanta', cantidad: 1, precioUnitario: 3, total: 3 },
      }),
      userId,
      'ADMINISTRADOR',
    );

    expect(ventaDoc.total).toBe(5);
    expect(ventaDoc.productos).toHaveLength(2);
  });

  it('CAM-06: procesarPagoCambio cobra diferencia positiva y actualiza pagado', async () => {
    const ventaDoc = buildVentaHoy({ total: 9, pagado: 4, estado: 'PAGADO_PARCIAL' });
    const cambioDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      diferenciaPrecio: 5,
      estadoPago: 'PENDIENTE',
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    const cambioModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(cambioDoc),
      }),
    };
    cambioModelMock.findById.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue(cambioDoc),
    });
    cambioModelMock.findById.mockReturnValue(createPopulateChain(cambioDoc));

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
    };

    const service = new CambiosService(
      cambioModelMock,
      ventaModelMock,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await service.procesarPagoCambio(
      cambioDoc._id.toString(),
      { metodoPago: MetodoPagoCambio.EFECTIVO },
      userId,
      'ADMINISTRADOR',
    );

    expect(cambioDoc.estadoPago).toBe('PAGADO');
    expect(ventaDoc.pagado).toBe(9);
    expect(ventaDoc.estado).toBe('PAGADO');
  });

  it('CAM-07: procesarPagoCambio devuelve diferencia negativa y reduce pagado', async () => {
    const ventaDoc = buildVentaHoy({ total: 2, pagado: 4, estado: 'PAGADO' });
    const cambioDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      diferenciaPrecio: -2,
      estadoPago: 'PENDIENTE',
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    const cambioModelMock: any = {
      findById: jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(cambioDoc) })
        .mockReturnValue(createPopulateChain(cambioDoc)),
    };

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
    };

    const service = new CambiosService(
      cambioModelMock,
      ventaModelMock,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await service.procesarPagoCambio(
      cambioDoc._id.toString(),
      { metodoPago: MetodoPagoCambio.EFECTIVO },
      userId,
      'ADMINISTRADOR',
    );

    expect(cambioDoc.estadoPago).toBe('DEVUELTO');
    expect(ventaDoc.pagado).toBe(2);
    expect(ventaDoc.estado).toBe('PAGADO');
  });

  it('CAM-08: rechaza reprocesar un cambio ya procesado', async () => {
    const cambioDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      diferenciaPrecio: 5,
      estadoPago: 'PAGADO',
    };

    const cambioModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(cambioDoc),
      }),
    };

    const service = new CambiosService(
      cambioModelMock,
      { findById: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await expect(
      service.procesarPagoCambio(
        cambioDoc._id.toString(),
        { metodoPago: MetodoPagoCambio.EFECTIVO },
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('CAM-09: procesar cambio sin diferencia mantiene pagado', async () => {
    const ventaDoc = buildVentaHoy({ total: 4, pagado: 4, estado: 'PAGADO' });
    const cambioDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      diferenciaPrecio: 0,
      estadoPago: 'PENDIENTE',
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    const cambioModelMock: any = {
      findById: jest.fn()
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(cambioDoc) })
        .mockReturnValue(createPopulateChain(cambioDoc)),
    };

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
    };

    const service = new CambiosService(
      cambioModelMock,
      ventaModelMock,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await service.procesarPagoCambio(
      cambioDoc._id.toString(),
      { metodoPago: MetodoPagoCambio.TARJETA },
      userId,
      'ADMINISTRADOR',
    );

    expect(cambioDoc.estadoPago).toBe('PAGADO');
    expect(ventaDoc.pagado).toBe(4);
  });
});
