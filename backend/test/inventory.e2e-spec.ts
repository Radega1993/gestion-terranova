import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/modules/users/types/user-roles.enum';

describe('Inventory stock additions (e2e)', () => {
  const baseUrl = '/api';
  const now = Date.now();

  let app: INestApplication;
  let server: any;
  let adminToken = '';
  let trabajadorToken = '';
  let productId = '';

  const registerUser = async (username: string, password: string, nombre: string, apellidos: string, role: UserRole) => {
    const res = await request(server).post(`${baseUrl}/users/register`).send({
      username,
      password,
      nombre,
      apellidos,
      role,
    });
    expect(res.status).toBe(201);
    return res.body.user?._id as string;
  };

  const login = async (username: string, password: string) => {
    const res = await request(server).post(`${baseUrl}/auth/login`).send({ username, password });
    expect([200, 201]).toContain(res.status);
    return res.body.access_token as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();

    const password = 'TestPass_123!';
    const adminUsername = `admin_stock_${now}`;
    const trabajadorUsername = `trab_stock_${now}`;

    await registerUser(adminUsername, password, 'Admin', 'Stock', UserRole.ADMINISTRADOR);
    adminToken = await login(adminUsername, password);

    await registerUser(trabajadorUsername, password, 'Trabajador', 'Stock', UserRole.TRABAJADOR);
    trabajadorToken = await login(trabajadorUsername, password);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow TRABAJADOR to add stock and ADMINISTRADOR to view audit records', async () => {
    const productPayload = {
      nombre: `Producto Stock ${now}`,
      tipo: 'GENERAL',
      unidad_medida: 'unidad',
      stock_actual: 5,
      precio_compra_unitario: 10,
    };

    const createRes = await request(server)
      .post(`${baseUrl}/inventory`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body._id).toBeDefined();
    expect(createRes.body.stock_actual).toBe(5);
    productId = createRes.body._id;

    const addStockRes = await request(server)
      .post(`${baseUrl}/inventory/stock-additions`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({ productoId: productId, cantidad: 7, observaciones: 'Ingreso de prueba' });

    expect(addStockRes.status).toBe(201);
    expect(addStockRes.body._id).toBeDefined();
    expect(addStockRes.body.producto).toBeDefined();
    expect(addStockRes.body.cantidad).toBe(7);
    expect(addStockRes.body.usuarioRegistro).toBeDefined();
    expect(addStockRes.body.observaciones).toBe('Ingreso de prueba');

    const productAfterStock = await request(server)
      .get(`${baseUrl}/inventory/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(productAfterStock.status).toBe(200);
    expect(productAfterStock.body.stock_actual).toBe(12);

    const stockAuditRes = await request(server)
      .get(`${baseUrl}/inventory/stock-additions`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(stockAuditRes.status).toBe(200);
    expect(Array.isArray(stockAuditRes.body)).toBe(true);
    expect(stockAuditRes.body.some((item: any) => item._id === addStockRes.body._id)).toBe(true);
  });
});
