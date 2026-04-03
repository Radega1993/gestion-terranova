import { test, expect } from '@playwright/test';
import { seedReservasUiData, injectAuth, openReservasAndWait, clickNuevaReserva, selectServicio, selectSocio, toggleSuplemento, setCantidadHoras, setPago, setObservaciones, submitReserva, confirmSweetAlertOk, confirmSweetAlertListaEspera, selectTrabajador, type SeededReservaData } from './reservas.fixtures';
import { UserRole } from '../src/types/user';

test.describe.serial('Reservas UI (matriz base)', () => {
  let seed: SeededReservaData;

  test.beforeAll(async ({ request }) => {
    seed = await seedReservasUiData(request);
  });

  test('TRABAJADOR: crea PENDIENTE, abre PDF y verifica que editar falla (403)', async ({ page }, testInfo) => {
    await injectAuth(page, { token: seed.trabajador.token, userRole: UserRole.TRABAJADOR, user: seed.trabajador.user });
    await openReservasAndWait(page);

    const observPending = `OBS_PENDING_${Date.now()}`;

    await clickNuevaReserva(page);
    await page.screenshot({ path: testInfo.outputPath('01_nueva_reserva_modal.png'), fullPage: true });

    await selectServicio(page, seed.servicio.nombre, seed.servicio.precio);
    await selectSocio(page, seed.socio.socioCode);

    // Sin suplementos
    await setPago(page, 0, 'Efectivo');
    await setObservaciones(page, observPending);
    await page.screenshot({ path: testInfo.outputPath('02_pendiente_form.png'), fullPage: true });

    await submitReserva(page);
    await confirmSweetAlertOk(page);
    await page.screenshot({ path: testInfo.outputPath('03_pendiente_creada.png'), fullPage: true });

    const cardPendiente = page.locator('div.MuiCard-root').filter({ hasText: observPending }).first();
    await expect(cardPendiente).toBeVisible();
    await expect(cardPendiente.getByText('PENDIENTE')).toBeVisible();

    await cardPendiente.scrollIntoViewIfNeeded();
    // Primero intentamos el botón dentro del card correcto.
    const printInCard = cardPendiente.locator('button').filter({ hasText: /Imprimir\s+Reserva/i }).first();
    if ((await printInCard.count()) > 0) {
      await printInCard.scrollIntoViewIfNeeded();
      await printInCard.click({ timeout: 5_000 });
    } else {
      // Fallback: primer botón global por texto.
      const printGlobal = page.locator('button').filter({ hasText: /Imprimir\s+Reserva/i }).first();
      await printGlobal.scrollIntoViewIfNeeded();
      await printGlobal.click({ timeout: 5_000 });
    }
    // Esperar a que el modal/PDF se renderice antes de capturar screenshot.
    await page.getByText('Comprobante de Reserva').first().waitFor({ state: 'visible', timeout: 15_000 });
    await page.screenshot({ path: testInfo.outputPath('04_pdf_modal_abierto.png'), fullPage: true });
    // Se cierra con ESC para evitar depender del botón exacto de cierre
    await page.keyboard.press('Escape');

    // Asegura que el modal de PDF se cerró antes de intentar abrir el modal de edición.
    await expect(page.getByText('Comprobante de Reserva').first()).toBeHidden({ timeout: 10_000 });

    const editBtn = cardPendiente.locator('button').filter({ hasText: /Editar/i }).first();
    await expect(editBtn).toBeVisible({ timeout: 10_000 });
    await editBtn.click();
    await page.screenshot({ path: testInfo.outputPath('05_editar_modal.png'), fullPage: true });

    // En edición montoAbonado ya es 0 -> el campo muestra "Monto Abonado"
    // Como TRABAJADOR no tiene permisos para PATCH /reservas/:id, el guardado debe fallar con 403.
    await setPago(page, seed.servicio.precio, 'Efectivo');
    await setObservaciones(page, `${observPending}_UPDATED_BY_TRABAJADOR`);

    // Al editar sin cambiar fecha/servicio, NO debería aparecer el Swal de "Reserva existente".
    const conflictTitle = page
      .locator('.swal2-popup .swal2-title')
      .filter({ hasText: 'Reserva existente' })
      .first();
    await expect(conflictTitle).toHaveCount(0);

    let editErr: any = null;
    try {
      await submitReserva(page);
      // Si no lanza error, el test debería fallar: TRABAJADOR no puede editar.
      throw new Error('Expected PATCH to fail for TRABAJADOR');
    } catch (e) {
      editErr = e;
    }

    await page.screenshot({ path: testInfo.outputPath('06_edit_falla_403.png'), fullPage: true });
    expect(editErr).toBeTruthy();
    expect(String(editErr?.message || editErr)).toContain('PATCH /reservas falló con 403');
  });

  test('TRABAJADOR: crea COMPLETADA con suplementos fijo + porHora', async ({ page }, testInfo) => {
    await injectAuth(page, { token: seed.trabajador.token, userRole: UserRole.TRABAJADOR, user: seed.trabajador.user });
    await openReservasAndWait(page, 2);

    const observCompleted = `OBS_COMPLETADA_SUPS_${Date.now()}`;
    const total = seed.servicio.precio + seed.suplementos.fijo.precio + seed.suplementos.porHora.precio * 2;

    await clickNuevaReserva(page);
    await page.screenshot({ path: testInfo.outputPath('01_completada_con_suplementos_modal.png'), fullPage: true });

    await selectServicio(page, seed.servicio.nombre, seed.servicio.precio);
    await selectSocio(page, seed.socio.socioCode);

    await toggleSuplemento(page, seed.suplementos.fijo.nombre);
    await toggleSuplemento(page, seed.suplementos.porHora.nombre);
    await setCantidadHoras(page, 2);

    await setPago(page, total, 'Efectivo');
    await setObservaciones(page, observCompleted);
    await page.screenshot({ path: testInfo.outputPath('02_completada_con_suplementos_form.png'), fullPage: true });

    await submitReserva(page);
    await confirmSweetAlertOk(page);
    await page.screenshot({ path: testInfo.outputPath('03_completada_con_suplementos_creada.png'), fullPage: true });

    const card = page.locator('div.MuiCard-root').filter({ hasText: observCompleted }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText('COMPLETADA', { exact: true })).toBeVisible();
    await expect(card.getByText(seed.suplementos.fijo.nombre)).toBeVisible();
    await expect(card.getByText(new RegExp(`${seed.suplementos.porHora.nombre}.*\\(2\\)`))).toBeVisible();
  });

  test('TRABAJADOR: crea LISTA_ESPERA (conflicto mismo servicio + fecha)', async ({ page }, testInfo) => {
    await injectAuth(page, { token: seed.trabajador.token, userRole: UserRole.TRABAJADOR, user: seed.trabajador.user });
    await openReservasAndWait(page, 3);

    const observExiste = `OBS_EXISTE_${Date.now()}`;
    const observLista = `OBS_LISTA_ESPERA_${Date.now()}`;

    // 1) Crear primera reserva (PENDIENTE) para provocar conflicto
    await clickNuevaReserva(page);
    await selectServicio(page, seed.servicio.nombre, seed.servicio.precio);
    await selectSocio(page, seed.socio.socioCode);
    await setPago(page, 0, 'Efectivo');
    await setObservaciones(page, observExiste);
    await submitReserva(page);
    await confirmSweetAlertOk(page);
    await page.screenshot({ path: testInfo.outputPath('01_conflicto_primera_reserva.png'), fullPage: true });

    const cardExiste = page.locator('div.MuiCard-root').filter({ hasText: observExiste }).first();
    await expect(cardExiste).toBeVisible();

    // 2) Segunda reserva con mismo servicio+fecha -> abre Swal de conflicto
    await clickNuevaReserva(page);
    await selectServicio(page, seed.servicio.nombre, seed.servicio.precio);
    await selectSocio(page, seed.socio.socioCode);
    await setPago(page, 20, 'Efectivo');
    await setObservaciones(page, observLista);
    await page.screenshot({ path: testInfo.outputPath('02_conflicto_segunda_form.png'), fullPage: true });

    await submitReserva(page);
    await confirmSweetAlertListaEspera(page);
    await confirmSweetAlertOk(page);
    await page.screenshot({ path: testInfo.outputPath('03_lista_espera_creada.png'), fullPage: true });

    const cardLista = page.locator('div.MuiCard-root').filter({ hasText: observLista }).first();
    await expect(cardLista).toBeVisible();
    await expect(cardLista.getByText('LISTA_ESPERA')).toBeVisible();
    await expect(cardLista.getByText(/0\\.00€|0,00€/)).toBeVisible();
  });

  test('TIENDA: crea reserva y verifica que editar exige seleccionar Trabajador', async ({ page }, testInfo) => {
    await injectAuth(page, { token: seed.tienda.token, userRole: UserRole.TIENDA, user: seed.tienda.user });
    await openReservasAndWait(page, 4);

    const observ = `OBS_TIENDA_EDIT_${Date.now()}`;
    await clickNuevaReserva(page);

    await selectServicio(page, seed.servicio.nombre, seed.servicio.precio);
    await selectSocio(page, seed.socio.socioCode);
    await selectTrabajador(page, seed.trabajadorAsignado);

    await setPago(page, 0, 'Efectivo');
    await setObservaciones(page, observ);
    await submitReserva(page);
    await confirmSweetAlertOk(page);

    const card = page.locator('div.MuiCard-root').filter({ hasText: observ }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText('PENDIENTE')).toBeVisible();

    await page.screenshot({ path: testInfo.outputPath('01_tienda_reserva_creada.png'), fullPage: true });

    // Editar y guardar sin re-seleccionar trabajador (UI lo deja en blanco) -> debe fallar
    await card.getByRole('button', { name: 'Editar' }).click();
    await page.screenshot({ path: testInfo.outputPath('02_tienda_editar_modal.png'), fullPage: true });
    await setPago(page, seed.servicio.precio, 'Efectivo');
    await setObservaciones(page, `${observ}_UPDATED`);
    await submitReserva(page);

    await page.screenshot({ path: testInfo.outputPath('03_tienda_error_snackbar.png'), fullPage: true });
    await expect(page.getByText('Debe seleccionar un trabajador para realizar la reserva')).toBeVisible();
  });
});

