import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { UserRole } from '../src/types/user';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export type SeededReservaData = {
  apiBaseUrl: string;
  fechaISO: string;
  admin: { username: string; password: string; token: string; user: any };
  trabajador: { username: string; password: string; token: string; user: any };
  tienda: { username: string; password: string; token: string; user: any };
  tiendaId: string;
  trabajadorId: string;
  trabajadorAsignado: { nombre: string; identificador: string };
  socio: { socioCode: string; socioId: string; display: string };
  servicio: { servicioId: string; nombre: string; precio: number; display: string };
  suplementos: {
    fijo: { id: string; nombre: string; precio: number; tipo: 'fijo' };
    porHora: { id: string; nombre: string; precio: number; tipo: 'porHora' };
  };
};

const makeDates = () => {
  const d = new Date();
  return {
    // Fecha actual en ISO (UTC) para que el backend valide correctamente
    fechaISO: d.toISOString(),
    // Fecha en formato YYYY-MM-DD (para el input date)
    fechaInput: d.toISOString().slice(0, 10),
  };
};

async function registerUser(
  api: APIRequestContext,
  apiBaseUrl: string,
  payload: { username: string; password: string; nombre: string; apellidos: string; role: UserRole },
) {
  const res = await api.post(`${apiBaseUrl}/users/register`, { data: payload });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body.user._id as string;
}

async function login(api: APIRequestContext, apiBaseUrl: string, username: string, password: string) {
  const res = await api.post(`${apiBaseUrl}/auth/login`, { data: { username, password } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body.access_token as string;
}

async function fetchProfile(api: APIRequestContext, apiBaseUrl: string, token: string) {
  const res = await api.get(`${apiBaseUrl}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(200);
  return res.json();
}

async function createTienda(api: APIRequestContext, apiBaseUrl: string, token: string, payload: any) {
  const res = await api.post(`${apiBaseUrl}/tiendas`, { data: payload, headers: { Authorization: `Bearer ${token}` } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body._id as string;
}

async function createTrabajador(api: APIRequestContext, apiBaseUrl: string, token: string, payload: any) {
  const res = await api.post(`${apiBaseUrl}/trabajadores`, { data: payload, headers: { Authorization: `Bearer ${token}` } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body._id as string;
}

async function createSocio(api: APIRequestContext, apiBaseUrl: string, token: string, payload: any) {
  const res = await api.post(`${apiBaseUrl}/socios`, { data: payload, headers: { Authorization: `Bearer ${token}` } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body._id as string;
}

async function createServicio(api: APIRequestContext, apiBaseUrl: string, token: string, payload: any) {
  const res = await api.post(`${apiBaseUrl}/servicios`, { data: payload, headers: { Authorization: `Bearer ${token}` } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body._id as string;
}

async function createSuplemento(api: APIRequestContext, apiBaseUrl: string, token: string, payload: any) {
  const res = await api.post(`${apiBaseUrl}/servicios/suplementos`, { data: payload, headers: { Authorization: `Bearer ${token}` } });
  expect([200, 201]).toContain(res.status());
  const body = await res.json();
  return body._id as string;
}

export async function seedReservasUiData(api: APIRequestContext, overrides?: Partial<{ apiBaseUrl: string }>): Promise<SeededReservaData> {
  const apiBaseUrl = overrides?.apiBaseUrl ?? process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const { fechaISO } = makeDates();

  const now = Date.now();
  const password = `TestPass_${now}!`;

  const adminUsername = `pw_admin_${now}`;
  const trabajadorUsername = `pw_trab_${now}`;
  const tiendaUsername = `pw_tienda_${now}`;

  const adminId = await registerUser(api, apiBaseUrl, {
    username: adminUsername,
    password,
    nombre: 'AdminPW',
    apellidos: 'Root',
    role: UserRole.ADMINISTRADOR,
  });
  void adminId;

  const adminToken = await login(api, apiBaseUrl, adminUsername, password);
  const adminUser = await fetchProfile(api, apiBaseUrl, adminToken);

  const tiendaUserId = await registerUser(api, apiBaseUrl, {
    username: tiendaUsername,
    password,
    nombre: 'TiendaPW',
    apellidos: 'User',
    role: UserRole.TIENDA,
  });
  const tiendaToken = await login(api, apiBaseUrl, tiendaUsername, password);
  const tiendaUser = await fetchProfile(api, apiBaseUrl, tiendaToken);

  const trabajadorId = await registerUser(api, apiBaseUrl, {
    username: trabajadorUsername,
    password,
    nombre: 'TrabPW',
    apellidos: 'User',
    role: UserRole.TRABAJADOR,
  });
  void trabajadorId;
  const trabajadorToken = await login(api, apiBaseUrl, trabajadorUsername, password);
  const trabajadorUser = await fetchProfile(api, apiBaseUrl, trabajadorToken);

  const tiendaId = await createTienda(api, apiBaseUrl, adminToken, {
    nombre: `TiendaPW_${now}`,
    codigo: `CODPW_${now}`,
    usuarioAsignado: tiendaUserId,
    activa: true,
  });

  const trabajadorAsignadoId = await createTrabajador(api, apiBaseUrl, adminToken, {
    nombre: `TrabAssigned_${now}`,
    identificador: `TRBPW_${now}`,
    tienda: tiendaId,
    activo: true,
  });

  const trabajadorAsignado = {
    nombre: `TrabAssigned_${now}`,
    identificador: `TRBPW_${now}`,
  };

  const socioCode = `SOC_PW_${now}`;
  const socioId = await createSocio(api, apiBaseUrl, adminToken, {
    socio: socioCode,
    casa: 1,
    totalSocios: 1,
    cuota: 10,
    rgpd: true,
    nombre: { nombre: 'SocioPW', primerApellido: 'Apellido', segundoApellido: 'Z' },
    direccion: {
      calle: 'Calle PW',
      numero: '1',
      piso: '1',
      poblacion: 'Ciudad PW',
      cp: '28000',
      provincia: 'Madrid',
    },
    contacto: {
      telefonos: ['600000000'],
      emails: ['socioPW@test.com'],
    },
    asociados: [],
    isActive: true,
  });

  const servicioNombre = `ServicioPW_${now}`;
  const servicioPrecio = 100;
  const servicioId = `SERVPW_${now}`;
  await createServicio(api, apiBaseUrl, adminToken, {
    id: servicioId,
    nombre: servicioNombre,
    precio: servicioPrecio,
    color: '#000000',
    colorConObservaciones: '#FFFFFF',
    activo: true,
  });

  const fijoId = `SU_FIJO_PW_${now}`;
  const porHoraId = `SU_PORHORA_PW_${now}`;
  const suplementoFijoNombre = `Suplemento Fijo PW_${now}`;
  const suplementoPorHoraNombre = `Suplemento Por Hora PW_${now}`;

  // Tipos vienen como strings ('fijo' | 'porHora') gracias a TipoSuplemento en backend
  await createSuplemento(api, apiBaseUrl, adminToken, {
    id: fijoId,
    nombre: suplementoFijoNombre,
    precio: 10,
    tipo: 'fijo',
    activo: true,
  });

  await createSuplemento(api, apiBaseUrl, adminToken, {
    id: porHoraId,
    nombre: suplementoPorHoraNombre,
    precio: 5,
    tipo: 'porHora',
    activo: true,
  });

  return {
    apiBaseUrl,
    fechaISO,
    admin: { username: adminUsername, password, token: adminToken, user: adminUser },
    trabajador: { username: trabajadorUsername, password, token: trabajadorToken, user: trabajadorUser },
    tienda: { username: tiendaUsername, password, token: tiendaToken, user: tiendaUser },
    tiendaId,
    trabajadorId: trabajadorAsignadoId,
    trabajadorAsignado,
    socio: {
      socioCode,
      socioId,
      display: `${'SocioPW'} ${'Apellido'} (${socioCode})`,
    },
    servicio: {
      servicioId,
      nombre: servicioNombre,
      precio: servicioPrecio,
      display: `${servicioNombre} - ${servicioPrecio}€`,
    },
    suplementos: {
      fijo: { id: fijoId, nombre: suplementoFijoNombre, precio: 10, tipo: 'fijo' },
      porHora: { id: porHoraId, nombre: suplementoPorHoraNombre, precio: 5, tipo: 'porHora' },
    },
  };
}

export async function injectAuth(page: Page, auth: { token: string; userRole: UserRole; user: any }) {
  // ZUSTAND persist usa localStorage key `auth-storage` con shape: { state: {...}, version: 0 }
  await page.addInitScript(({ token, userRole, user }) => {
    const authStorage = {
      state: {
        token,
        user,
        userRole,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(authStorage));
  }, auth);
}

export async function openReservasAndWait(page: Page, offsetDays: number = 1) {
  await page.goto('/reservas');
  await page.getByRole('heading', { name: 'Reservas', exact: true }).first().waitFor();

  // El backend valida contra "ahora" con hora, por lo que "hoy" (00:00) puede contarse como pasado.
  // Seleccionamos automáticamente "mañana" en el calendario para que la reserva sea válida.
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const targetDay = target.getDate();

  const dayCell = page.locator('[role="gridcell"]').filter({ hasText: String(targetDay) }).first();
  await dayCell.click();
}

export async function clickNuevaReserva(page: Page) {
  const nuevaReservaBtn = page.locator('button').filter({ hasText: /Nueva\s+Reserva/i }).first();
  await nuevaReservaBtn.scrollIntoViewIfNeeded();
  await nuevaReservaBtn.click({ timeout: 10_000 });

  // Esperamos el título del modal de creación (evita depender de selectores frágiles).
  await page.getByRole('heading', { name: 'Nueva Reserva', exact: true }).first().waitFor({ timeout: 10_000 });
}

export async function selectServicio(page: Page, servicioNombre: string, servicioPrecio: number) {
  const servicioOptionText = `${servicioNombre} - ${servicioPrecio}€`;
  // El trigger del select suele ser un div con clase MUI dentro del modal.
  const modal = page.locator('.MuiDialog-container').first();
  const selectTrigger = modal.locator('.MuiSelect-select').first();
  await selectTrigger.waitFor({ state: 'visible' });
  await selectTrigger.click();

  const option = page.getByRole('option').filter({ hasText: servicioOptionText });
  await option.first().click();
}

export async function selectSocio(page: Page, socioCode: string) {
  const socioCombo = page.getByRole('combobox', { name: 'Socio' }).first();
  await socioCombo.click();
  await socioCombo.fill(socioCode);
  const option = page.getByRole('option').filter({ hasText: socioCode }).first();
  await option.click();
}

export async function toggleSuplemento(page: Page, suplementoNombre: string) {
  await page.getByText(suplementoNombre, { exact: true }).click();
}

export async function setCantidadHoras(page: Page, cantidad: number) {
  await page.getByLabel('Cantidad de horas').fill(String(cantidad));
}

export async function setPago(page: Page, montoAbonado: number, metodoPagoTexto: 'Efectivo' | 'Tarjeta') {
  const montoInput = page.getByLabel('Monto Abonado');
  // En algunos flujos (p.ej. LISTA_ESPERA) el backend fuerza montoAbonado=0 y la UI deshabilita el input.
  if (await montoInput.isEnabled()) {
    await montoInput.fill(String(montoAbonado));
  }
  const modal = page.locator('.MuiDialog-container').first();
  const selects = modal.locator('.MuiSelect-select');
  const count = await selects.count();
  // En el modal de reservas, normalmente:
  // - 0: Servicio
  // - 1: Método de Pago
  const paymentSelectIndex = count >= 2 ? 1 : 0;
  await selects.nth(paymentSelectIndex).click();
  // El menú de opciones renderiza role="option"
  await page.getByRole('option', { name: new RegExp(metodoPagoTexto, 'i') }).first().click();
}

export async function selectTrabajador(page: Page, trabajador: { identificador: string; nombre: string }) {
  await page.getByLabel('Trabajador').click();
  await page.getByRole('option', { name: new RegExp(trabajador.identificador) }).click();
}

export async function setObservaciones(page: Page, observaciones: string) {
  await page.getByLabel('Observaciones').fill(observaciones);
}

export async function submitReserva(page: Page) {
  const maybeConfirmConflictReservation = async () => {
    // En el flujo de "Reserva existente" el título es fijo; sirve para destrabar el submit.
    const conflictTitle = page
      .locator('.swal2-popup .swal2-title')
      .filter({ hasText: 'Reserva existente' })
      .first();

    try {
      await conflictTitle.waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator('.swal2-popup .swal2-confirm').first().click();
    } catch {
      // Si no aparece, no hacemos nada.
    }
  };

  const createBtn = page.getByRole('button', { name: 'Crear Reserva' });
  if (await createBtn.isVisible()) {
    const respPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/reservas') && resp.request().method() === 'POST',
      { timeout: 60_000 },
    );
    await createBtn.click();
    await maybeConfirmConflictReservation();
    const resp = await respPromise;
    if (![200, 201].includes(resp.status())) {
      const bodyText = await resp.text().catch(() => '');
      throw new Error(`POST /reservas falló con ${resp.status()}: ${bodyText || '(sin body)'}`);
    }
    return resp;
  }

  const saveBtn = page.getByRole('button', { name: 'Guardar Cambios' });
  const respPromise = page.waitForResponse(
    (resp) => resp.url().includes('/api/reservas') && resp.request().method() === 'PATCH',
    { timeout: 60_000 },
  );
  await saveBtn.click();
  await maybeConfirmConflictReservation();
  const resp = await respPromise;
  if (![200, 201].includes(resp.status())) {
    const bodyText = await resp.text().catch(() => '');
    throw new Error(`PATCH /reservas falló con ${resp.status()}: ${bodyText || '(sin body)'}`);
  }
  return resp;
}

export async function confirmSweetAlertOk(page: Page) {
  const swalPopup = page.locator('.swal2-popup').first();
  const snackbarAlert = page.getByRole('alert').first();

  const timeoutMs = 15_000;
  const result = await Promise.race([
    swalPopup.waitFor({ state: 'visible', timeout: timeoutMs }).then(() => ({ kind: 'swal' as const })),
    snackbarAlert.waitFor({ state: 'visible', timeout: timeoutMs }).then(async () => {
      const text = await snackbarAlert.textContent();
      return { kind: 'snackbar' as const, text: text?.trim() || '' };
    }),
  ]);

  if (result.kind === 'snackbar') {
    throw new Error(`Reserva no se creó. Snackbar: ${result.text || '(sin texto)'}`);
  }

  const confirm = page.locator('.swal2-popup .swal2-confirm').first();
  await confirm.click();
}

export async function confirmSweetAlertListaEspera(page: Page) {
  // En este flujo el botón de confirmación también suele ser `.swal2-confirm`
  return confirmSweetAlertOk(page);
}

