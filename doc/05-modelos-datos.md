# Modelos de Datos - Gestión Terranova

Documentación completa de los modelos de datos y schemas de MongoDB.

---

## 📊 Esquema General de la Base de Datos

**Base de Datos**: `gestion-terranova`

**Motor**: MongoDB 7.8.7

**ODM**: Mongoose 10.1.0

---

## 👤 Users - Usuarios del Sistema

**Colección**: `users`

**Schema**: `backend/src/modules/users/schemas/user.schema.ts`

### Estructura

```typescript
User {
  _id: ObjectId                    // ID único de MongoDB
  username: string                  // Nombre de usuario (único, requerido)
  password: string                 // Contraseña hasheada con bcrypt (requerido)
  nombre: string                   // Nombre real (requerido)
  apellidos?: string               // Apellidos (opcional)
  role: UserRole                   // Rol: ADMINISTRADOR | JUNTA | TRABAJADOR (requerido, default: TRABAJADOR)
  isActive: boolean                // Estado activo/inactivo (requerido, default: true)
  lastLogin?: Date                 // Último inicio de sesión (opcional)
  createdAt: Date                  // Fecha de creación (automático)
  updatedAt: Date                  // Fecha de actualización (automático)
}
```

### Índices

- `username`: Único

### Relaciones

- Referenciado en: `ventas.usuario`, `reservas.usuarioCreacion`, `reservas.usuarioActualizacion`

---

## 👥 Socios - Socios de la Asociación

**Colección**: `socios`

**Schema**: `backend/src/modules/socios/schemas/socio.schema.ts`

### Estructura

```typescript
Socio {
  _id: ObjectId                    // ID único de MongoDB
  
  // Datos básicos
  rgpd: boolean                    // Consentimiento RGPD (requerido, default: false)
  socio: string                   // Código de socio (único, requerido)
  casa: number                     // Número de casa (requerido, default: 1)
  totalSocios: number             // Total de socios en la casa (requerido, default: 1)
  menor3Años: number              // Menores de 3 años (default: 0)
  cuota: number                   // Cuota mensual/anual (requerido, default: 0)
  dni: string                     // DNI (opcional)
  
  // Nombre
  nombre: {
    nombre: string                // Nombre (requerido)
    primerApellido: string        // Primer apellido (requerido)
    segundoApellido?: string      // Segundo apellido (opcional)
  }
  
  // Dirección
  direccion: {
    calle: string                 // Calle (requerido)
    numero: string                // Número (requerido)
    piso?: string                 // Piso (opcional)
    poblacion: string             // Población (requerido)
    cp?: string                   // Código postal (opcional)
    provincia?: string            // Provincia (opcional)
  }
  
  // Datos bancarios
  banco?: {
    iban: string                  // IBAN (opcional)
    entidad: string               // Entidad bancaria (opcional)
    oficina: string               // Oficina (opcional)
    dc: string                    // Dígito de control (opcional)
    cuenta: string                // Número de cuenta (opcional)
  }
  
  // Contacto
  contacto: {
    telefonos: string[]           // Array de teléfonos (default: [''])
    emails: string[]              // Array de emails (default: [''])
  }
  
  // Asociados (miembros familiares)
  asociados: Asociado[]           // Array de asociados (default: [])
  
  // Información adicional
  notas?: string                  // Notas generales (opcional)
  fotografia?: string             // Ruta a fotografía (opcional)
  foto?: string                   // Ruta alternativa a foto (opcional)
  
  // Estado y control
  active: boolean                 // Estado activo/inactivo (default: true)
  socioPrincipal?: ObjectId       // Referencia a socio principal si es asociado (ref: Socio)
  fechaBaja?: Date               // Fecha de baja (opcional)
  motivoBaja?: string            // Motivo de baja (opcional)
  observaciones?: string         // Observaciones adicionales (opcional)
  fechaNacimiento?: Date         // Fecha de nacimiento (opcional)
  
  // Timestamps
  createdAt: Date                 // Fecha de creación (automático)
  updatedAt: Date                 // Fecha de actualización (automático)
}
```

### Asociado (Subdocumento)

```typescript
Asociado {
  nombre: string                  // Nombre (requerido)
  primerApellido: string          // Primer apellido (requerido)
  segundoApellido?: string        // Segundo apellido (opcional)
  dni?: string                    // DNI (opcional)
  fechaNacimiento?: Date          // Fecha de nacimiento (opcional)
  parentesco?: string             // Parentesco (opcional)
}
```

### Índices

- `socio`: Único

### Relaciones

- **Auto-referencia**: `socioPrincipal` → `Socio`
- Referenciado en: `reservas.socio`, `invitaciones.socio`

---

## 📦 Products - Productos del Inventario

**Colección**: `products`

**Schema**: `backend/src/modules/inventory/schemas/product.schema.ts`

### Estructura

```typescript
Product {
  _id: ObjectId                   // ID único de MongoDB
  nombre: string                  // Nombre del producto (requerido)
  tipo: string                    // Tipo/categoría (requerido)
  unidad_medida: string           // Unidad de medida (ej: "unidad", "kg", "litro") (requerido)
  stock_actual: number            // Stock actual (requerido, min: 0)
  precio_compra_unitario: number  // Precio de compra unitario (requerido, min: 0)
  activo: boolean                 // Producto activo/inactivo (default: true)
  createdAt: Date                 // Fecha de creación (automático)
  updatedAt: Date                 // Fecha de actualización (automático)
}
```

### Índices

- No hay índices únicos definidos

### Relaciones

- Usado en: `ventas.productos` (referencia por nombre)

---

## 💰 Ventas - Ventas del TPV

**Colección**: `ventas`

**Schema**: `backend/src/modules/ventas/schemas/venta.schema.ts`

### Estructura

```typescript
Venta {
  _id: ObjectId                   // ID único de MongoDB
  
  // Usuario y socio
  usuario: ObjectId               // Usuario que realiza la venta (ref: User, requerido)
  codigoSocio: string            // Código del socio (requerido)
  nombreSocio: string            // Nombre del socio (requerido)
  esSocio: boolean               // Indica si es socio o no (requerido)
  
  // Productos
  productos: [{
    nombre: string               // Nombre del producto (requerido)
    categoria?: string           // Categoría (opcional)
    unidades: number             // Cantidad (requerido)
    precioUnitario: number       // Precio unitario (requerido)
    precioTotal: number          // Precio total (requerido)
  }]
  
  // Totales y estado
  total: number                  // Total de la venta (requerido)
  pagado: number                 // Monto pagado (requerido, default: 0)
  estado: string                 // Estado: 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO' (requerido, default: 'PENDIENTE')
  
  // Pago
  metodoPago: string             // Método: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' (default: 'EFECTIVO')
  observaciones?: string         // Observaciones (opcional)
  
  // Historial de pagos
  pagos: [{
    fecha: Date                  // Fecha del pago (requerido)
    monto: number                // Monto pagado (requerido)
    metodoPago: string           // Método: 'EFECTIVO' | 'TARJETA' (requerido)
    observaciones?: string       // Observaciones (opcional)
  }]
  
  createdAt: Date                // Fecha de creación (automático)
  updatedAt: Date                // Fecha de actualización (automático)
}
```

### Índices

- `usuario`: Índice para búsquedas por usuario
- `codigoSocio`: Índice para búsquedas por socio
- `estado`: Índice para filtros por estado
- `createdAt`: Índice para ordenamiento por fecha

### Relaciones

- `usuario` → `User`

---

## 📅 Reservas - Reservas de Instalaciones

**Colección**: `reservas`

**Schema**: `backend/src/modules/reservas/schemas/reserva.schema.ts`

### Estructura

```typescript
Reserva {
  _id: ObjectId                   // ID único de MongoDB
  
  // Información básica
  fecha: Date                     // Fecha de la reserva (requerido)
  tipoInstalacion: string         // Tipo: "barbacoa", "piscina", "sala_comun", etc. (requerido)
  
  // Usuarios
  usuarioCreacion: ObjectId       // Usuario que crea la reserva (ref: User, requerido)
  usuarioActualizacion?: ObjectId // Usuario que actualiza (ref: User, opcional)
  
  // Socio
  socio: ObjectId                 // Socio que reserva (ref: Socio, requerido)
  
  // Suplementos
  suplementos: [{
    id: string                    // ID del suplemento (requerido)
    cantidad?: number             // Cantidad (opcional)
    _id?: ObjectId                // ID de MongoDB del suplemento (opcional)
  }]
  
  // Precio y estado
  precio: number                  // Precio total (requerido)
  estado: EstadoReserva           // Estado (requerido, default: PENDIENTE)
  
  // Confirmación
  confirmadoPor?: ObjectId        // Usuario que confirma (ref: User, opcional)
  fechaConfirmacion?: Date        // Fecha de confirmación (opcional)
  
  // Cancelación
  fechaCancelacion?: Date         // Fecha de cancelación (opcional)
  motivoCancelacion?: string      // Motivo de cancelación (opcional)
  
  // Liquidación
  fechaLiquidacion?: Date         // Fecha de liquidación (opcional)
  
  // Observaciones
  observaciones?: string          // Observaciones generales (opcional)
  
  // Pagos
  montoAbonado?: number           // Monto abonado (default: 0)
  montoDevuelto?: number          // Monto devuelto (default: 0)
  metodoPago?: MetodoPago         // Método: 'efectivo' | 'tarjeta' (opcional)
  pendienteRevisionJunta?: boolean // Pendiente revisión de junta (default: false)
  
  // Historial de pagos
  pagos?: [{
    monto: number                 // Monto del pago
    metodoPago: string            // Método de pago
    fecha: Date                   // Fecha del pago
  }]
  
  createdAt: Date                 // Fecha de creación (automático)
  updatedAt: Date                 // Fecha de actualización (automático)
}
```

### Enums

```typescript
EstadoReserva {
  PENDIENTE = 'PENDIENTE'
  CONFIRMADA = 'CONFIRMADA'
  CANCELADA = 'CANCELADA'
  COMPLETADA = 'COMPLETADA'
  LIQUIDADA = 'LIQUIDADA'
  LISTA_ESPERA = 'LISTA_ESPERA'
}

MetodoPago {
  EFECTIVO = 'efectivo'
  TARJETA = 'tarjeta'
}
```

### Índices

- `socio`: Índice para búsquedas por socio
- `fecha`: Índice para búsquedas por fecha
- `tipoInstalacion`: Índice para filtros por instalación
- `estado`: Índice para filtros por estado
- `usuarioCreacion`: Índice para búsquedas por usuario

### Relaciones

- `socio` → `Socio`
- `usuarioCreacion` → `User`
- `usuarioActualizacion` → `User`
- `confirmadoPor` → `User`

---

## 🎫 Invitaciones - Invitaciones de Socios

**Colección**: `invitaciones`

**Schema**: `backend/src/modules/invitaciones/schemas/invitacion.schema.ts`

### Estructura

```typescript
Invitacion {
  _id: ObjectId                   // ID único de MongoDB
  socio: ObjectId                // Socio que usa la invitación (ref: Socio, requerido)
  fechaUso: Date                 // Fecha de uso de la invitación (requerido)
  nombreInvitado: string         // Nombre del invitado (requerido)
  observaciones?: string         // Observaciones (opcional)
  createdAt: Date                // Fecha de creación (automático)
  updatedAt: Date                // Fecha de actualización (automático)
}
```

### Reglas de Negocio

- Cada socio tiene **12 invitaciones por año**
- Las invitaciones se cuentan por año calendario
- Se registra cada uso de invitación

### Índices

- `socio`: Índice para búsquedas por socio
- `fechaUso`: Índice para búsquedas por fecha
- Compuesto: `{ socio: 1, fechaUso: 1 }` para contar invitaciones por año

### Relaciones

- `socio` → `Socio`

---

## 🏢 Servicios - Servicios Disponibles

**Colección**: `servicios`

**Schema**: `backend/src/modules/reservas/schemas/servicio.schema.ts`

### Estructura

```typescript
Servicio {
  _id: ObjectId                   // ID único de MongoDB
  nombre: string                  // Nombre del servicio (requerido)
  descripcion?: string            // Descripción (opcional)
  precio: number                 // Precio base (requerido)
  activo: boolean                 // Servicio activo/inactivo (default: true)
  createdAt: Date                // Fecha de creación (automático)
  updatedAt: Date                // Fecha de actualización (automático)
}
```

### Relaciones

- Usado en: `reservas.tipoInstalacion` (referencia por nombre o ID)

---

## ➕ Suplementos - Suplementos para Reservas

**Colección**: `suplementos`

**Schema**: `backend/src/modules/reservas/schemas/suplemento.schema.ts`

### Estructura

```typescript
Suplemento {
  _id: ObjectId                   // ID único de MongoDB
  nombre: string                  // Nombre del suplemento (requerido)
  descripcion?: string            // Descripción (opcional)
  precio: number                 // Precio unitario (requerido)
  activo: boolean                 // Suplemento activo/inactivo (default: true)
  createdAt: Date                // Fecha de creación (automático)
  updatedAt: Date                // Fecha de actualización (automático)
}
```

### Relaciones

- Usado en: `reservas.suplementos` (referencia por ID)

---

## 🔗 Relaciones entre Modelos

### Diagrama de Relaciones

```
Users
  ├──→ Ventas (usuario)
  ├──→ Reservas (usuarioCreacion, usuarioActualizacion, confirmadoPor)
  └──→ (no hay relación inversa directa)

Socios
  ├──→ Reservas (socio)
  ├──→ Invitaciones (socio)
  └──→ Socios (socioPrincipal) [auto-referencia]

Products
  └──→ Ventas (productos) [referencia por nombre]

Servicios
  └──→ Reservas (tipoInstalacion) [referencia por nombre/ID]

Suplementos
  └──→ Reservas (suplementos) [referencia por ID]
```

---

## 📊 Índices Recomendados

### Índices Existentes

1. **Users**
   - `username`: Único

2. **Socios**
   - `socio`: Único

3. **Ventas**
   - `usuario`: Índice simple
   - `codigoSocio`: Índice simple
   - `estado`: Índice simple
   - `createdAt`: Índice simple

4. **Reservas**
   - `socio`: Índice simple
   - `fecha`: Índice simple
   - `tipoInstalacion`: Índice simple
   - `estado`: Índice simple
   - `usuarioCreacion`: Índice simple

5. **Invitaciones**
   - `socio`: Índice simple
   - `fechaUso`: Índice simple
   - Compuesto: `{ socio: 1, fechaUso: 1 }`

### Índices Recomendados Adicionales

1. **Reservas**
   - Compuesto: `{ fecha: 1, tipoInstalacion: 1 }` para búsquedas de disponibilidad
   - Compuesto: `{ socio: 1, estado: 1 }` para reservas activas por socio

2. **Ventas**
   - Compuesto: `{ codigoSocio: 1, estado: 1 }` para ventas pendientes por socio
   - Compuesto: `{ createdAt: -1 }` para ordenamiento por fecha descendente

3. **Invitaciones**
   - Compuesto: `{ socio: 1, fechaUso: 1, año: 1 }` para contar invitaciones por año

---

## 🔒 Validaciones y Constraints

### Validaciones a Nivel de Schema

1. **Campos Requeridos**: Definidos con `required: true`
2. **Valores Únicos**: `unique: true` en campos como `username`, `socio`
3. **Valores Mínimos**: `min: 0` en campos numéricos
4. **Enums**: Validación de valores permitidos
5. **Referencias**: Validación de ObjectIds válidos

### Validaciones a Nivel de DTO

- `class-validator` para validación de entrada
- `class-transformer` para transformación de datos

---

## 📈 Optimizaciones Recomendadas

1. **Índices Compuestos**: Para consultas frecuentes
2. **Paginación**: Implementada en endpoints de listado
3. **Proyecciones**: Seleccionar solo campos necesarios
4. **Agregaciones**: Para reportes complejos
5. **Caché**: Considerar Redis para datos frecuentes

---

*Última actualización: Enero 2025*




