import { normalizeSocioUpdatePayload, SociosService } from './socios.service';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('normalizeSocioUpdatePayload', () => {
  it('convierte el payload del formulario de edición al shape esperado por el backend', () => {
    const payload = {
      nombre: {
        nombre: 'Ana',
        primerApellido: 'López',
        segundoApellido: 'Ruiz'
      },
      socio: 'AET001',
      contacto: {
        telefonos: ['600123456'],
        email: ['ana@test.com']
      },
      direccion: {
        calle: 'Calle Mayor',
        numero: '10',
        poblacion: 'Madrid',
        cp: '28001',
        provincia: 'Madrid'
      },
      cuota: 10,
      casa: 1,
      totalSocios: 1,
      active: true
    };

    const normalized = normalizeSocioUpdatePayload(payload);

    expect(normalized.contacto).toEqual({
      telefonos: ['600123456'],
      emails: ['ana@test.com']
    });
    expect(normalized.contacto.email).toBeUndefined();
  });

  it('preserva emails ya normalizados y limpia datos vacíos', () => {
    const payload = {
      nombre: {
        nombre: 'Juan',
        primerApellido: 'García'
      },
      contacto: {
        telefonos: ['600000000'],
        emails: ['juan@test.com', ''],
        email: ['juan@test.com']
      },
      asociados: [{ nombre: 'Pepe', codigo: 'AET001-1' }, { nombre: '' }]
    };

    const normalized = normalizeSocioUpdatePayload(payload);

    expect(normalized.contacto.emails).toEqual(['juan@test.com']);
    expect(normalized.asociados).toHaveLength(1);
    expect(normalized.asociados[0]).toMatchObject({ nombre: 'Pepe', codigo: 'AET001-1' });
  });
});

describe('SociosService.getProductosConsumidos (agregación monetaria)', () => {
  const socioId = new Types.ObjectId().toString();

  function buildService(ventas: unknown[]) {
    const socioModelMock: any = {
      findById: jest.fn().mockResolvedValue({
        _id: socioId,
        socio: 'S001',
        nombre: { nombre: 'Juan', primerApellido: 'Garcia', segundoApellido: '' },
      }),
    };

    const ventaModelMock: any = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(ventas),
          }),
        }),
      }),
    };

    const service = new SociosService(
      socioModelMock,
      ventaModelMock,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    return { service, socioModelMock, ventaModelMock };
  }

  it('SOC-01: suma totalImporte y totalUnidades del mismo producto en varias ventas', async () => {
    const { service } = buildService([
      {
        createdAt: new Date('2026-07-01'),
        productos: [{ nombre: 'Coca', categoria: 'Bebida', unidades: 2, precioUnitario: 2, precioTotal: 4 }],
      },
      {
        createdAt: new Date('2026-07-02'),
        productos: [{ nombre: 'Coca', categoria: 'Bebida', unidades: 1, precioUnitario: 2, precioTotal: 2 }],
      },
    ]);

    const result = await service.getProductosConsumidos(socioId);
    expect(result.productosConsumidos).toHaveLength(1);
    expect(result.productosConsumidos[0].totalUnidades).toBe(3);
    expect(result.productosConsumidos[0].totalImporte).toBe(6);
  });

  it('SOC-02: ordena productos distintos por totalImporte descendente', async () => {
    const { service } = buildService([
      {
        createdAt: new Date('2026-07-01'),
        productos: [
          { nombre: 'Agua', unidades: 1, precioUnitario: 1, precioTotal: 1 },
          { nombre: 'Menu', unidades: 1, precioUnitario: 12, precioTotal: 12 },
        ],
      },
    ]);

    const result = await service.getProductosConsumidos(socioId);
    expect(result.productosConsumidos[0].nombre).toBe('Menu');
    expect(result.productosConsumidos[1].nombre).toBe('Agua');
  });

  it('SOC-03: resumen global coincide con la suma de productos', async () => {
    const { service } = buildService([
      {
        createdAt: new Date('2026-07-01'),
        productos: [
          { nombre: 'Agua', unidades: 2, precioUnitario: 1, precioTotal: 2 },
          { nombre: 'Menu', unidades: 1, precioUnitario: 10, precioTotal: 10 },
        ],
      },
      {
        createdAt: new Date('2026-07-02'),
        productos: [{ nombre: 'Agua', unidades: 1, precioUnitario: 1, precioTotal: 1 }],
      },
    ]);

    const result = await service.getProductosConsumidos(socioId);
    const sumaProductos = result.productosConsumidos.reduce((sum, p) => sum + p.totalImporte, 0);
    expect(result.resumen.totalImporte).toBe(sumaProductos);
    expect(result.resumen.totalImporte).toBe(13);
    expect(result.resumen.totalUnidades).toBe(4);
  });

  it('SOC-04: socio inexistente lanza NotFoundException', async () => {
    const service = new SociosService(
      { findById: jest.fn().mockResolvedValue(null) } as any,
      { find: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.getProductosConsumidos(socioId)).rejects.toThrow(NotFoundException);
  });
});

describe('SociosService.remove (sin cascada a ventas)', () => {
  it('elimina el socio y no borra ventas; getProductosConsumidos falla, ventas por codigoSocio siguen', async () => {
    const socioId = new Types.ObjectId().toString();
    const ventasPersistidas = [
      {
        _id: new Types.ObjectId(),
        codigoSocio: 'S001',
        nombreSocio: 'Juan Garcia',
        total: 10,
        pagado: 10,
        productos: [{ nombre: 'Coca', unidades: 2, precioUnitario: 5, precioTotal: 10 }],
      },
      {
        _id: new Types.ObjectId(),
        codigoSocio: 'S001',
        nombreSocio: 'Juan Garcia',
        total: 5,
        pagado: 5,
        productos: [{ nombre: 'Coca', unidades: 1, precioUnitario: 5, precioTotal: 5 }],
      },
    ];

    const socioDoc = {
      _id: socioId,
      socio: 'S001',
      nombre: { nombre: 'Juan', primerApellido: 'Garcia', segundoApellido: '' },
      foto: undefined,
      asociados: [],
    };

    const findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(socioDoc),
    });

    const socioModelMock: any = {
      findById: jest.fn()
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(socioDoc),
        })
        .mockResolvedValueOnce(null), // getProductosConsumidos tras delete
      findByIdAndDelete,
    };

    const ventaDeleteMany = jest.fn();
    const ventaDeleteOne = jest.fn();
    const ventaFindByIdAndDelete = jest.fn();

    const ventaModelMock: any = {
      find: jest.fn().mockImplementation((query: Record<string, unknown> = {}) => {
        const filtered = ventasPersistidas.filter((venta) => {
          if (query.codigoSocio && venta.codigoSocio !== query.codigoSocio) {
            return false;
          }
          return true;
        });
        return {
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(filtered),
            }),
          }),
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(filtered),
          }),
          exec: jest.fn().mockResolvedValue(filtered),
        };
      }),
      deleteMany: ventaDeleteMany,
      deleteOne: ventaDeleteOne,
      findByIdAndDelete: ventaFindByIdAndDelete,
    };

    const uploadsServiceMock: any = {
      deleteFile: jest.fn(),
    };

    const service = new SociosService(
      socioModelMock,
      ventaModelMock,
      {} as any,
      {} as any,
      {} as any,
      uploadsServiceMock,
    );

    await service.remove(socioId);

    expect(findByIdAndDelete).toHaveBeenCalledWith(socioId);
    expect(ventaDeleteMany).not.toHaveBeenCalled();
    expect(ventaDeleteOne).not.toHaveBeenCalled();
    expect(ventaFindByIdAndDelete).not.toHaveBeenCalled();

    await expect(service.getProductosConsumidos(socioId)).rejects.toThrow(NotFoundException);

    const ventasPorCodigo = await ventaModelMock.find({ codigoSocio: 'S001' }).lean().exec();
    expect(ventasPorCodigo).toHaveLength(2);
    expect(ventasPorCodigo.reduce((sum: number, v: any) => sum + v.total, 0)).toBe(15);
  });
});

describe('SociosService.confirmImportUpdate', () => {
  it('aplica update sin forzar active/rgpd/foto', async () => {
    const id = new Types.ObjectId().toString();
    const findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: id,
        socio: 'AET010',
        contacto: { telefonos: ['699'], emails: [] },
      }),
    });

    const service = new SociosService(
      { findByIdAndUpdate } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await service.confirmImportUpdate(id, {
      contacto: { telefonos: ['699'], emails: [] },
      active: false,
      rgpd: false,
      foto: 'hack.jpg',
    } as any);

    expect(findByIdAndUpdate).toHaveBeenCalled();
    const setPayload = findByIdAndUpdate.mock.calls[0][1].$set;
    expect(setPayload.active).toBeUndefined();
    expect(setPayload.rgpd).toBeUndefined();
    expect(setPayload.foto).toBeUndefined();
    expect(setPayload.contacto.telefonos).toEqual(['699']);
  });
});

describe('SociosService.fixHyphenMemberCodes', () => {
  const parentId = new Types.ObjectId();
  const bogusId = new Types.ObjectId();

  function buildFixService(opts: {
    bogusSocios?: any[];
    parent?: any | null;
    parentAlreadyHasAsociado?: boolean;
    hyphenAsociadosSocios?: any[];
    orphanVentas?: any[];
  }) {
    const parent =
      opts.parent === null
        ? null
        : opts.parent ?? {
            _id: parentId,
            socio: 'AET010',
            asociados: opts.parentAlreadyHasAsociado
              ? [{ codigo: 'AET010_01', nombre: 'Ya existe', telefono: '', foto: '' }]
              : [],
            save: jest.fn().mockResolvedValue(true),
          };

    const bogus =
      opts.bogusSocios ??
      [
        {
          _id: bogusId,
          socio: 'AET010-01',
          nombre: { nombre: 'Pepe', primerApellido: 'Lopez', segundoApellido: '' },
          contacto: { telefonos: ['600'], emails: [] },
          foto: '',
        },
      ];

    const findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });

    const socioModelMock: any = {
      find: jest.fn().mockImplementation((query: any) => {
        if (query?.socio?.$regex) {
          return { exec: jest.fn().mockResolvedValue(bogus) };
        }
        if (query?.['asociados.codigo']?.$regex) {
          return { exec: jest.fn().mockResolvedValue(opts.hyphenAsociadosSocios ?? []) };
        }
        return { exec: jest.fn().mockResolvedValue([]) };
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(parent),
      }),
      findByIdAndDelete,
    };

    const ventaUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const ventaUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const ventaModelMock: any = {
      countDocuments: jest.fn().mockResolvedValue(2),
      updateMany: ventaUpdateMany,
      updateOne: ventaUpdateOne,
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(opts.orphanVentas ?? []),
          }),
        }),
      }),
    };

    const reservaUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const reservaModelMock: any = {
      countDocuments: jest.fn().mockResolvedValue(1),
      updateMany: reservaUpdateMany,
    };

    const invitacionUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const invitacionModelMock: any = {
      countDocuments: jest.fn().mockResolvedValue(1),
      updateMany: invitacionUpdateMany,
    };

    const socioInvUpdateMany = jest.fn().mockResolvedValue({ modifiedCount: 0 });
    const socioInvModelMock: any = {
      countDocuments: jest.fn().mockResolvedValue(0),
      updateMany: socioInvUpdateMany,
    };

    const service = new SociosService(
      socioModelMock,
      ventaModelMock,
      reservaModelMock,
      invitacionModelMock,
      socioInvModelMock,
      {} as any,
    );

    return {
      service,
      parent,
      findByIdAndDelete,
      ventaUpdateMany,
      reservaUpdateMany,
      invitacionUpdateMany,
    };
  }

  it('dry-run: reporta migración sin escribir', async () => {
    const { service, parent, findByIdAndDelete, ventaUpdateMany, reservaUpdateMany } =
      buildFixService({});

    const result = await service.fixHyphenMemberCodes({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.scanned).toBe(1);
    expect(result.migrated).toEqual([
      expect.objectContaining({
        from: 'AET010-01',
        to: 'AET010_01',
        parent: 'AET010',
        ventas: 2,
        reservas: 1,
      }),
    ]);
    expect(parent.save).not.toHaveBeenCalled();
    expect(findByIdAndDelete).not.toHaveBeenCalled();
    expect(ventaUpdateMany).not.toHaveBeenCalled();
    expect(reservaUpdateMany).not.toHaveBeenCalled();
  });

  it('apply: fusiona asociado, remapea refs y borra socio erróneo', async () => {
    const { service, parent, findByIdAndDelete, ventaUpdateMany, reservaUpdateMany, invitacionUpdateMany } =
      buildFixService({});

    const result = await service.fixHyphenMemberCodes({ dryRun: false });

    expect(result.dryRun).toBe(false);
    expect(parent.asociados).toEqual([
      expect.objectContaining({ codigo: 'AET010_01', nombre: 'Pepe Lopez' }),
    ]);
    expect(parent.save).toHaveBeenCalled();
    expect(ventaUpdateMany).toHaveBeenCalledWith(
      { codigoSocio: 'AET010-01' },
      { $set: { codigoSocio: 'AET010_01' } },
    );
    expect(reservaUpdateMany).toHaveBeenCalledWith(
      { socio: bogusId },
      { $set: { socio: parentId } },
    );
    expect(invitacionUpdateMany).toHaveBeenCalled();
    expect(findByIdAndDelete).toHaveBeenCalledWith(bogusId);
  });

  it('padre inexistente: error y no borra', async () => {
    const { service, findByIdAndDelete } = buildFixService({ parent: null });

    const result = await service.fixHyphenMemberCodes({ dryRun: false });

    expect(result.migrated).toHaveLength(0);
    expect(result.errors).toEqual([
      { code: 'AET010-01', error: 'No existe el socio padre AET010' },
    ]);
    expect(findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('asociado ya existente con _: no duplica, sí remapea y borra', async () => {
    const { service, parent, findByIdAndDelete, ventaUpdateMany } = buildFixService({
      parentAlreadyHasAsociado: true,
    });

    await service.fixHyphenMemberCodes({ dryRun: false });

    expect(parent.asociados).toHaveLength(1);
    expect(parent.asociados[0].codigo).toBe('AET010_01');
    expect(parent.save).not.toHaveBeenCalled();
    expect(ventaUpdateMany).toHaveBeenCalled();
    expect(findByIdAndDelete).toHaveBeenCalledWith(bogusId);
  });
});
