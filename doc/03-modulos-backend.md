# Módulos del Backend - Gestión Terranova

Documentación detallada de los módulos del backend desarrollados con NestJS.

---

## 📦 Módulos Disponibles

1. [Auth - Autenticación](#1-auth---autenticación)
2. [Users - Usuarios](#2-users---usuarios)
3. [Socios - Socios](#3-socios---socios)
4. [Inventory - Inventario](#4-inventory---inventario)
5. [Ventas - Ventas](#5-ventas---ventas)
6. [Reservas - Reservas](#6-reservas---reservas)
7. [Invitaciones - Invitaciones](#7-invitaciones---invitaciones)
8. [Uploads - Archivos](#8-uploads---archivos)

---

## 1. Auth - Autenticación

**Ruta**: `backend/src/modules/auth/`

### Propósito
Maneja la autenticación y autorización del sistema mediante JWT y Passport.js.

### Componentes

#### Controllers
- `auth.controller.ts` - Endpoints de autenticación

#### Services
- `auth.service.ts` - Lógica de autenticación, generación de tokens JWT

#### Guards
- `jwt-auth.guard.ts` - Guard para verificar tokens JWT
- `local-auth.guard.ts` - Guard para autenticación local
- `roles.guard.ts` - Guard para verificar roles de usuario

#### Strategies
- `jwt.strategy.ts` - Estrategia Passport para JWT
- `local.strategy.ts` - Estrategia Passport para username/password

#### Decorators
- `get-user.decorator.ts` - Decorator para obtener usuario del request
- `roles.decorator.ts` - Decorator para especificar roles requeridos

### Endpoints

```
POST /api/auth/login
  Body: { username: string, password: string }
  Response: { access_token: string, user: User }

POST /api/auth/register
  Body: { username, password, nombre, role }
  Response: { access_token, user }
```

### Dependencias
- `@nestjs/jwt`
- `@nestjs/passport`
- `passport-jwt`
- `passport-local`
- `bcrypt` (para hash de contraseñas)

---

## 2. Users - Usuarios

**Ruta**: `backend/src/modules/users/`

### Propósito
Gestión de usuarios del sistema (no socios, sino usuarios que acceden al sistema).

### Componentes

#### Controllers
- `users.controller.ts` - CRUD de usuarios

#### Services
- `users.service.ts` - Lógica de negocio para usuarios
- `init.service.ts` - Servicio de inicialización

#### Schemas
- `user.schema.ts` - Schema de MongoDB para usuarios

#### DTOs
- `create-user.dto.ts` - DTO para crear usuario
- `update-user.dto.ts` - DTO para actualizar usuario
- `login-user.dto.ts` - DTO para login
- `update-password.dto.ts` - DTO para cambiar contraseña

#### Types
- `user-roles.enum.ts` - Enum de roles: ADMINISTRADOR, JUNTA, TRABAJADOR

### Endpoints

```
GET    /api/users          # Listar usuarios
GET    /api/users/:id      # Obtener usuario
POST   /api/users          # Crear usuario
PUT    /api/users/:id      # Actualizar usuario
DELETE /api/users/:id      # Eliminar usuario
```

### Modelo de Datos

```typescript
User {
  _id: ObjectId
  username: string (único)
  password: string (hasheado)
  nombre: string
  apellidos?: string
  role: UserRole (ADMINISTRADOR | JUNTA | TRABAJADOR)
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}
```

---

## 3. Socios - Socios

**Ruta**: `backend/src/modules/socios/`

### Propósito
Gestión completa de socios de la asociación, incluyendo datos personales, familiares (asociados), y estado.

### Componentes

#### Controllers
- `socios.controller.ts` - CRUD de socios

#### Services
- `socios.service.ts` - Lógica de negocio para socios

#### Schemas
- `socio.schema.ts` - Schema principal de socio
- `asociado.schema.ts` - Schema para miembros familiares

#### DTOs
- `create-socio.dto.ts` - DTO para crear socio
- `update-socio.dto.ts` - DTO para actualizar socio
- `create-asociado.dto.ts` - DTO para crear asociado
- `update-asociado.dto.ts` - DTO para actualizar asociado

### Endpoints

```
GET    /api/socios         # Listar socios
GET    /api/socios/:id     # Obtener socio
POST   /api/socios         # Crear socio
PUT    /api/socios/:id     # Actualizar socio
DELETE /api/socios/:id     # Eliminar socio
```

### Modelo de Datos

```typescript
Socio {
  _id: ObjectId
  rgpd: boolean
  socio: string (único, código de socio)
  casa: number
  totalSocios: number
  menor3Años: number
  cuota: number
  dni: string
  nombre: {
    nombre: string
    primerApellido: string
    segundoApellido?: string
  }
  direccion: {
    calle: string
    numero: string
    piso?: string
    poblacion: string
    cp?: string
    provincia?: string
  }
  banco?: {
    iban: string
    entidad: string
    oficina: string
    dc: string
    cuenta: string
  }
  contacto: {
    telefonos: string[]
    emails: string[]
  }
  asociados: Asociado[]    # Miembros familiares
  notas?: string
  fotografia?: string
  foto?: string
  active: boolean
  socioPrincipal?: ObjectId (referencia a Socio)
  fechaBaja?: Date
  motivoBaja?: string
  observaciones?: string
  fechaNacimiento?: Date
  createdAt: Date
  updatedAt: Date
}

Asociado {
  nombre: string
  primerApellido: string
  segundoApellido?: string
  dni?: string
  fechaNacimiento?: Date
  parentesco?: string
}
```

---

## 4. Inventory - Inventario

**Ruta**: `backend/src/modules/inventory/`

### Propósito
Gestión del inventario del bar: productos, stock, precios.

### Componentes

#### Controllers
- `inventory.controller.ts` - CRUD de productos e importación/exportación

#### Services
- `inventory.service.ts` - Lógica de negocio para inventario

#### Schemas
- `product.schema.ts` - Schema de productos

#### DTOs
- `create-product.dto.ts` - DTO para crear producto
- `update-product.dto.ts` - DTO para actualizar producto

#### Types
- `import-results.interface.ts` - Interface para resultados de importación

### Endpoints

```
GET    /api/inventory           # Listar productos
GET    /api/inventory/:id       # Obtener producto
POST   /api/inventory           # Crear producto
PUT    /api/inventory/:id       # Actualizar producto
DELETE /api/inventory/:id       # Eliminar producto
POST   /api/inventory/import    # Importar desde Excel
GET    /api/inventory/export    # Exportar a Excel
```

### Modelo de Datos

```typescript
Product {
  _id: ObjectId
  nombre: string
  tipo: string
  unidad_medida: string
  stock_actual: number
  precio_compra_unitario: number
  activo: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. Ventas - Ventas

**Ruta**: `backend/src/modules/ventas/`

### Propósito
Sistema TPV (Terminal Punto de Venta) para registrar ventas del bar.

### Componentes

#### Controllers
- `ventas.controller.ts` - CRUD de ventas y pagos

#### Services
- `ventas.service.ts` - Lógica de negocio para ventas

#### Schemas
- `venta.schema.ts` - Schema de ventas

#### DTOs
- `create-venta.dto.ts` - DTO para crear venta
- `pago-venta.dto.ts` - DTO para registrar pago
- `venta-filters.dto.ts` - DTO para filtros de búsqueda
- `recaudaciones-filtros.dto.ts` - DTO para filtros de recaudaciones

### Endpoints

```
GET    /api/ventas              # Listar ventas
GET    /api/ventas/:id          # Obtener venta
POST   /api/ventas              # Crear venta
POST   /api/ventas/:id/pago    # Registrar pago de venta
GET    /api/ventas/recaudaciones # Obtener recaudaciones
```

### Modelo de Datos

```typescript
Venta {
  _id: ObjectId
  usuario: ObjectId (ref: User)
  codigoSocio: string
  nombreSocio: string
  esSocio: boolean
  productos: [{
    nombre: string
    categoria?: string
    unidades: number
    precioUnitario: number
    precioTotal: number
  }]
  total: number
  pagado: number
  estado: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO'
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'
  observaciones?: string
  pagos: [{
    fecha: Date
    monto: number
    metodoPago: 'EFECTIVO' | 'TARJETA'
    observaciones?: string
  }]
  createdAt: Date
  updatedAt: Date
}
```

---

## 6. Reservas - Reservas

**Ruta**: `backend/src/modules/reservas/`

### Propósito
Gestión de reservas de instalaciones (barbacoa, piscina, sala común, etc.).

### Componentes

#### Controllers
- `reservas.controller.ts` - CRUD de reservas
- `servicios.controller.ts` - Gestión de servicios disponibles

#### Services
- `reservas.service.ts` - Lógica de negocio para reservas
- `servicios.service.ts` - Lógica de negocio para servicios

#### Schemas
- `reserva.schema.ts` - Schema de reservas
- `servicio.schema.ts` - Schema de servicios disponibles
- `suplemento.schema.ts` - Schema de suplementos

#### DTOs
- `create-reserva.dto.ts` - DTO para crear reserva
- `update-reserva.dto.ts` - DTO para actualizar reserva
- `cancelar-reserva.dto.ts` - DTO para cancelar reserva
- `liquidar-reserva.dto.ts` - DTO para liquidar reserva
- `servicio.dto.ts` - DTO para servicios
- `suplemento.dto.ts` - DTO para suplementos

### Endpoints

```
GET    /api/reservas              # Listar reservas
GET    /api/reservas/:id          # Obtener reserva
POST   /api/reservas              # Crear reserva
PUT    /api/reservas/:id          # Actualizar reserva
POST   /api/reservas/:id/cancelar # Cancelar reserva
POST   /api/reservas/:id/liquidar # Liquidar reserva

GET    /api/servicios             # Listar servicios
POST   /api/servicios             # Crear servicio
PUT    /api/servicios/:id         # Actualizar servicio
DELETE /api/servicios/:id         # Eliminar servicio
```

### Modelo de Datos

```typescript
Reserva {
  _id: ObjectId
  fecha: Date
  tipoInstalacion: string
  usuarioCreacion: ObjectId (ref: User)
  usuarioActualizacion?: ObjectId (ref: User)
  socio: ObjectId (ref: Socio)
  suplementos: [{
    id: string
    cantidad?: number
  }]
  precio: number
  estado: EstadoReserva
  confirmadoPor?: ObjectId (ref: User)
  fechaConfirmacion?: Date
  fechaCancelacion?: Date
  fechaLiquidacion?: Date
  motivoCancelacion?: string
  observaciones?: string
  montoAbonado?: number
  montoDevuelto?: number
  metodoPago?: 'efectivo' | 'tarjeta'
  pendienteRevisionJunta?: boolean
  pagos?: [{
    monto: number
    metodoPago: string
    fecha: Date
  }]
  createdAt: Date
  updatedAt: Date
}

EstadoReserva {
  PENDIENTE
  CONFIRMADA
  CANCELADA
  COMPLETADA
  LIQUIDADA
  LISTA_ESPERA
}
```

---

## 7. Invitaciones - Invitaciones

**Ruta**: `backend/src/modules/invitaciones/`

### Propósito
Gestión de invitaciones anuales de socios (12 invitaciones por socio por año).

### Componentes

#### Controllers
- `invitaciones.controller.ts` - CRUD de invitaciones

#### Services
- `invitaciones.service.ts` - Lógica de negocio para invitaciones

#### Schemas
- `invitacion.schema.ts` - Schema de invitaciones
- `socio-invitaciones.schema.ts` - Schema para control de invitaciones por socio

#### DTOs
- `create-invitacion.dto.ts` - DTO para crear invitación
- `update-invitaciones.dto.ts` - DTO para actualizar invitación
- `invitaciones-filters.dto.ts` - DTO para filtros

### Endpoints

```
GET    /api/invitaciones              # Listar invitaciones
GET    /api/invitaciones/:id         # Obtener invitación
POST   /api/invitaciones             # Crear invitación
PUT    /api/invitaciones/:id         # Actualizar invitación
DELETE /api/invitaciones/:id         # Eliminar invitación
GET    /api/invitaciones/socio/:socioId # Invitaciones de un socio
```

### Modelo de Datos

```typescript
Invitacion {
  _id: ObjectId
  socio: ObjectId (ref: Socio)
  fechaUso: Date
  nombreInvitado: string
  observaciones?: string
  createdAt: Date
  updatedAt: Date
}
```

---

## 8. Uploads - Archivos

**Ruta**: `backend/src/modules/uploads/`

### Propósito
Gestión de subida y almacenamiento de archivos (principalmente imágenes de socios).

### Componentes

#### Controllers
- `uploads.controller.ts` - Endpoint para subir archivos

#### Services
- `uploads.service.ts` - Lógica de manejo de archivos

### Endpoints

```
POST   /api/uploads          # Subir archivo
GET    /uploads/:filename    # Obtener archivo (estático)
```

### Configuración

- Directorio de almacenamiento: `backend/uploads/`
- Límite de tamaño: 50MB (configurado en `main.ts`)
- Tipos permitidos: Imágenes principalmente

---

## 🔗 Dependencias entre Módulos

```
Auth Module
  └──> Users Module (para verificar usuarios)

Socios Module
  └──> Uploads Module (para fotos)

Reservas Module
  └──> Socios Module (referencia a socios)
  └──> Users Module (usuario que crea/modifica)

Ventas Module
  └──> Users Module (usuario que realiza venta)

Invitaciones Module
  └──> Socios Module (referencia a socios)
```

---

## 📝 Notas de Implementación

1. **Validación**: Todos los DTOs usan `class-validator` para validación
2. **Transformación**: Se usa `class-transformer` para transformar datos
3. **Guards**: Los endpoints protegidos usan `@UseGuards(JwtAuthGuard, RolesGuard)`
4. **Swagger**: Los endpoints están documentados con decoradores Swagger
5. **Timestamps**: Todos los schemas tienen `timestamps: true` para createdAt/updatedAt

---

*Última actualización: Enero 2025*



