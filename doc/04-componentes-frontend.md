# Componentes del Frontend - Gestión Terranova

Documentación detallada de los componentes React del frontend.

---

## 📁 Estructura de Componentes

Los componentes están organizados por módulo funcional en `frontend/src/components/`:

```
components/
├── auth/              # Autenticación
├── socios/            # Gestión de socios
├── inventory/         # Inventario
├── ventas/            # TPV y ventas
├── reservas/          # Reservas
├── invitaciones/      # Invitaciones
├── deudas/            # Deudas
├── recaudaciones/     # Recaudaciones
├── users/             # Usuarios
├── dashboard/         # Dashboard
├── layout/            # Layout y navegación
└── common/            # Componentes comunes
```

---

## 🔐 Auth - Autenticación

**Ruta**: `frontend/src/components/auth/`

### Componentes

#### LoginForm.tsx
Formulario de inicio de sesión.

**Props**: Ninguna

**Funcionalidad**:
- Validación de credenciales
- Manejo de errores
- Redirección después del login
- Persistencia de token en localStorage

**Estado**:
- Usa `useAuthStore` de Zustand
- Maneja estado de carga y errores

#### RegisterForm.tsx
Formulario de registro de nuevos usuarios.

**Props**: Ninguna

**Funcionalidad**:
- Registro de usuarios
- Validación de formulario
- Redirección después del registro

#### ProtectedRoute.tsx
Componente de protección de rutas.

**Props**:
```typescript
{
  children: React.ReactNode
  allowedRoles?: UserRole[]
}
```

**Funcionalidad**:
- Verifica autenticación
- Verifica roles permitidos
- Redirección a login si no está autenticado

#### LogoutButton.tsx
Botón de cierre de sesión.

**Funcionalidad**:
- Limpia token y estado de autenticación
- Redirección a login

---

## 👥 Socios - Gestión de Socios

**Ruta**: `frontend/src/components/socios/`

### Componentes Principales

#### SociosList.tsx
Lista principal de socios con tabla de datos.

**Funcionalidad**:
- Visualización en tabla (MUI DataGrid)
- Búsqueda y filtros
- Acciones: crear, editar, eliminar, ver detalles
- Exportación de datos
- Paginación

**Características**:
- Usa `@mui/x-data-grid` para tabla avanzada
- Integración con TanStack Query para datos
- Filtros por estado, nombre, código de socio

#### CreateSocioForm.tsx
Formulario completo para crear/editar socios.

**Props**:
```typescript
{
  editMode?: boolean
  socioId?: string
}
```

**Funcionalidad**:
- Formulario multi-paso
- Validación completa
- Gestión de asociados (miembros familiares)
- Subida de fotos
- Datos bancarios
- Información de contacto múltiple

**Secciones**:
1. Datos básicos
2. Dirección
3. Contacto
4. Datos bancarios
5. Asociados (familiares)
6. Observaciones

#### GestionarMiembrosModal.tsx
Modal para gestionar miembros familiares de un socio.

**Props**:
```typescript
{
  socioId: string
  open: boolean
  onClose: () => void
}
```

#### AsociadosForm.tsx
Formulario para gestionar asociados.

#### MiembroForm.tsx
Formulario individual para un miembro familiar.

#### VerFamiliaModal.tsx
Modal para visualizar la familia completa de un socio.

#### SociosDetails.tsx
Vista detallada de un socio.

#### SociosEdit.tsx
Componente wrapper para edición de socio.

#### SociosCreate.tsx
Componente wrapper para creación de socio.

#### SociosDelete.tsx
Componente de confirmación para eliminar socio.

#### SociosForm.tsx
Formulario básico de socio (versión simplificada).

#### SociosView.tsx
Vista de lectura de socio.

### Componentes Auxiliares

#### components/SocioSelector.tsx
Selector de socio para usar en otros formularios.

---

## 📦 Inventory - Inventario

**Ruta**: `frontend/src/components/inventory/`

### Componentes

#### InventoryView.tsx
Vista principal del inventario.

**Funcionalidad**:
- Lista de productos
- Filtros y búsqueda
- Acciones CRUD

#### ProductList.tsx
Lista de productos con tabla.

**Características**:
- Visualización en tabla
- Filtros por tipo, estado
- Acciones: editar, eliminar, ajustar stock

#### ProductForm.tsx
Formulario para crear/editar productos.

**Funcionalidad**:
- Validación de datos
- Gestión de stock
- Precios

#### types.ts
Tipos TypeScript para el módulo de inventario.

---

## 💰 Ventas - TPV y Ventas

**Ruta**: `frontend/src/components/ventas/`

### Componentes

#### VentasList.tsx
Lista de ventas realizadas.

**Funcionalidad**:
- Visualización de ventas
- Filtros por fecha, socio, estado
- Acciones: ver detalles, registrar pago

#### VentasPendientes.tsx
Lista de ventas pendientes de pago.

#### Componentes Auxiliares

##### components/PagoModal.tsx
Modal para registrar pagos de ventas.

**Funcionalidad**:
- Múltiples métodos de pago
- Pagos parciales
- Historial de pagos

##### components/ProductoSelector.tsx
Selector de productos para ventas.

##### components/SocioSelector.tsx
Selector de socio para ventas.

##### components/UsuarioSelector.tsx
Selector de usuario (trabajador).

##### components/ProductosList.tsx
Lista de productos en una venta.

#### types.ts
Tipos TypeScript para el módulo de ventas.

---

## 📅 Reservas - Reservas

**Ruta**: `frontend/src/components/reservas/`

### Componentes Principales

#### ReservasList.tsx
Lista principal de reservas.

**Funcionalidad**:
- Vista de lista y calendario
- Filtros por fecha, estado, instalación
- Acciones: crear, editar, cancelar, liquidar

#### ReservasCalendar.tsx
Vista de calendario de reservas.

**Características**:
- Visualización mensual
- Colores por estado
- Clic para ver detalles

#### ReservaForm.tsx
Formulario para crear/editar reservas.

**Funcionalidad**:
- Selección de fecha e instalación
- Selección de suplementos
- Cálculo de precio
- Método de pago

### Componentes de Formulario

#### form/ReservaFormDialog.tsx
Dialog principal del formulario de reserva.

#### form/ReservaFormBasicInfo.tsx
Información básica de la reserva.

#### form/ReservaFormSuplementos.tsx
Selección de suplementos.

#### form/ReservaFormPayment.tsx
Información de pago.

#### form/ReservaFormSummary.tsx
Resumen antes de confirmar.

### Componentes de Liquidación

#### LiquidacionDialog.tsx
Dialog para liquidar una reserva.

#### liquidacion/LiquidacionInfo.tsx
Información de la liquidación.

#### liquidacion/LiquidacionSuplementos.tsx
Suplementos en la liquidación.

#### liquidacion/LiquidacionPayment.tsx
Pago de la liquidación.

### Componentes de Cancelación

#### CancelacionDialog.tsx
Dialog para cancelar reserva.

#### cancelacion/CancelacionForm.tsx
Formulario de cancelación.

#### cancelacion/CancelacionSummary.tsx
Resumen de cancelación.

### Componentes de Gestión

#### GestionServicios.tsx
Gestión de servicios disponibles.

#### GestionSuplementos.tsx
Gestión de suplementos disponibles.

### Componentes de Visualización

#### ReservaCard.tsx
Tarjeta de reserva para vista de lista.

#### ReservaListItem.tsx
Item de lista de reserva.

#### ReservasLegend.tsx
Leyenda de estados para el calendario.

### Componentes PDF

#### ReservaPDF.tsx
Generación de PDF de reserva.

#### LiquidacionPDF.tsx
Generación de PDF de liquidación.

### Hooks Personalizados

#### hooks/useReservas.ts
Hook para gestión de reservas.

#### hooks/useServicios.ts
Hook para servicios.

#### hooks/useSuplementos.ts
Hook para suplementos.

#### hooks/useSocios.ts
Hook para obtener socios.

#### hooks/useLiquidacion.ts
Hook para liquidación.

#### types.ts
Tipos TypeScript para reservas.

---

## 🎫 Invitaciones - Invitaciones

**Ruta**: `frontend/src/components/invitaciones/`

### Componentes

#### InvitacionesList.tsx
Lista de invitaciones.

**Funcionalidad**:
- Visualización de invitaciones
- Filtros por socio, fecha
- Registro de nuevas invitaciones

#### InvitacionesPDF.tsx
Generación de PDF de invitaciones.

#### SocioInvitacionesSelector.tsx
Selector de socio para invitaciones.

---

## 💳 Deudas - Deudas

**Ruta**: `frontend/src/components/deudas/`

### Componentes

#### DeudasList.tsx
Lista de deudas.

**Funcionalidad**:
- Visualización de deudas por socio
- Filtros y búsqueda
- Registro de pagos

#### PagoDeudaModal.tsx
Modal para registrar pago de deuda.

#### DeudasPDF.tsx
Generación de PDF de deudas.

---

## 💵 Recaudaciones - Recaudaciones

**Ruta**: `frontend/src/components/recaudaciones/`

### Componentes

#### RecaudacionesList.tsx
Lista de recaudaciones.

**Funcionalidad**:
- Resúmenes de recaudaciones
- Filtros por fechas
- Exportación

#### ResumenGeneralPDF.tsx
PDF de resumen general.

#### ResumenDetalladoPDF.tsx
PDF de resumen detallado.

---

## 👤 Users - Usuarios

**Ruta**: `frontend/src/components/users/`

### Componentes

#### UsersList.tsx
Lista de usuarios del sistema.

**Funcionalidad**:
- CRUD de usuarios
- Gestión de roles
- Activación/desactivación

---

## 📊 Dashboard - Dashboard

**Ruta**: `frontend/src/components/dashboard/`

### Componentes

#### Dashboard.tsx
Panel principal de la aplicación.

**Funcionalidad**:
- Tarjetas de acceso rápido a módulos
- Filtrado por rol de usuario
- Navegación a diferentes secciones

**Módulos mostrados**:
- Deudas
- Reservas
- Ventas
- Socios
- Inventario
- Usuarios
- Recaudaciones
- Invitaciones

---

## 🎨 Layout - Layout

**Ruta**: `frontend/src/components/layout/`

### Componentes

#### Navbar.tsx
Barra de navegación principal.

**Funcionalidad**:
- Menú de navegación
- Información de usuario
- Botón de logout
- Responsive design

**Características**:
- Menú adaptativo según rol
- Indicadores de navegación activa
- Diseño Material-UI

#### Layout.tsx
Layout wrapper para páginas (si existe).

---

## 🔧 Common - Componentes Comunes

**Ruta**: `frontend/src/components/common/`

### Componentes

#### CurrencyInput.tsx
Input para valores monetarios.

**Funcionalidad**:
- Formato de moneda
- Validación numérica
- Localización

#### Grid.tsx
Componente de grid reutilizable.

---

## 🎣 Hooks Personalizados

**Ruta**: `frontend/src/hooks/`

### useAuth.ts
Hook para autenticación.

**Funcionalidad**:
- Acceso al estado de autenticación
- Métodos de login/logout
- Verificación de roles

---

## 🗄️ Stores (Zustand)

**Ruta**: `frontend/src/stores/`

### authStore.ts
Store de autenticación con Zustand.

**Estado**:
```typescript
{
  token: string | null
  user: User | null
  userRole: UserRole | null
  isAuthenticated: boolean
}
```

**Acciones**:
- `setToken`
- `setUser`
- `logout`
- `checkAuth`

**Persistencia**:
- Usa `zustand-persist` para persistir en localStorage

---

## 🌐 Servicios API

**Ruta**: `frontend/src/services/`

### api.ts
Cliente Axios configurado.

**Funcionalidad**:
- Configuración base URL
- Interceptor para añadir token JWT
- Manejo de errores

### socios.ts
Servicios específicos para socios.

**Métodos**:
- `getSocios`
- `getSocio`
- `createSocio`
- `updateSocio`
- `deleteSocio`

---

## 📝 Patrones de Diseño Utilizados

### 1. Container/Presentational
- Separación de lógica y presentación
- Hooks para lógica de negocio

### 2. Custom Hooks
- Reutilización de lógica
- Hooks específicos por módulo

### 3. Compound Components
- Componentes que trabajan juntos (ej: formularios multi-paso)

### 4. Render Props
- Algunos componentes usan render props para flexibilidad

### 5. Higher-Order Components
- `ProtectedRoute` como HOC para protección

---

## 🎨 Estilos y Temas

### Material-UI Theme
- Tema personalizado en `theme.ts`
- Modo claro por defecto
- Colores primarios y secundarios configurados

### Estilos Globales
- `App.css` - Estilos globales
- `index.css` - Reset y estilos base
- `styles/` - Estilos adicionales

---

## 📱 Responsive Design

- Diseño responsive con Material-UI Grid
- Breakpoints estándar de MUI
- Menú adaptativo en Navbar

---

## 🔄 Gestión de Estado

### Estado Global
- **Zustand**: Autenticación
- **TanStack Query**: Estado del servidor, cache, sincronización

### Estado Local
- **useState**: Estado local de componentes
- **useReducer**: Para estados complejos (si se usa)

---

## 📄 Generación de PDFs

### Librerías Utilizadas
- `jsPDF` - Generación básica de PDFs
- `@react-pdf/renderer` - PDFs con React

### Componentes PDF
- ReservaPDF
- LiquidacionPDF
- DeudasPDF
- InvitacionesPDF
- ResumenGeneralPDF
- ResumenDetalladoPDF

---

*Última actualización: Enero 2025*











