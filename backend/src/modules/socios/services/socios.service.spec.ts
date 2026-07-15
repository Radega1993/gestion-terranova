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
      { } as any,
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
    );

    await expect(service.getProductosConsumidos(socioId)).rejects.toThrow(NotFoundException);
  });
});
