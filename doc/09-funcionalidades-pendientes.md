# Funcionalidades Pendientes de Implementar

Este documento detalla todas las funcionalidades que están pendientes de implementar o que están parcialmente implementadas.

## Estado General
- **Total de funcionalidades pendientes**: 14
- **✅ Completadas**: 7
- **⚠️ Parcialmente implementadas**: 4
- **❌ No implementadas**: 3

---

## 1. Ordenar Socios por Código

### Estado: ❌ No implementado

### Descripción
Permitir ordenar la lista de socios por código (ascendente/descendente).

### Archivos a modificar
- `frontend/src/components/socios/SociosList.tsx`

### Implementación
- Añadir botón/selector de ordenamiento
- Estado para controlar el orden (ascendente/descendente)
- Aplicar ordenamiento antes de renderizar la lista

### Prioridad: Media

---

## 2. Ampliar Imagen del Socio al Pasar el Ratón

### Estado: ❌ No implementado

### Descripción
Al pasar el ratón sobre la imagen del socio, mostrar una vista ampliada (tooltip o modal).

### Archivos a modificar
- `frontend/src/components/socios/SociosList.tsx`

### Implementación
- Usar `Tooltip` de Material-UI con imagen ampliada
- O usar `Dialog` con imagen grande al hacer hover/click
- Componente `ImageZoom` o similar

### Prioridad: Baja

---

## 3. Guardar Fianza de Reserva en Recaudaciones

### Estado: ✅ Completado

### Descripción
Al liquidar una reserva, guardar la fianza pagada para el control de caja al final del día.

### Archivos modificados
- ✅ `backend/src/modules/reservas/schemas/reserva.schema.ts` - Campo `fianza` añadido
- ✅ `backend/src/modules/reservas/dto/liquidar-reserva.dto.ts` - Campo `fianza` añadido
- ✅ `backend/src/modules/reservas/services/reservas.service.ts` - Guarda fianza al liquidar
- ✅ `backend/src/modules/ventas/services/ventas.service.ts` - Incluye fianza en recaudaciones
- ✅ `frontend/src/components/reservas/liquidacion/LiquidacionPayment.tsx` - Campo fianza añadido
- ✅ `frontend/src/components/reservas/LiquidacionDialog.tsx` - Integración de fianza
- ✅ `frontend/src/components/recaudaciones/RecaudacionesList.tsx` - Muestra fianza y total de fianzas

### Implementación completada
1. ✅ Campo `fianza: number` añadido al schema de Reserva
2. ✅ Fianza incluida en el DTO de liquidación
3. ✅ Fianza se guarda al liquidar reserva
4. ✅ Fianza incluida en el cálculo de recaudaciones
5. ✅ Fianza mostrada en el informe de recaudaciones con columna dedicada y total de fianzas

### Prioridad: Alta

---

## 4. Registrar Invitaciones desde Trabajador

### Estado: ⚠️ Parcialmente implementado

### Descripción
Los trabajadores y usuarios TIENDA deben poder registrar invitaciones.

### Archivos a modificar
- `backend/src/modules/invitaciones/controllers/invitaciones.controller.ts`

### Implementación
- Cambiar el decorador `@Roles` en el endpoint `create` para incluir `UserRole.TRABAJADOR` y `UserRole.TIENDA`

### Prioridad: Media

---

## 5. Normativa para Reserva (Imprimir y Firma)

### Estado: ❌ No implementado

### Descripción
Añadir normativa a la reserva para imprimir y que el socio firme.

### Archivos a modificar
- `backend/src/modules/reservas/schemas/reserva.schema.ts` - Añadir campo `normativaAceptada` y `firmaSocio`
- `backend/src/modules/reservas/dto/create-reserva.dto.ts` - Añadir campo opcional
- `frontend/src/components/reservas/ReservaPDF.tsx` - Incluir normativa en PDF
- `frontend/src/components/reservas/ReservaForm.tsx` - Checkbox de aceptación de normativa
- `frontend/src/components/reservas/ReservasList.tsx` - Campo para firma

### Implementación
1. Añadir campos al schema:
   - `normativaAceptada: boolean`
   - `firmaSocio: string` (base64 o URL de imagen)
   - `fechaAceptacionNormativa: Date`
2. Incluir normativa en el PDF de reserva
3. Añadir checkbox de aceptación en el formulario
4. Añadir campo para firma (canvas o upload)

### Prioridad: Media

---

## 6. Reserva - Cancelar: Quitar Importe Pendiente y Marcar Devolución

### Estado: ✅ Completado

### Descripción
Al cancelar una reserva, automáticamente quitar el importe pendiente y marcar que se ha hecho la devolución.

### Archivos modificados
- ✅ `backend/src/modules/reservas/services/reservas.service.ts` - Método `cancelar` actualizado
- ✅ `frontend/src/components/reservas/ReservasList.tsx` - Cálculo automático del importe pendiente

### Implementación completada
1. ✅ En el método `cancelar`, calcula el importe pendiente (precio - montoAbonado)
2. ✅ Establece `montoDevuelto` igual al importe pendiente (o el especificado en el DTO)
3. ✅ Establece `montoAbonado` a 0 al cancelar
4. ✅ Actualiza `fechaCancelacion` y `motivoCancelacion`
5. ✅ Frontend calcula y envía automáticamente el importe pendiente

### Prioridad: Alta

---

## 7. Listado de Reservas (Reporte Descargable)

### Estado: ❌ No implementado

### Descripción
Generar un reporte descargable (PDF/Excel) con todas las reservas filtradas.

### Archivos a modificar
- `backend/src/modules/reservas/controllers/reservas.controller.ts` - Endpoint de exportación
- `backend/src/modules/reservas/services/reservas.service.ts` - Método de exportación
- `frontend/src/components/reservas/ReservasList.tsx` - Botón de exportar

### Implementación
1. Crear endpoint `GET /reservas/export` que acepte filtros
2. Generar PDF o Excel con todas las reservas
3. Usar librería como `pdfkit` o `exceljs`
4. Añadir botón de exportar en el frontend

### Prioridad: Media

---

## 8. Informe de Socios - Productos Consumidos

### Estado: ❌ No implementado

### Descripción
Mostrar en el informe de socios los productos consumidos por cada socio.

### Archivos a modificar
- `backend/src/modules/socios/controllers/socios.controller.ts` - Endpoint de informe
- `backend/src/modules/socios/services/socios.service.ts` - Método para obtener consumo
- `frontend/src/components/socios/SociosDetails.tsx` - Mostrar productos consumidos
- `frontend/src/components/socios/SociosList.tsx` - Botón de ver informe

### Implementación
1. Crear endpoint `GET /socios/:id/productos-consumidos`
2. Consultar ventas donde `codigoSocio` coincida
3. Agrupar productos por socio
4. Mostrar lista de productos con cantidades y fechas
5. Opcional: Generar PDF del informe

### Prioridad: Media

---

## 9. Informe Recaudaciones - Mostrar Método de Pago

### Estado: ✅ Completado

### Descripción
En el informe de recaudaciones, mostrar claramente si se ha pagado en tarjeta o efectivo.

### Archivos modificados
- ✅ `backend/src/modules/ventas/services/ventas.service.ts` - Incluye metodoPago en recaudaciones
- ✅ `frontend/src/components/recaudaciones/RecaudacionesList.tsx` - Columna método de pago con chips
- ✅ `frontend/src/components/recaudaciones/ResumenGeneralPDF.tsx` - Sección de totales por método de pago
- ✅ `frontend/src/components/recaudaciones/ResumenDetalladoPDF.tsx` - Interfaz actualizada

### Implementación completada
1. ✅ Columna "Método de Pago" añadida en la tabla de recaudaciones
2. ✅ Chips de color para EFECTIVO/TARJETA
3. ✅ Método de pago incluido en los PDFs de resumen
4. ✅ Totales agrupados por método de pago (Efectivo y Tarjeta)

### Prioridad: Alta

---

## 10. Total Recaudaciones del Usuario

### Estado: ✅ Completado

### Descripción
Mostrar el total de recaudaciones agrupado por usuario/trabajador.

### Archivos modificados
- ✅ `frontend/src/components/recaudaciones/RecaudacionesList.tsx` - Tabla de totales por usuario
- ✅ `frontend/src/components/recaudaciones/ResumenGeneralPDF.tsx` - Ya incluía totales por trabajador

### Implementación completada
1. ✅ Recaudaciones agrupadas por `usuario.username`
2. ✅ Totales calculados por usuario (total recaudado y cantidad de transacciones)
3. ✅ Tabla de resumen de totales por usuario con porcentaje del total
4. ✅ Resumen general ya incluía totales por trabajador en el PDF

### Prioridad: Alta

---

## 11. Validación de Decimales (Punto y Coma)

### Estado: ⚠️ Parcialmente implementado

### Descripción
Permitir usar tanto punto (.) como coma (,) como separador decimal y transformarlos a formato estándar.

### Archivos a modificar
- `frontend/src/components/common/CurrencyInput.tsx` - Añadir soporte para coma
- `frontend/src/utils/formatters.ts` - Función para normalizar decimales
- `backend/src/modules/**/dto/*.dto.ts` - Transformar en validación

### Implementación
1. Modificar `CurrencyInput` para aceptar coma como separador decimal
2. Crear función `normalizeDecimal` que convierta coma a punto
3. Aplicar transformación antes de enviar al backend
4. Opcional: Validación en backend con `@Transform` de class-transformer

### Prioridad: Media

---

## 12. Pago Acumulado de Deudas por Socio

### Estado: ✅ Completado

### Descripción
Permitir seleccionar múltiples deudas de un socio y pagarlas todas a la vez.

### Archivos modificados
- ✅ `frontend/src/components/deudas/DeudasList.tsx` - Checkboxes de selección y botón de pago acumulado
- ✅ `frontend/src/components/deudas/PagoAcumuladoModal.tsx` - Nuevo modal para pago múltiple

### Implementación completada
1. ✅ Checkboxes añadidos en la tabla de deudas con selección múltiple
2. ✅ Estado para almacenar ventas seleccionadas
3. ✅ Botón "Pagar Todas" que muestra cantidad seleccionada y total pendiente
4. ✅ Modal de pago acumulado que muestra todas las deudas seleccionadas
5. ✅ Procesamiento secuencial de pagos con manejo de errores
6. ✅ Confirmación con resumen antes de procesar
7. ✅ Feedback de éxito/errores después del procesamiento
3. Calcular total acumulado de las deudas seleccionadas
4. Modificar modal de pago para aceptar múltiples ventas
5. Procesar pagos en lote (uno por uno o endpoint batch)

### Prioridad: Alta

---

## 13. Lista de Espera Visible al Seleccionar Día

### Estado: ✅ Implementado (verificar visibilidad)

### Descripción
Al seleccionar un día en el calendario de reservas, mostrar la lista de espera para ese día.

### Archivos a verificar
- `frontend/src/components/reservas/ReservasCalendar.tsx`
- `frontend/src/components/reservas/ReservasList.tsx`

### Notas
- El estado `LISTA_ESPERA` ya existe
- Verificar que se muestre claramente al seleccionar un día

### Prioridad: Baja (verificación)

---

## 14. Sistema de Devoluciones de Productos/Ventas

### Estado: ✅ Completado

### Descripción
Permitir que trabajadores y usuarios TIENDA puedan realizar devoluciones de productos vendidos. Una devolución debe:
- Registrar qué productos se devuelven y en qué cantidad
- Calcular el importe a devolver
- Actualizar el stock del inventario
- Registrar el método de devolución (efectivo/tarjeta)
- Mantener un historial de devoluciones
- Asociar la devolución a la venta original

### Archivos creados/modificados

#### Backend
- ✅ `backend/src/modules/devoluciones/` - Módulo completo creado
  - ✅ `schemas/devolucion.schema.ts` - Schema de Devolución con todos los campos
  - ✅ `dto/create-devolucion.dto.ts` - DTO para crear devolución
  - ✅ `dto/update-devolucion.dto.ts` - DTO para actualizar devolución
  - ✅ `services/devoluciones.service.ts` - Lógica de negocio completa
  - ✅ `controllers/devoluciones.controller.ts` - Endpoints REST
  - ✅ `devoluciones.module.ts` - Módulo NestJS integrado
- ✅ `backend/src/app.module.ts` - Módulo de devoluciones añadido

#### Frontend
- ✅ `frontend/src/components/devoluciones/` - Directorio creado
  - ✅ `DevolucionesList.tsx` - Lista de devoluciones con filtros y acciones
  - ✅ `DevolucionModal.tsx` - Modal para crear devolución desde venta
- ✅ `frontend/src/components/deudas/DeudasList.tsx` - Botón de devolver añadido
- ✅ `frontend/src/services/devoluciones.ts` - Servicio API completo
- ✅ `frontend/src/App.tsx` - Ruta de devoluciones añadida
- ✅ `frontend/src/components/layout/Navbar.tsx` - Enlace en menú para todos los roles
- ✅ `frontend/src/components/dashboard/Dashboard.tsx` - Módulo de devoluciones añadido

### Implementación completada

#### Backend
1. ✅ Schema `Devolucion` creado con todos los campos necesarios
2. ✅ Endpoints implementados:
   - ✅ `POST /devoluciones` - Crear devolución
   - ✅ `GET /devoluciones` - Listar devoluciones (con filtros)
   - ✅ `GET /devoluciones/:id` - Obtener devolución
   - ✅ `PUT /devoluciones/:id` - Actualizar devolución
   - ✅ `DELETE /devoluciones/:id` - Eliminar devolución
   - ✅ `POST /devoluciones/:id/procesar` - Procesar devolución (actualizar stock)
   - ✅ `POST /devoluciones/:id/cancelar` - Cancelar devolución
3. ✅ Lógica de negocio implementada:
   - ✅ Validación de productos a devolver
   - ✅ Validación de cantidades
   - ✅ Cálculo de total de devolución
   - ✅ Actualización de stock del inventario al procesar
   - ✅ Control de permisos por rol

#### Frontend
1. ✅ Componente de lista de devoluciones con:
   - ✅ Tabla de devoluciones con todos los datos
   - ✅ Filtros (fecha, venta, usuario)
   - ✅ Acciones (ver detalles, procesar, cancelar, eliminar)
2. ✅ Modal de devolución:
   - ✅ Selector de productos de la venta con checkboxes
   - ✅ Campo para cantidad a devolver por producto
   - ✅ Selector de método de devolución
   - ✅ Campo de motivo (obligatorio)
   - ✅ Campo de observaciones
   - ✅ Selector de trabajador para usuarios TIENDA
3. ✅ Integración en DeudasList:
   - ✅ Botón "Devolver" en cada venta
   - ✅ Modal que muestra productos de la venta
   - ✅ Permite seleccionar productos y cantidades

### Permisos
- ✅ Roles permitidos: `TRABAJADOR`, `TIENDA`, `ADMINISTRADOR`, `JUNTA`
- ✅ Validación de permisos implementada (solo se pueden devolver productos de ventas propias o todas si es ADMINISTRADOR)

### Prioridad: Alta

---

## Priorización Sugerida

### ✅ Completadas (7)
1. ✅ **Sistema de Devoluciones de Productos/Ventas** - COMPLETADO
2. ✅ **Guardar Fianza de Reserva en Recaudaciones** - COMPLETADO
3. ✅ **Reserva - Cancelar: Quitar Importe Pendiente y Marcar Devolución** - COMPLETADO
4. ✅ **Informe Recaudaciones - Mostrar Método de Pago** - COMPLETADO
5. ✅ **Total Recaudaciones del Usuario** - COMPLETADO
6. ✅ **Pago Acumulado de Deudas por Socio** - COMPLETADO

### Alta Prioridad (Pendientes)
- Todas las funcionalidades de alta prioridad han sido completadas ✅

### Media Prioridad
7. Ordenar Socios por Código
8. Registrar Invitaciones desde Trabajador
9. Normativa para Reserva (Imprimir y Firma)
10. Listado de Reservas (Reporte Descargable)
11. Informe de Socios - Productos Consumidos
12. Validación de Decimales (Punto y Coma)

### Baja Prioridad
13. Ampliar Imagen del Socio al Pasar el Ratón
14. Lista de Espera Visible (verificación)

---

## Resumen de Progreso

### Funcionalidades Completadas (7)
1. ✅ **Sistema de Devoluciones de Productos/Ventas** - Módulo completo backend y frontend
2. ✅ **Guardar Fianza de Reserva en Recaudaciones** - Campo añadido y mostrado en recaudaciones
3. ✅ **Reserva - Cancelar: Quitar Importe Pendiente y Marcar Devolución** - Cálculo automático implementado
4. ✅ **Informe Recaudaciones - Mostrar Método de Pago** - Columna y PDFs actualizados
5. ✅ **Total Recaudaciones del Usuario** - Tabla de totales por usuario implementada
6. ✅ **Pago Acumulado de Deudas por Socio** - Selección múltiple y pago acumulado implementado

### Funcionalidades en Progreso (0)
- Ninguna actualmente

### Funcionalidades Pendientes (7)
- 0 de alta prioridad (todas completadas ✅)
- 6 de media prioridad
- 1 de baja prioridad

**Progreso**: 7 de 14 funcionalidades completadas (50% completado)

---

## Notas Técnicas

- Todas las funcionalidades deben mantener la compatibilidad con el sistema actual
- Los cambios en backend deben incluir validaciones apropiadas
- Los cambios en frontend deben seguir el patrón de diseño existente
- Considerar permisos de roles al implementar nuevas funcionalidades

---

## Última Actualización

**Fecha**: 2024-12-XX  
**Estado**: 7 funcionalidades completadas de 14 totales (50% completado)

### Funcionalidades de Alta Prioridad
✅ **Todas las funcionalidades de alta prioridad han sido completadas**

### Próximas Funcionalidades (Media Prioridad)
- Ordenar Socios por Código
- Registrar Invitaciones desde Trabajador
- Normativa para Reserva (Imprimir y Firma)
- Listado de Reservas (Reporte Descargable)
- Informe de Socios - Productos Consumidos
- Validación de Decimales (Punto y Coma)

