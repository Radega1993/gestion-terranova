import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { VentasService } from './ventas.service';
import { MetodoPago } from '../dto/pago-venta.dto';

describe('VentasService (unit)', () => {
  const userId = '507f1f77bcf86cd799439011';

  function buildService(ventaDoc: Record<string, unknown>) {
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
      usersServiceMock,
    );

    return { service, ventaModelMock, saveMock };
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
});
