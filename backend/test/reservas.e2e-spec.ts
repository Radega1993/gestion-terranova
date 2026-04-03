import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/modules/users/types/user-roles.enum';
import { EstadoReserva, MetodoPago } from '../src/modules/reservas/schemas/reserva.schema';
import { TipoSuplemento } from '../src/modules/reservas/schemas/suplemento.schema';

describe('Reservas (e2e)', () => {
  const baseUrl = '/api';
  const now = Date.now();
  const fechaValida = (daysAhead: number) => new Date(now + daysAhead * 24 * 60 * 60 * 1000).toISOString();
  const fechaInvalidaPasada = () => new Date(now - 24 * 60 * 60 * 1000).toISOString();

  let app: INestApplication;
  let server: any;

  let adminToken = '';
  let tiendaToken = '';
  let trabajadorToken = '';

  let tiendaId = '';
  let trabajadorId = '';

  let socioId = '';
  let servicioNombre = 'PISCINA';
  let servicioPrecio = 100;
  let servicioId = '';

  let suplementoFijoId = '';
  let suplementoPorHoraId = '';

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

  const createTienda = async (token: string, payload: any) => {
    const res = await request(server)
      .post(`${baseUrl}/tiendas`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body._id as string;
  };

  const createTrabajador = async (token: string, payload: any) => {
    const res = await request(server)
      .post(`${baseUrl}/trabajadores`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body._id as string;
  };

  const createSocio = async (token: string, payload: any) => {
    const res = await request(server)
      .post(`${baseUrl}/socios`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body._id as string;
  };

  const createServicio = async (token: string, payload: any) => {
    const res = await request(server)
      .post(`${baseUrl}/servicios`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body._id as string;
  };

  const createSuplemento = async (token: string, payload: any) => {
    const res = await request(server)
      .post(`${baseUrl}/servicios/suplementos`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.status).toBe(201);
    return res.body._id as string;
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

    // Usuarios base
    const password = 'TestPass_123!';
    const adminUsername = `admin_${now}`;
    const tiendaUsername = `tienda_${now}`;
    const trabajadorUsername = `trab_${now}`;

    const adminId = await registerUser(adminUsername, password, 'Admin', 'Root', UserRole.ADMINISTRADOR);
    adminToken = await login(adminUsername, password);

    const tiendaUserId = await registerUser(tiendaUsername, password, 'Tienda', 'User', UserRole.TIENDA);
    tiendaToken = await login(tiendaUsername, password);

    const trabajadorUserId = await registerUser(
      trabajadorUsername,
      password,
      'Trabajador',
      'User',
      UserRole.TRABAJADOR,
    );
    trabajadorToken = await login(trabajadorUsername, password);

    // Tienda y trabajador (para TIENDA->trabajadorId)
    tiendaId = await createTienda(adminToken, {
      nombre: `TiendaTest_${now}`,
      codigo: `COD_${now}`,
      usuarioAsignado: tiendaUserId,
      activa: true,
    });

    trabajadorId = await createTrabajador(adminToken, {
      nombre: `Trab_${now}`,
      identificador: `TRB_${now}`,
      tienda: tiendaId,
      activo: true,
    });

    // Socio mínimo
    socioId = await createSocio(adminToken, {
      socio: `SOC_${now}`,
      casa: 1,
      totalSocios: 1,
      cuota: 10,
      rgpd: true,
      nombre: { nombre: 'Socio', primerApellido: 'Prueba', segundoApellido: 'X' },
      direccion: {
        calle: 'Calle Test',
        numero: '1',
        piso: '1',
        poblacion: 'Ciudad Test',
        cp: '28000',
        provincia: 'Madrid',
      },
      contacto: {
        telefonos: ['600000000'],
        emails: ['socio@test.com'],
      },
      asociados: [],
      isActive: true,
    });

    // Servicios y suplementos
    servicioId = `SERV_${now}`;
    const servicioDocId = await createServicio(adminToken, {
      id: servicioId,
      nombre: servicioNombre,
      precio: servicioPrecio,
      color: '#000000',
      colorConObservaciones: '#FFFFFF',
      activo: true,
    });
    expect(servicioDocId).toBeTruthy();

    suplementoFijoId = `SUP_FIJO_${now}`;
    suplementoPorHoraId = `SUP_PORHORA_${now}`;

    await createSuplemento(adminToken, {
      id: suplementoFijoId,
      nombre: 'Suplemento Fijo',
      precio: 10,
      tipo: TipoSuplemento.FIJO,
      activo: true,
    });

    await createSuplemento(adminToken, {
      id: suplementoPorHoraId,
      nombre: 'Suplemento Por Hora',
      precio: 5,
      tipo: TipoSuplemento.POR_HORA,
      activo: true,
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('TRABAJADOR: create PENDIENTE (montoAbonado=0)', async () => {
    const payload = {
      fecha: fechaValida(5),
      tipoInstalacion: servicioNombre,
      socio: socioId,
      usuarioCreacion: '',
      suplementos: [],
      precio: servicioPrecio,
      observaciones: 'Pendiente',
      montoAbonado: 0,
      metodoPago: MetodoPago.EFECTIVO,
    };

    // No dependemos del perfil para evitar flakiness: usuarioCreacion lo mandamos con el _id del token
    // (JwtStrategy lo resuelve desde DB; el campo se guarda en `res.body.user._id` al login).
    // Para mantenerlo simple, usamos el usuarioCreacion del propio token decodificado via /profile.
    const profileRes = await request(server)
      .get(`${baseUrl}/auth/profile`)
      .set('Authorization', `Bearer ${trabajadorToken}`);
    expect(profileRes.status).toBe(200);
    payload.usuarioCreacion = profileRes.body._id;

    const res = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe(EstadoReserva.PENDIENTE);
    expect(Number(res.body.montoAbonado)).toBe(0);
  });

  it('TRABAJADOR: create COMPLETADA (montoAbonado == precio) con suplementos', async () => {
    const precioTotal = servicioPrecio + 10 + 5 * 2;
    const profileRes = await request(server)
      .get(`${baseUrl}/auth/profile`)
      .set('Authorization', `Bearer ${trabajadorToken}`);

    const payload = {
      fecha: fechaValida(6),
      tipoInstalacion: servicioNombre,
      socio: socioId,
      usuarioCreacion: profileRes.body._id,
      suplementos: [
        { id: suplementoFijoId },
        { id: suplementoPorHoraId, cantidad: 2 },
      ],
      precio: precioTotal,
      observaciones: 'Completada',
      montoAbonado: precioTotal,
      metodoPago: MetodoPago.EFECTIVO,
      normativaAceptada: true,
      firmaSocio: 'firma-test',
    };

    const res = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe(EstadoReserva.COMPLETADA);
    expect(Number(res.body.montoAbonado)).toBeCloseTo(precioTotal, 2);
    expect(res.body.normativaAceptada).toBe(true);
    expect(res.body.firmaSocio).toBe('firma-test');
  });

  it('TRABAJADOR: create LISTA_ESPERA fuerza montoAbonado=0', async () => {
    const profileRes = await request(server)
      .get(`${baseUrl}/auth/profile`)
      .set('Authorization', `Bearer ${trabajadorToken}`);

    const res = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({
        fecha: fechaValida(7),
        tipoInstalacion: servicioNombre,
        socio: socioId,
        usuarioCreacion: profileRes.body._id,
        suplementos: [],
        precio: servicioPrecio,
        observaciones: 'Lista espera',
        montoAbonado: 20,
        metodoPago: MetodoPago.EFECTIVO,
        estado: EstadoReserva.LISTA_ESPERA,
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe(EstadoReserva.LISTA_ESPERA);
    expect(Number(res.body.montoAbonado)).toBe(0);
  });

  it('TIENDA: create requiere trabajadorId y con el correcto funciona', async () => {
    const profileRes = await request(server)
      .get(`${baseUrl}/auth/profile`)
      .set('Authorization', `Bearer ${tiendaToken}`);

    // Sin trabajadorId => 400
    const resFail = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${tiendaToken}`)
      .send({
        fecha: fechaValida(8),
        tipoInstalacion: servicioNombre,
        socio: socioId,
        usuarioCreacion: profileRes.body._id,
        suplementos: [],
        precio: servicioPrecio,
        observaciones: 'Sin trabajadorId',
        montoAbonado: 0,
        metodoPago: MetodoPago.EFECTIVO,
      });

    expect(resFail.status).toBe(400);

    // Con trabajadorId => ok
    const resOk = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${tiendaToken}`)
      .send({
        fecha: fechaValida(9),
        tipoInstalacion: servicioNombre,
        socio: socioId,
        usuarioCreacion: profileRes.body._id,
        suplementos: [],
        precio: servicioPrecio,
        observaciones: 'Con trabajadorId',
        montoAbonado: 0,
        metodoPago: MetodoPago.EFECTIVO,
        trabajadorId,
      });

    expect(resOk.status).toBe(201);
    expect(resOk.body.estado).toBeDefined();
  });

  it('PATCH: recalcula estado y valida restricciones (LIQUIDADA/fecha/persmisos)', async () => {
    // Obtener una reserva reciente con estado PENDIENTE creada por TRABAJADOR
    const listRes = await request(server)
      .get(`${baseUrl}/reservas/`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    const reservaPendiente = listRes.body.find((r: any) => r.socio?._id?.toString() === socioId.toString() && r.estado === EstadoReserva.PENDIENTE);
    expect(reservaPendiente).toBeTruthy();

    // PATCH recalcula a COMPLETADA
    const patchToComplete = await request(server)
      .patch(`${baseUrl}/reservas/${reservaPendiente._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        precio: servicioPrecio,
        montoAbonado: servicioPrecio,
        metodoPago: MetodoPago.EFECTIVO,
      });
    expect(patchToComplete.status).toBe(200);
    expect(patchToComplete.body.estado).toBe(EstadoReserva.COMPLETADA);

    // PATCH fecha pasada => 400
    const patchInvalidDate = await request(server)
      .patch(`${baseUrl}/reservas/${reservaPendiente._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fecha: fechaInvalidaPasada(),
      });
    expect(patchInvalidDate.status).toBe(400);

    // Crear reserva LIQUIDADA y asegurar que PATCH falla
    const profileAdminRes = await request(server).get(`${baseUrl}/auth/profile`).set('Authorization', `Bearer ${adminToken}`);
    const liquidadaRes = await request(server)
      .post(`${baseUrl}/reservas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fecha: fechaValida(10),
        tipoInstalacion: servicioNombre,
        socio: socioId,
        usuarioCreacion: profileAdminRes.body._id,
        suplementos: [],
        precio: servicioPrecio,
        observaciones: 'Liquidada',
        montoAbonado: servicioPrecio,
        metodoPago: MetodoPago.EFECTIVO,
        estado: EstadoReserva.LIQUIDADA,
      });
    expect(liquidadaRes.status).toBe(201);

    const patchLiquidada = await request(server)
      .patch(`${baseUrl}/reservas/${liquidadaRes.body._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        observaciones: 'No debería permitir',
      });
    expect(patchLiquidada.status).toBe(400);

    // Permisos: TRABAJADOR no puede PATCH
    const patchPermission = await request(server)
      .patch(`${baseUrl}/reservas/${liquidadaRes.body._id}`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({
        observaciones: 'Debe fallar por permisos',
      });
    expect([401, 403]).toContain(patchPermission.status);
  });
});

