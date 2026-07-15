import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { DevolucionesService } from './devoluciones.service';
import { EstadoDevolucion, MetodoDevolucion } from '../schemas/devolucion.schema';

describe('DevolucionesService (regresión contable)', () => {
  const userId = '507f1f77bcf86cd799439011';
  const otherUserId = '507f1f77bcf86cd799439012';

  function buildService(overrides?: Partial<any>) {
    const ventaId = new Types.ObjectId();
    const refundDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      usuario: new Types.ObjectId(),
      productos: [
        {
          nombre: 'Producto A',
          cantidad: 2,
          precioUnitario: 5,
          total: 10,
        },
      ],
      totalDevolucion: 10,
      metodoDevolucion: 'EFECTIVO',
      motivo: 'Cliente no satisfecho',
      estado: EstadoDevolucion.PENDIENTE,
      fechaProcesamiento: undefined,
      procesadoPor: undefined,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    const ventaDoc = {
      _id: ventaId,
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
    };

    const productDoc = {
      nombre: 'Producto A',
      stock_actual: 3,
      save: jest.fn().mockResolvedValue({ nombre: 'Producto A', stock_actual: 5 }),
    };

    const devolucionModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(refundDoc),
      }),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: ventaId, estado: 'DEVUELTA' }),
      }),
    };

    const productModelMock: any = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(productDoc),
      }),
    };

    const service = new DevolucionesService(
      devolucionModelMock as any,
      ventaModelMock as any,
      productModelMock as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    return {
      service,
      refundDoc,
      ventaDoc,
      productDoc,
      devolucionModelMock,
      ventaModelMock,
      productModelMock,
      ...overrides,
    };
  }

  it('procesar: debe marcar la venta asociada como DEVUELTA sin modificar pagado', async () => {
    const { service, refundDoc, ventaModelMock } = buildService();

    await service.procesar(refundDoc._id.toString(), userId);

    expect(ventaModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      refundDoc.venta,
      expect.objectContaining({
        $set: expect.objectContaining({
          estado: 'DEVUELTA',
        }),
      }),
      { new: true },
    );

    const updatePayload = ventaModelMock.findByIdAndUpdate.mock.calls[0]?.[1] as any;
    expect(updatePayload.$set.pagado).toBeUndefined();
  });

  it('procesar: debe marcar PARCIALMENTE_DEVUELTA cuando la devolución no cubre el total', async () => {
    const { service, refundDoc, ventaModelMock, devolucionModelMock } = buildService();

    devolucionModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        ...refundDoc,
        totalDevolucion: 5,
        productos: [{ nombre: 'Producto A', cantidad: 1, precioUnitario: 5, total: 5 }],
      }),
    });

    ventaModelMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: refundDoc.venta,
        total: 10,
        pagado: 10,
        estado: 'PAGADO',
      }),
    });

    await service.procesar(refundDoc._id.toString(), otherUserId);

    expect(ventaModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      refundDoc.venta,
      expect.objectContaining({
        $set: expect.objectContaining({
          estado: 'PARCIALMENTE_DEVUELTA',
        }),
      }),
      { new: true },
    );
  });

  it('procesar: no debe dejar la venta como pagada cuando la devolución cubre el total', async () => {
    const { service, refundDoc, ventaModelMock } = buildService();

    await service.procesar(refundDoc._id.toString(), userId);

    const lastCall = ventaModelMock.findByIdAndUpdate.mock.calls[0];
    const updatePayload = lastCall?.[1] as any;

    expect(updatePayload.$set.estado).not.toBe('PAGADO');
    expect(updatePayload.$set.estado).toBe('DEVUELTA');
  });

  it('procesar: debe rechazar devoluciones ya procesadas sin crear efectos dobles', async () => {
    const { service, refundDoc } = buildService();
    const alreadyProcessedRefund = {
      ...refundDoc,
      estado: EstadoDevolucion.PROCESADA,
    };

    const devolucionModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(alreadyProcessedRefund),
      }),
    };

    const serviceWithProcessedRefund = new DevolucionesService(
      devolucionModelMock as any,
      { findById: jest.fn(), findByIdAndUpdate: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await expect(serviceWithProcessedRefund.procesar(refundDoc._id.toString(), userId)).rejects.toThrow(BadRequestException);
  });

  function buildCreateService(options?: {
    venta?: any;
    devolucionesPrevias?: any[];
  }) {
    const ventaId = new Types.ObjectId();
    const hoy = new Date();
    const ventaDoc = options?.venta ?? {
      _id: ventaId,
      usuario: new Types.ObjectId(userId),
      createdAt: hoy,
      productos: [{ nombre: 'Producto A', unidades: 2, precioUnitario: 5, precioTotal: 10 }],
      total: 10,
      pagado: 10,
      estado: 'PAGADO',
    };

    const saveMock = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });

    const devolucionModelMock: any = jest.fn().mockImplementation((data: any) => ({
      ...data,
      save: saveMock,
    }));
    devolucionModelMock.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(options?.devolucionesPrevias ?? []),
    });

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(ventaDoc),
      }),
    };

    const productModelMock: any = {
      findOne: jest.fn(),
    };

    const service = new DevolucionesService(
      devolucionModelMock,
      ventaModelMock,
      productModelMock,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    return { service, ventaDoc, devolucionModelMock, saveMock };
  }

  it('create: rechaza totalDevolucion distinto a la suma de productos', async () => {
    const { service } = buildCreateService();

    await expect(
      service.create(
        {
          venta: new Types.ObjectId().toString(),
          productos: [{ nombre: 'Producto A', cantidad: 2, precioUnitario: 5, total: 10 }],
          totalDevolucion: 9,
          metodoDevolucion: MetodoDevolucion.EFECTIVO,
          motivo: 'Error de total',
        },
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: rechaza cantidad mayor a la vendida', async () => {
    const { service } = buildCreateService();

    await expect(
      service.create(
        {
          venta: new Types.ObjectId().toString(),
          productos: [{ nombre: 'Producto A', cantidad: 3, precioUnitario: 5, total: 15 }],
          totalDevolucion: 15,
          metodoDevolucion: MetodoDevolucion.EFECTIVO,
          motivo: 'Exceso',
        },
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: rechaza devolución acumulada que supera unidades vendidas', async () => {
    const { service } = buildCreateService({
      devolucionesPrevias: [
        {
          productos: [{ nombre: 'Producto A', cantidad: 1, precioUnitario: 5, total: 5 }],
          estado: EstadoDevolucion.PENDIENTE,
        },
      ],
    });

    await expect(
      service.create(
        {
          venta: new Types.ObjectId().toString(),
          productos: [{ nombre: 'Producto A', cantidad: 2, precioUnitario: 5, total: 10 }],
          totalDevolucion: 10,
          metodoDevolucion: MetodoDevolucion.EFECTIVO,
          motivo: 'Segunda devolución excesiva',
        },
        userId,
        'ADMINISTRADOR',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create: guarda devolución pendiente sin tocar stock ni venta', async () => {
    const { service, saveMock, devolucionModelMock } = buildCreateService();

    const result = await service.create(
      {
        venta: new Types.ObjectId().toString(),
        productos: [{ nombre: 'Producto A', cantidad: 1, precioUnitario: 5, total: 5 }],
        totalDevolucion: 5,
        metodoDevolucion: MetodoDevolucion.TARJETA,
        motivo: 'Devolución parcial',
      },
      userId,
      'ADMINISTRADOR',
    );

    expect(saveMock).toHaveBeenCalled();
    expect(result.estado).toBe(EstadoDevolucion.PENDIENTE);
    expect(devolucionModelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        totalDevolucion: 5,
        estado: EstadoDevolucion.PENDIENTE,
      }),
    );
  });

  it('procesar: marca DEVUELTA cuando devoluciones procesadas previas cubren el resto', async () => {
    const ventaId = new Types.ObjectId();
    const refundDoc = {
      _id: new Types.ObjectId(),
      venta: ventaId,
      productos: [{ nombre: 'Producto A', cantidad: 1, precioUnitario: 5, total: 5 }],
      totalDevolucion: 5,
      estado: EstadoDevolucion.PENDIENTE,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };

    const devolucionModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(refundDoc),
      }),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            totalDevolucion: 5,
            estado: EstadoDevolucion.PROCESADA,
            productos: [{ nombre: 'Producto A', cantidad: 1 }],
          },
        ]),
      }),
    };

    const ventaModelMock: any = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: ventaId,
          total: 10,
          pagado: 10,
          estado: 'PAGADO',
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: ventaId, estado: 'DEVUELTA' }),
      }),
    };

    const productModelMock: any = {
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          nombre: 'Producto A',
          stock_actual: 1,
          save: jest.fn().mockResolvedValue({}),
        }),
      }),
    };

    const service = new DevolucionesService(
      devolucionModelMock,
      ventaModelMock,
      productModelMock,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
    );

    await service.procesar(refundDoc._id.toString(), userId);

    expect(ventaModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
      ventaId,
      expect.objectContaining({
        $set: expect.objectContaining({ estado: 'DEVUELTA' }),
      }),
      { new: true },
    );
  });
});
