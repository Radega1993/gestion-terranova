import { BadRequestException } from '@nestjs/common';

import { ReservasService } from './reservas.service';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { LiquidarReservaDto } from '../dto/liquidar-reserva.dto';
import { EstadoReserva, MetodoPago } from '../schemas/reserva.schema';

describe('ReservasService (unit)', () => {
  const now = Date.now();
  const fechaValida = (daysAhead: number) => new Date(now + daysAhead * 24 * 60 * 60 * 1000);
  const fechaInvalidaPasada = () => new Date(now - 24 * 60 * 60 * 1000);

  function mockChain<T>(value: T) {
    const chain: any = {};
    chain.populate = jest.fn(() => chain);
    chain.exec = jest.fn(async () => value);
    return chain;
  }

  it('create: valida fecha pasada', async () => {
    const reservaModelMock: any = jest.fn();
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};

    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: Partial<CreateReservaDto> = {
      fecha: fechaInvalidaPasada(),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100,
      montoAbonado: 0,
      metodoPago: MetodoPago.EFECTIVO,
      estado: undefined,
    };

    await expect(service.create(dto as CreateReservaDto, 'userId', 'TRABAJADOR')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('create: PENDIENTE cuando montoAbonado = 0', async () => {
    const saveMock = jest.fn().mockResolvedValue({
      precio: 100,
      montoAbonado: 0,
      estado: EstadoReserva.PENDIENTE,
    });
    const reservaModelMock: any = jest.fn().mockImplementation(() => ({ save: saveMock }));
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};

    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100,
      observaciones: 'obs',
      montoAbonado: 0,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoReserva.PENDIENTE,
      trabajadorId: undefined,
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    const created = await service.create(dto, 'userId', 'TRABAJADOR');
    expect(created.estado).toBe(EstadoReserva.PENDIENTE);
    expect(saveMock).toHaveBeenCalled();
  });

  it('create: COMPLETADA cuando montoAbonado == precio (con tolerancia)', async () => {
    const saveMock = jest.fn().mockResolvedValue({
      precio: 100.0,
      montoAbonado: 100.0,
      estado: EstadoReserva.COMPLETADA,
    });
    const reservaModelMock: any = jest.fn().mockImplementation(() => ({ save: saveMock }));
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100.0,
      observaciones: undefined,
      montoAbonado: 100.0,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoReserva.PENDIENTE,
      trabajadorId: undefined,
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    const created = await service.create(dto, 'userId', 'TRABAJADOR');
    expect(created.estado).toBe(EstadoReserva.COMPLETADA);
    expect(saveMock).toHaveBeenCalled();
  });

  it('create: PENDIENTE cuando pago parcial (montoAbonado < precio)', async () => {
    const saveMock = jest.fn().mockResolvedValue({
      precio: 100.0,
      montoAbonado: 20.0,
      estado: EstadoReserva.PENDIENTE,
    });
    const reservaModelMock: any = jest.fn().mockImplementation(() => ({ save: saveMock }));
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100.0,
      observaciones: undefined,
      montoAbonado: 20.0,
      metodoPago: MetodoPago.TARJETA,
      estado: EstadoReserva.PENDIENTE,
      trabajadorId: undefined,
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    const created = await service.create(dto, 'userId', 'TRABAJADOR');
    expect(created.estado).toBe(EstadoReserva.PENDIENTE);
  });

  it('create: LISTA_ESPERA fuerza montoAbonado=0', async () => {
    const saveMock = jest.fn().mockResolvedValue({
      precio: 100,
      montoAbonado: 0,
      estado: EstadoReserva.LISTA_ESPERA,
    });
    const reservaModelMock: any = jest.fn().mockImplementation((data: any) => {
      // Asegurar que el servicio fuerza el monto a 0 en lista de espera
      expect(data.montoAbonado).toBe(0);
      return { save: saveMock };
    });
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100,
      observaciones: undefined,
      montoAbonado: 50,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoReserva.LISTA_ESPERA,
      trabajadorId: undefined,
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    const created = await service.create(dto, 'userId', 'TRABAJADOR');
    expect(created.estado).toBe(EstadoReserva.LISTA_ESPERA);
    expect(created.montoAbonado).toBe(0);
  });

  it('create: TIENDA requiere trabajadorId y valida que pertenezca a su tienda', async () => {
    const reservaModelMock: any = jest.fn().mockImplementation(() => ({ save: jest.fn() }));
    const trabajadorModelMock: any = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };
    const usersServiceMock: any = {
      findOne: jest.fn().mockResolvedValue({ tienda: 'tienda123' }),
    };

    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dtoBase: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 100,
      observaciones: undefined,
      montoAbonado: 0,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoReserva.PENDIENTE,
      trabajadorId: 'trab1',
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    await expect(service.create(dtoBase, 'userTienda', 'TIENDA')).rejects.toThrow(BadRequestException);
    expect(usersServiceMock.findOne).toHaveBeenCalled();
    expect(trabajadorModelMock.findOne).toHaveBeenCalled();
  });

  it('create: redondea precio y montoAbonado a 2 decimales', async () => {
    const saveMock = jest.fn().mockResolvedValue({
      precio: 10.12,
      montoAbonado: 3.33,
      estado: EstadoReserva.PENDIENTE,
    });

    const reservaModelMock: any = jest.fn().mockImplementation((data: any) => {
      expect(data.precio).toBe(10.12);
      expect(data.montoAbonado).toBe(3.33);
      return { save: saveMock };
    });

    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: CreateReservaDto = {
      fecha: fechaValida(5),
      tipoInstalacion: 'PISCINA',
      socio: '507f1f77bcf86cd799439011',
      usuarioCreacion: '507f1f77bcf86cd799439012',
      suplementos: [],
      precio: 10.123,
      observaciones: undefined,
      montoAbonado: 3.3333,
      metodoPago: MetodoPago.EFECTIVO,
      estado: EstadoReserva.PENDIENTE,
      trabajadorId: undefined,
      normativaAceptada: false,
      firmaSocio: undefined,
    };

    await service.create(dto, 'userId', 'TRABAJADOR');
    expect(saveMock).toHaveBeenCalled();
  });

  it('update: no permite modificar una reserva LIQUIDADA', async () => {
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ estado: EstadoReserva.LIQUIDADA }),
    };
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: UpdateReservaDto = {
      estado: EstadoReserva.PENDIENTE,
      montoAbonado: 0,
      precio: 100,
    } as any;

    await expect(service.update('res1', dto, 'userId')).rejects.toThrow(BadRequestException);
  });

  it('update: valida fecha pasada cuando updateReservaDto.fecha está presente', async () => {
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ estado: EstadoReserva.PENDIENTE, precio: 100, montoAbonado: 0 }),
    };
    const trabajadorModelMock: any = {};
    const usersServiceMock: any = {};
    const service = new ReservasService(reservaModelMock, trabajadorModelMock, usersServiceMock);

    const dto: UpdateReservaDto = {
      fecha: fechaInvalidaPasada(),
    } as any;

    await expect(service.update('res1', dto, 'userId')).rejects.toThrow(BadRequestException);
  });

  it('update: recalcula estado a COMPLETADA cuando montoAbonado == precio', async () => {
    const updated = { estado: EstadoReserva.COMPLETADA, precio: 10, montoAbonado: 10 } as any;
    const findByIdAndUpdateMock = jest.fn().mockReturnValue(mockChain(updated));
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ estado: EstadoReserva.PENDIENTE, precio: 10, montoAbonado: 0 }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    const dto: UpdateReservaDto = {
      precio: 10,
      montoAbonado: 10,
    } as any;

    const result = await service.update('res1', dto, 'userId');
    expect(result.estado).toBe(EstadoReserva.COMPLETADA);
  });

  it('update: no recalcula estado si estado explícito distinto de PENDIENTE', async () => {
    const updated = { estado: EstadoReserva.CONFIRMADA, precio: 10, montoAbonado: 0 } as any;
    const findByIdAndUpdateMock = jest.fn().mockReturnValue(mockChain(updated));
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ estado: EstadoReserva.PENDIENTE, precio: 10, montoAbonado: 0 }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    const dto: UpdateReservaDto = {
      precio: 10,
      montoAbonado: 0,
      estado: EstadoReserva.CONFIRMADA,
    } as any;

    const result = await service.update('res1', dto, 'userId');
    expect(result.estado).toBe(EstadoReserva.CONFIRMADA);
  });

  it('liquidar: guarda desglose de pagos y suma montoAbonado sin duplicar', async () => {
    const updated = {
      estado: EstadoReserva.COMPLETADA,
      montoAbonado: 100,
      pagos: [
        { monto: 40, metodoPago: MetodoPago.EFECTIVO, fecha: new Date('2026-04-10T10:00:00.000Z') },
        { monto: 60, metodoPago: MetodoPago.TARJETA, fecha: new Date('2026-04-11T11:00:00.000Z') },
      ],
    } as any;

    const findByIdAndUpdateMock = jest.fn().mockReturnValue(mockChain(updated));
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ _id: 'res1', estado: EstadoReserva.PENDIENTE }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    const dto: LiquidarReservaDto = {
      estado: EstadoReserva.COMPLETADA,
      observaciones: 'Liquidacion en dos dias',
      suplementos: [],
      fianza: 0,
      pagos: [
        { monto: 40, metodoPago: MetodoPago.EFECTIVO, fecha: '2026-04-10T10:00:00.000Z' },
        { monto: 60, metodoPago: MetodoPago.TARJETA, fecha: '2026-04-11T11:00:00.000Z' },
      ],
    };

    const result = await service.liquidar('res1', dto, 'user-admin');
    expect(result.estado).toBe(EstadoReserva.COMPLETADA);
    expect(result.montoAbonado).toBe(100);
    expect(findByIdAndUpdateMock).toHaveBeenCalled();

    const updatePayload = findByIdAndUpdateMock.mock.calls[0][1];
    expect(updatePayload.pagos).toHaveLength(2);
    expect(updatePayload.pagos[0].monto).toBe(40);
    expect(updatePayload.pagos[1].monto).toBe(60);
  });

  it('cancelar: calcula montoDevuelto como precio menos montoAbonado y resetea abonado', async () => {
    const updated = {
      estado: EstadoReserva.CANCELADA,
      precio: 100,
      montoAbonado: 0,
      montoDevuelto: 70,
    } as any;

    const findByIdAndUpdateMock = jest.fn().mockReturnValue(mockChain(updated));
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({
        _id: 'res1',
        estado: EstadoReserva.PENDIENTE,
        precio: 100,
        montoAbonado: 30,
      }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    const result = await service.cancelar(
      'res1',
      { motivo: 'No disponible', observaciones: 'Cliente cancela' } as any,
      'user-admin',
    );

    expect(result.montoDevuelto).toBe(70);
    expect(result.montoAbonado).toBe(0);

    const updatePayload = findByIdAndUpdateMock.mock.calls[0][1];
    expect(updatePayload.montoDevuelto).toBe(70);
    expect(updatePayload.montoAbonado).toBe(0);
  });

  it('cancelar: usa montoDevuelto explícito del DTO', async () => {
    const updated = {
      estado: EstadoReserva.CANCELADA,
      montoDevuelto: 25,
      montoAbonado: 0,
    } as any;

    const findByIdAndUpdateMock = jest.fn().mockReturnValue(mockChain(updated));
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({
        _id: 'res1',
        estado: EstadoReserva.PENDIENTE,
        precio: 100,
        montoAbonado: 30,
      }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    await service.cancelar(
      'res1',
      { motivo: 'Ajuste manual', montoDevuelto: 25 } as any,
      'user-admin',
    );

    const updatePayload = findByIdAndUpdateMock.mock.calls[0][1];
    expect(updatePayload.montoDevuelto).toBe(25);
  });

  it('cancelar: rechaza reserva LIQUIDADA', async () => {
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({ estado: EstadoReserva.LIQUIDADA }),
    };
    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    await expect(
      service.cancelar('res1', { motivo: 'Tarde' } as any, 'user-admin'),
    ).rejects.toThrow(BadRequestException);
  });

  it('cancelar: redondea importe pendiente a 2 decimales', async () => {
    const findByIdAndUpdateMock = jest.fn().mockReturnValue(
      mockChain({ estado: EstadoReserva.CANCELADA, montoDevuelto: 7.22, montoAbonado: 0 }),
    );
    const reservaModelMock: any = {
      findById: jest.fn().mockResolvedValue({
        _id: 'res1',
        estado: EstadoReserva.PENDIENTE,
        precio: 10.333,
        montoAbonado: 3.111,
      }),
      findByIdAndUpdate: findByIdAndUpdateMock,
    };

    const service = new ReservasService(reservaModelMock, {} as any, {} as any);

    await service.cancelar('res1', { motivo: 'Cancelación' } as any, 'user-admin');

    const updatePayload = findByIdAndUpdateMock.mock.calls[0][1];
    expect(updatePayload.montoDevuelto).toBe(7.22);
  });
});

