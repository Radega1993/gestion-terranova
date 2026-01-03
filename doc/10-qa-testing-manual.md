# QA y Testing Manual - Lista de Verificación

Este documento contiene una lista completa de funcionalidades a probar manualmente en el frontend para asegurar que el proyecto está listo para entregar.

**Fecha de creación**: 2024-12-XX  
**Versión del proyecto**: 1.0  
**Estado**: En fase de QA

---

## Índice

1. [Autenticación y Gestión de Usuarios](#1-autenticación-y-gestión-de-usuarios)
2. [Gestión de Socios](#2-gestión-de-socios)
3. [Gestión de Tiendas y Trabajadores](#3-gestión-de-tiendas-y-trabajadores)
4. [Ventas](#4-ventas)
5. [Reservas](#5-reservas)
6. [Devoluciones](#6-devoluciones)
7. [Deudas](#7-deudas)
8. [Recaudaciones](#8-recaudaciones)
9. [Inventario](#9-inventario)
10. [Invitaciones](#10-invitaciones)
11. [Reportes y Exportaciones](#11-reportes-y-exportaciones)
12. [Validaciones y Casos Edge](#12-validaciones-y-casos-edge)
13. [Navegación y UX](#13-navegación-y-ux)
14. [Responsive Design](#14-responsive-design)
15. [Seguridad y Permisos](#15-seguridad-y-permisos)

---

## 1. Autenticación y Gestión de Usuarios

### 1.1 Login
- [X] **Login exitoso con credenciales válidas**
  - [X] Usuario ADMINISTRADOR puede iniciar sesión
  - [X] Usuario JUNTA puede iniciar sesión
  - [X] Usuario TRABAJADOR puede iniciar sesión
  - [X] Usuario TIENDA puede iniciar sesión
  - [X] Redirección correcta después del login según rol
  - [X] Token se guarda correctamente

- [X] **Login con credenciales inválidas**
  - [X] Mensaje de error claro con usuario incorrecto
  - [X] Mensaje de error claro con contraseña incorrecta
  - [X] No se permite acceso sin credenciales válidas

- [X] **Logout**
  - [X] Botón de logout funciona correctamente
  - [X] Token se elimina al hacer logout
  - [X] Redirección a página de login después del logout
  - [X] No se puede acceder a rutas protegidas después del logout

- [X] **Expiración de token**
  - [X] Token de TIENDA expira después de 24 horas
  - [X] Redirección a login cuando el token expira (interceptor de axios detecta 401)
  - [X] Mensaje apropiado cuando la sesión expira ("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.")

### 1.2 Gestión de Usuarios (Solo ADMINISTRADOR)
- [X] **Crear usuario**
  - [X] Formulario de creación funciona correctamente
  - [X] Validación de campos requeridos
  - [X] Validación de formato de email
  - [X] Validación de contraseña (mínimo de caracteres)
  - [X] Selección de rol funciona correctamente
  - [X] Asignación de tienda para usuarios TIENDA
  - [X] Mensaje de éxito después de crear usuario

- [X] **Editar usuario**
  - [X] Carga correcta de datos del usuario
  - [X] Actualización de información funciona
  - [X] Cambio de contraseña funciona
  - [X] Cambio de rol funciona
  - [X] Validaciones funcionan en edición

- [X] **Eliminar usuario**
  - [X] Confirmación antes de eliminar (SweetAlert2 con mensaje de advertencia)
  - [X] Eliminación exitosa (mensaje de éxito después de eliminar)
  - [X] Usuario eliminado no puede iniciar sesión (el usuario se elimina de la base de datos)
  - [X] Validación: No se puede eliminar el último administrador activo

- [X] **Listar usuarios**
  - [X] Lista se carga correctamente
  - [X] Filtros funcionan (por rol, por tienda)
  - [X] Búsqueda funciona
  - [X] Paginación funciona si hay muchos usuarios

---

## 2. Gestión de Socios

### 2.1 Listado de Socios
- [X] **Visualización**
  - [X] Lista de socios se carga correctamente
  - [X] Información se muestra correctamente (nombre, código, foto)
  - [X] Estado activo/inactivo se muestra correctamente
  - [X] Socios inactivos se muestran con estilo diferente

- [X] **Búsqueda**
  - [X] Búsqueda por nombre funciona
  - [X] Búsqueda por código funciona
  - [X] Búsqueda por apellido funciona
  - [X] Búsqueda en tiempo real funciona (con debounce de 300ms)
  - [X] Resultados se actualizan al buscar
  - [X] El input mantiene el foco durante la búsqueda (no se pierde al escribir)
  - [X] Solo se actualiza la lista de socios, no toda la página

- [X] **Ordenamiento**
  - [X] Ordenar por código ascendente funciona (extrae números del código: AET002, AET003, AET004)
  - [X] Ordenar por código descendente funciona (AET004, AET003, AET002)
  - [X] Sin ordenar muestra orden por defecto
  - [X] Indicador visual del ordenamiento activo (chip con flecha ↑ o ↓ en la columna Código)

- [X] **Filtros**
  - [X] Filtrar por estado activo/inactivo funciona (dropdown con opciones: Todos, Solo Activos, Solo Inactivos)
  - [X] Combinación de filtros funciona (búsqueda por texto + filtro por estado + ordenamiento por código)

### 2.2 Crear Socio
- [X] **Formulario de creación**
  - [X] Todos los campos se muestran correctamente
  - [X] Campos requeridos están marcados
  - [X] Validación de campos funciona
  - [X] Validación de formato de email
  - [X] Validación de formato de teléfono
  - [X] Validación de fecha de nacimiento
  - [X] Subida de foto funciona
  - [X] Vista previa de foto funciona
  - [X] Creación exitosa muestra mensaje
  - [X] Redirección después de crear

- [X] **Campos específicos**
  - [X] Código de socio se genera automáticamente o se valida
  - [X] Nombre y apellidos se guardan correctamente
  - [X] Dirección completa se guarda
  - [X] Información de contacto se guarda
  - [X] Información bancaria se guarda
  - [X] Asociados se pueden añadir

### 2.3 Editar Socio
- [X] **Carga de datos**
  - [X] Datos del socio se cargan correctamente
  - [X] Foto se muestra correctamente
  - [X] Todos los campos se rellenan

- [X] **Actualización**
  - [X] Cambios se guardan correctamente
  - [X] Foto se actualiza correctamente
  - [X] Validaciones funcionan en edición
  - [X] Mensaje de éxito después de actualizar

### 2.4 Eliminar Socio
- [X] **Eliminación**
  - [X] Confirmación antes de eliminar
  - [X] Eliminación exitosa
  - [X] Socio eliminado desaparece de la lista
  - [X] No se puede eliminar si tiene ventas/reservas asociadas (si aplica)

### 2.5 Detalles del Socio
- [X] **Visualización de información**
  - [X] Información personal se muestra correctamente
  - [X] Información de contacto se muestra correctamente
  - [X] Dirección se muestra correctamente
  - [X] Foto se muestra correctamente

- [ ] **Productos Consumidos**
  - [ ] Sección de productos consumidos se muestra
  - [ ] Lista de productos se carga correctamente
  - [ ] Totales se calculan correctamente
  - [ ] Tabla muestra información correcta
  - [ ] Paginación funciona
  - [ ] Resumen estadístico se muestra correctamente
  - [ ] Si no hay productos, mensaje apropiado se muestra

### 2.6 Gestión de Asociados
- [ ] **Añadir asociado**
  - [ ] Formulario de asociado funciona
  - [ ] Validaciones funcionan
  - [ ] Asociado se añade correctamente
  - [ ] Foto de asociado se puede subir

- [ ] **Editar asociado**
  - [ ] Datos se cargan correctamente
  - [ ] Actualización funciona
  - [ ] Foto se actualiza

- [ ] **Eliminar asociado**
  - [ ] Confirmación antes de eliminar
  - [ ] Eliminación exitosa

- [ ] **Ver familia**
  - [ ] Modal muestra todos los asociados
  - [ ] Información se muestra correctamente

### 2.7 Importar/Exportar Socios
- [ ] **Importar desde Excel**
  - [ ] Botón de importar funciona
  - [ ] Selección de archivo funciona
  - [ ] Validación de formato de archivo
  - [ ] Proceso de importación muestra progreso
  - [ ] Resultados de importación se muestran (éxitos/errores)
  - [ ] Socios duplicados se manejan correctamente

- [ ] **Exportar a Excel**
  - [ ] Botón de exportar funciona
  - [ ] Archivo se descarga correctamente
  - [ ] Archivo contiene todos los datos
  - [ ] Formato del archivo es correcto

### 2.8 Activar/Desactivar Socio
- [ ] **Cambio de estado**
  - [ ] Confirmación antes de cambiar estado
  - [ ] Cambio de estado funciona
  - [ ] Visualización del estado se actualiza
  - [ ] Socios inactivos se muestran diferente

---

## 3. Gestión de Tiendas y Trabajadores

### 3.1 Gestión de Tiendas (Solo ADMINISTRADOR)
- [ ] **Listado de tiendas**
  - [ ] Lista se carga correctamente
  - [ ] Información se muestra correctamente
  - [ ] Estado activo/inactivo se muestra

- [ ] **Crear tienda**
  - [ ] Formulario funciona correctamente
  - [ ] Validación de campos requeridos
  - [ ] Crear usuario automáticamente funciona
  - [ ] Asignar usuario existente funciona
  - [ ] Validación: no se puede crear sin usuario
  - [ ] Mensaje de error si no hay usuarios TIENDA disponibles
  - [ ] Creación exitosa muestra mensaje

- [ ] **Editar tienda**
  - [ ] Datos se cargan correctamente
  - [ ] Actualización funciona
  - [ ] Cambio de usuario asignado funciona
  - [ ] Actualización de estado funciona

- [ ] **Ver detalles de tienda**
  - [ ] Información de la tienda se muestra
  - [ ] Usuario asignado se muestra
  - [ ] Información del usuario se muestra correctamente
  - [ ] Lista de trabajadores se muestra

- [ ] **Cambiar contraseña del usuario TIENDA**
  - [ ] Botón de cambiar contraseña funciona
  - [ ] Modal se abre correctamente
  - [ ] Validación de contraseña funciona
  - [ ] Confirmación de contraseña funciona
  - [ ] Cambio exitoso muestra mensaje
  - [ ] Usuario puede iniciar sesión con nueva contraseña

- [ ] **Activar/Desactivar tienda**
  - [ ] Cambio de estado funciona
  - [ ] Visualización se actualiza

### 3.2 Gestión de Trabajadores (Desde Tienda)
- [ ] **Listado de trabajadores**
  - [ ] Lista se carga correctamente
  - [ ] Solo muestra trabajadores de la tienda actual
  - [ ] Información se muestra correctamente

- [ ] **Crear trabajador**
  - [ ] Formulario funciona
  - [ ] Validación de campos
  - [ ] Trabajador se crea correctamente
  - [ ] Trabajador aparece en la lista

- [ ] **Editar trabajador**
  - [ ] Datos se cargan
  - [ ] Actualización funciona

- [ ] **Activar/Desactivar trabajador**
  - [ ] Cambio de estado funciona
  - [ ] Trabajadores inactivos no aparecen en selectores

---

## 4. Ventas

### 4.1 Crear Venta
- [ ] **Formulario de venta**
  - [ ] Selección de socio funciona
  - [ ] Búsqueda de socio funciona
  - [ ] Selección de productos funciona
  - [ ] Añadir productos al carrito funciona
  - [ ] Eliminar productos del carrito funciona
  - [ ] Modificar cantidad funciona
  - [ ] Cálculo de totales funciona correctamente
  - [ ] Validación de stock funciona

- [ ] **Selección de trabajador (Usuario TIENDA)**
  - [ ] Selector de trabajador aparece para usuarios TIENDA
  - [ ] Lista de trabajadores se carga correctamente
  - [ ] Selección de trabajador es obligatoria
  - [ ] Validación funciona si no se selecciona trabajador

- [ ] **Método de pago**
  - [ ] Selección de método de pago funciona
  - [ ] Efectivo y Tarjeta funcionan
  - [ ] Cálculo de cambio funciona (si aplica)

- [ ] **Pago parcial**
  - [ ] Pago parcial funciona
  - [ ] Estado se actualiza correctamente
  - [ ] Deuda se registra correctamente

- [ ] **Creación exitosa**
  - [ ] Venta se crea correctamente
  - [ ] Mensaje de éxito se muestra
  - [ ] Stock se actualiza correctamente
  - [ ] Redirección funciona

### 4.2 Listado de Ventas
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Información se muestra correctamente
  - [ ] Filtros funcionan (fecha, socio, estado)
  - [ ] Búsqueda funciona

- [ ] **Filtros**
  - [ ] Filtro por fecha funciona
  - [ ] Filtro por socio funciona
  - [ ] Filtro por estado funciona
  - [ ] Combinación de filtros funciona
  - [ ] Limpiar filtros funciona

### 4.3 Ver Detalles de Venta
- [ ] **Información**
  - [ ] Detalles se muestran correctamente
  - [ ] Productos se listan correctamente
  - [ ] Totales se muestran correctamente
  - [ ] Información de pago se muestra
  - [ ] Información de trabajador se muestra (si aplica)

---

## 5. Reservas

### 5.1 Crear Reserva
- [ ] **Formulario de reserva**
  - [ ] Selección de fecha funciona
  - [ ] Calendario muestra fechas disponibles
  - [ ] Fechas pasadas no se pueden seleccionar
  - [ ] Selección de servicio funciona
  - [ ] Selección de socio funciona
  - [ ] Selección de suplementos funciona
  - [ ] Cálculo de precio funciona correctamente

- [ ] **Selección de trabajador (Usuario TIENDA)**
  - [ ] Selector aparece para usuarios TIENDA
  - [ ] Selección es obligatoria
  - [ ] Validación funciona

- [ ] **Normativa y Firma**
  - [ ] Checkbox de normativa funciona
  - [ ] Campo de firma aparece cuando se acepta normativa
  - [ ] Firma se guarda correctamente
  - [ ] Fecha de aceptación se registra

- [ ] **Pago inicial**
  - [ ] Monto abonado funciona
  - [ ] Método de pago funciona
  - [ ] Validación de monto funciona

- [ ] **Lista de espera**
  - [ ] Si hay conflicto, se añade a lista de espera
  - [ ] Mensaje apropiado se muestra

- [ ] **Creación exitosa**
  - [ ] Reserva se crea correctamente
  - [ ] Mensaje de éxito se muestra
  - [ ] PDF se puede generar

### 5.2 Listado de Reservas
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Calendario muestra reservas
  - [ ] Colores por servicio funcionan
  - [ ] Información se muestra correctamente

- [ ] **Filtros**
  - [ ] Filtro por fecha funciona
  - [ ] Filtro por servicio funciona
  - [ ] Filtro por estado funciona

- [ ] **Estados**
  - [ ] PENDIENTE se muestra correctamente
  - [ ] CONFIRMADA se muestra correctamente
  - [ ] CANCELADA se muestra correctamente
  - [ ] COMPLETADA se muestra correctamente
  - [ ] LISTA_ESPERA se muestra correctamente

### 5.3 Confirmar Reserva
- [ ] **Confirmación**
  - [ ] Botón de confirmar funciona
  - [ ] Confirmación exitosa
  - [ ] Estado se actualiza
  - [ ] Email/notificación se envía (si aplica)

### 5.4 Liquidar Reserva
- [ ] **Liquidación**
  - [ ] Modal de liquidación se abre
  - [ ] Suplementos adicionales se pueden añadir
  - [ ] Monto total se calcula correctamente
  - [ ] Fianza se puede especificar
  - [ ] Método de pago funciona
  - [ ] Liquidación exitosa
  - [ ] Estado se actualiza a LIQUIDADA
  - [ ] PDF de liquidación se genera

### 5.5 Cancelar Reserva
- [ ] **Cancelación**
  - [ ] Modal de cancelación se abre
  - [ ] Motivo de cancelación se puede seleccionar
  - [ ] Observaciones se pueden añadir
  - [ ] Cálculo automático de monto devuelto funciona
  - [ ] Para cancelaciones con menos de 9 días, pendiente revisión junta funciona
  - [ ] Cancelación exitosa
  - [ ] Estado se actualiza
  - [ ] Monto abonado se establece a 0
  - [ ] Monto devuelto se calcula correctamente

### 5.6 Exportar Listado de Reservas
- [ ] **Exportación**
  - [ ] Botón de exportar funciona
  - [ ] Archivo Excel se descarga
  - [ ] Archivo contiene todos los datos
  - [ ] Formato es correcto
  - [ ] Normativa aceptada se incluye
  - [ ] Firma se incluye (si aplica)

### 5.7 PDF de Reserva
- [ ] **Generación de PDF**
  - [ ] PDF se genera correctamente
  - [ ] Información se muestra correctamente
  - [ ] Normativa aceptada se muestra
  - [ ] Firma se muestra (si aplica)
  - [ ] Formato es correcto

---

## 6. Devoluciones

### 6.1 Crear Devolución
- [ ] **Desde lista de deudas**
  - [ ] Botón de devolver funciona
  - [ ] Modal se abre correctamente
  - [ ] Venta seleccionada se muestra

- [ ] **Formulario de devolución**
  - [ ] Selección de productos funciona
  - [ ] Cantidad a devolver funciona
  - [ ] Validación de cantidad máxima funciona
  - [ ] Método de devolución funciona
  - [ ] Motivo se puede especificar
  - [ ] Observaciones se pueden añadir
  - [ ] Cálculo de total funciona

- [ ] **Selección de trabajador (Usuario TIENDA)**
  - [ ] Selector aparece para usuarios TIENDA
  - [ ] Selección funciona

- [ ] **Creación exitosa**
  - [ ] Devolución se crea correctamente
  - [ ] Stock se actualiza correctamente
  - [ ] Mensaje de éxito se muestra
  - [ ] Estado de venta se actualiza

### 6.2 Listado de Devoluciones
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Información se muestra correctamente
  - [ ] Filtros funcionan
  - [ ] Estados se muestran correctamente

- [ ] **Estados**
  - [ ] PENDIENTE se muestra
  - [ ] PROCESADA se muestra
  - [ ] CANCELADA se muestra

### 6.3 Procesar Devolución
- [ ] **Procesamiento**
  - [ ] Botón de procesar funciona
  - [ ] Confirmación funciona
  - [ ] Estado se actualiza
  - [ ] Stock se actualiza correctamente

### 6.4 Cancelar Devolución
- [ ] **Cancelación**
  - [ ] Botón de cancelar funciona
  - [ ] Confirmación funciona
  - [ ] Estado se actualiza

---

## 7. Deudas

### 7.1 Listado de Deudas
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Solo deudas pendientes se muestran
  - [ ] Información se muestra correctamente
  - [ ] Filtros funcionan

- [ ] **Filtros**
  - [ ] Filtro por fecha funciona
  - [ ] Filtro por cliente funciona
  - [ ] Filtro por estado funciona

### 7.2 Pago Individual de Deuda
- [ ] **Pago**
  - [ ] Botón de pagar funciona
  - [ ] Modal se abre
  - [ ] Información de deuda se muestra
  - [ ] Monto pendiente se muestra correctamente
  - [ ] Monto a pagar funciona
  - [ ] Método de pago funciona
  - [ ] Cálculo de cambio funciona
  - [ ] Validación de monto funciona
  - [ ] Pago exitoso
  - [ ] Estado se actualiza
  - [ ] Lista se actualiza

### 7.3 Pago Acumulado de Deudas
- [ ] **Selección múltiple**
  - [ ] Checkboxes funcionan
  - [ ] Seleccionar todo funciona
  - [ ] Deseleccionar funciona
  - [ ] Banner de resumen aparece cuando hay selección

- [ ] **Pago acumulado**
  - [ ] Botón "Pagar Todas" funciona
  - [ ] Modal se abre con todas las deudas
  - [ ] Tabla muestra todas las deudas seleccionadas
  - [ ] Total pendiente se calcula correctamente
  - [ ] Monto total a pagar funciona
  - [ ] Método de pago funciona
  - [ ] Confirmación funciona
  - [ ] Procesamiento secuencial funciona
  - [ ] Manejo de errores funciona
  - [ ] Mensaje de éxito/errores se muestra
  - [ ] Todas las deudas se actualizan

### 7.4 Exportar PDF de Deudas
- [ ] **Exportación**
  - [ ] Botón de imprimir funciona
  - [ ] PDF se genera correctamente
  - [ ] Información es correcta
  - [ ] Formato es correcto

---

## 8. Recaudaciones

### 8.1 Listado de Recaudaciones
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Ventas y reservas se muestran
  - [ ] Información se muestra correctamente
  - [ ] Filtros funcionan

- [ ] **Filtros**
  - [ ] Filtro por fecha funciona
  - [ ] Filtro por socio funciona
  - [ ] Filtro por usuario funciona
  - [ ] Filtro por trabajador funciona
  - [ ] Combinación de filtros funciona

### 8.2 Totales por Usuario
- [ ] **Tabla de totales**
  - [ ] Tabla se muestra correctamente
  - [ ] Usuarios se listan correctamente
  - [ ] Total recaudado por usuario es correcto
  - [ ] Cantidad de transacciones es correcta
  - [ ] Porcentaje del total es correcto
  - [ ] Ordenamiento funciona

### 8.3 Método de Pago
- [ ] **Visualización**
  - [ ] Columna de método de pago se muestra
  - [ ] Chips de color funcionan (Efectivo/Tarjeta)
  - [ ] Método se muestra correctamente

### 8.4 Fianzas de Reserva
- [ ] **Visualización**
  - [ ] Columna de fianza se muestra
  - [ ] Fianzas se muestran solo para reservas
  - [ ] Total de fianzas se calcula correctamente
  - [ ] Fianzas se muestran en resumen

### 8.5 Exportar Reportes
- [ ] **Resumen General PDF**
  - [ ] Botón funciona
  - [ ] PDF se genera correctamente
  - [ ] Totales por método de pago se muestran
  - [ ] Totales por usuario se muestran
  - [ ] Fianzas se incluyen
  - [ ] Formato es correcto

- [ ] **Resumen Detallado PDF**
  - [ ] Botón funciona
  - [ ] PDF se genera correctamente
  - [ ] Todas las transacciones se incluyen
  - [ ] Método de pago se muestra
  - [ ] Formato es correcto

---

## 9. Inventario

### 9.1 Listado de Productos
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Información se muestra correctamente
  - [ ] Stock se muestra correctamente
  - [ ] Filtros funcionan
  - [ ] Búsqueda funciona

### 9.2 Crear Producto
- [ ] **Formulario**
  - [ ] Todos los campos funcionan
  - [ ] Validaciones funcionan
  - [ ] Creación exitosa

### 9.3 Editar Producto
- [ ] **Edición**
  - [ ] Datos se cargan
  - [ ] Actualización funciona
  - [ ] Stock se puede actualizar

### 9.4 Gestión de Stock
- [ ] **Actualización**
  - [ ] Stock se actualiza al hacer ventas
  - [ ] Stock se actualiza al hacer devoluciones
  - [ ] Alertas de stock bajo funcionan (si aplica)

---

## 10. Invitaciones

### 10.1 Registrar Invitaciones (TRABAJADOR/TIENDA)
- [ ] **Registro**
  - [ ] Formulario funciona
  - [ ] Selección de socio funciona
  - [ ] Cantidad de invitaciones funciona
  - [ ] Registro exitoso
  - [ ] Permisos funcionan (TRABAJADOR puede registrar)

### 10.2 Listado de Invitaciones
- [ ] **Visualización**
  - [ ] Lista se carga correctamente
  - [ ] Información se muestra
  - [ ] Filtros funcionan

### 10.3 Invitaciones Disponibles
- [ ] **Consulta**
  - [ ] Invitaciones disponibles se muestran correctamente
  - [ ] Por socio funciona
  - [ ] Por ejercicio funciona

---

## 11. Reportes y Exportaciones

### 11.1 Exportación de Socios
- [ ] **Excel**
  - [ ] Archivo se descarga correctamente
  - [ ] Datos son correctos
  - [ ] Formato es correcto
  - [ ] Asociados se incluyen

### 11.2 Exportación de Reservas
- [ ] **Excel**
  - [ ] Archivo se descarga correctamente
  - [ ] Todas las reservas se incluyen
  - [ ] Datos son correctos
  - [ ] Formato es correcto
  - [ ] Normativa y firma se incluyen

### 11.3 Reportes PDF
- [ ] **Generación**
  - [ ] Todos los PDFs se generan correctamente
  - [ ] Información es correcta
  - [ ] Formato es correcto
  - [ ] Se pueden descargar

---

## 12. Validaciones y Casos Edge

### 12.1 Validación de Decimales
- [ ] **Punto y Coma**
  - [ ] Se puede escribir con punto (10.50)
  - [ ] Se puede escribir con coma (10,50)
  - [ ] Ambos se procesan correctamente
  - [ ] Conversión funciona correctamente
  - [ ] Validación funciona con ambos formatos

### 12.2 Validaciones de Formularios
- [ ] **Campos requeridos**
  - [ ] Mensajes de error se muestran
  - [ ] No se puede enviar sin campos requeridos
  - [ ] Validación en tiempo real funciona

- [ ] **Formatos**
  - [ ] Email se valida correctamente
  - [ ] Teléfono se valida correctamente
  - [ ] Fechas se validan correctamente
  - [ ] Números se validan correctamente

### 12.3 Casos Edge
- [ ] **Valores límite**
  - [ ] Montos muy grandes funcionan
  - [ ] Montos muy pequeños funcionan
  - [ ] Cantidades grandes funcionan
  - [ ] Fechas límite funcionan

- [ ] **Datos vacíos**
  - [ ] Listas vacías muestran mensaje apropiado
  - [ ] Búsquedas sin resultados muestran mensaje
  - [ ] Formularios vacíos se manejan correctamente

- [ ] **Errores de red**
  - [ ] Mensajes de error se muestran
  - [ ] Reintentos funcionan (si aplica)
  - [ ] No se pierden datos

---

## 13. Navegación y UX

### 13.1 Navegación
- [ ] **Menú**
  - [ ] Todos los enlaces funcionan
  - [ ] Enlaces se muestran según rol
  - [ ] Menú móvil funciona
  - [ ] Menú desktop funciona

- [ ] **Rutas protegidas**
  - [ ] Redirección a login si no autenticado
  - [ ] Acceso según rol funciona
  - [ ] Rutas incorrectas muestran 404

### 13.2 Dashboard
- [ ] **Visualización**
  - [ ] Módulos se muestran según rol
  - [ ] Enlaces funcionan
  - [ ] Información se carga correctamente

### 13.3 Feedback al Usuario
- [ ] **Mensajes**
  - [ ] Mensajes de éxito se muestran
  - [ ] Mensajes de error se muestran
  - [ ] Mensajes de confirmación funcionan
  - [ ] Loading states se muestran

### 13.4 Accesibilidad
- [ ] **Básica**
  - [ ] Contraste de colores es adecuado
  - [ ] Tamaños de fuente son legibles
  - [ ] Botones son clickeables
  - [ ] Formularios son accesibles

---

## 14. Responsive Design

### 14.1 Desktop
- [ ] **Visualización**
  - [ ] Layout funciona correctamente
  - [ ] Tablas se muestran correctamente
  - [ ] Formularios funcionan
  - [ ] Navegación funciona

### 14.2 Tablet
- [ ] **Visualización**
  - [ ] Layout se adapta
  - [ ] Tablas se adaptan
  - [ ] Formularios funcionan
  - [ ] Navegación funciona

### 14.3 Mobile
- [ ] **Visualización**
  - [ ] Layout se adapta correctamente
  - [ ] Menú móvil funciona
  - [ ] Tablas se adaptan o scrollan
  - [ ] Formularios funcionan
  - [ ] Botones son accesibles

---

## 15. Seguridad y Permisos

### 15.1 Roles y Permisos
- [ ] **ADMINISTRADOR**
  - [ ] Acceso a todas las funcionalidades
  - [ ] Gestión de usuarios funciona
  - [ ] Gestión de tiendas funciona
  - [ ] Todas las operaciones funcionan

- [ ] **JUNTA**
  - [ ] Acceso a funcionalidades permitidas
  - [ ] No puede gestionar usuarios
  - [ ] No puede gestionar tiendas
  - [ ] Operaciones permitidas funcionan

- [ ] **TRABAJADOR**
  - [ ] Acceso limitado funciona
  - [ ] Puede registrar invitaciones
  - [ ] Puede crear ventas/reservas
  - [ ] No puede gestionar usuarios/tiendas

- [ ] **TIENDA**
  - [ ] Acceso limitado funciona
  - [ ] Debe seleccionar trabajador
  - [ ] Token expira en 24 horas
  - [ ] Gestión de trabajadores funciona
  - [ ] No puede gestionar usuarios/tiendas

### 15.2 Protección de Rutas
- [ ] **Rutas protegidas**
  - [ ] No se puede acceder sin autenticación
  - [ ] No se puede acceder sin permisos
  - [ ] Redirección funciona correctamente

### 15.3 Tokens y Sesiones
- [ ] **Gestión**
  - [ ] Token se guarda correctamente
  - [ ] Token se envía en requests
  - [ ] Token expira correctamente
  - [ ] Renovación funciona (si aplica)

---

## Notas Adicionales

### Bugs Conocidos
- [ ] Documentar cualquier bug encontrado durante las pruebas

### Mejoras Sugeridas
- [ ] Documentar mejoras sugeridas durante las pruebas

### Observaciones
- [ ] Documentar observaciones generales

---

## Checklist Final

Antes de considerar el proyecto listo para entregar:

- [ ] Todas las funcionalidades críticas funcionan
- [ ] No hay bugs críticos sin resolver
- [ ] Validaciones funcionan correctamente
- [ ] Permisos y seguridad funcionan
- [ ] Responsive design funciona
- [ ] Exportaciones funcionan
- [ ] PDFs se generan correctamente
- [ ] Manejo de errores es adecuado
- [ ] Mensajes al usuario son claros
- [ ] Performance es aceptable
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del backend

---

**Última actualización**: 2024-12-XX  
**Estado**: En proceso de QA



