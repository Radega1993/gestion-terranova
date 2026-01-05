# Arquitectura del Sistema - Gestión Terranova

## 🏛️ Arquitectura General

El proyecto sigue una **arquitectura de tres capas** (3-tier) con separación clara entre frontend, backend y base de datos.

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Material-UI
│   (Puerto 5173) │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
┌────────▼────────┐
│   Backend       │  NestJS + TypeScript
│   (Puerto 3000) │
└────────┬────────┘
         │ Mongoose ODM
┌────────▼────────┐
│   MongoDB       │  Base de Datos NoSQL
│   (Puerto 27017)│
└─────────────────┘
```

---

## 🎨 Arquitectura Frontend

### Stack Tecnológico
- **React 19.0.0** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Material-UI** - Componentes UI
- **React Router** - Navegación
- **Zustand** - Estado global
- **TanStack Query** - Gestión de estado del servidor
- **Axios** - Cliente HTTP

### Estructura de Carpetas

```
frontend/src/
├── app/              # Configuración de la app
├── components/       # Componentes React organizados por módulo
│   ├── auth/        # Autenticación
│   ├── socios/      # Gestión de socios
│   ├── inventory/    # Inventario
│   ├── ventas/      # TPV y ventas
│   ├── reservas/    # Reservas
│   ├── invitaciones/# Invitaciones
│   ├── deudas/      # Deudas
│   ├── recaudaciones/# Recaudaciones
│   ├── users/       # Usuarios
│   ├── dashboard/   # Dashboard
│   └── layout/      # Layout y Navbar
├── contexts/         # React Contexts
├── hooks/            # Custom hooks
├── services/         # Servicios API
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── utils/            # Utilidades
├── styles/           # Estilos globales
├── config.ts         # Configuración
├── App.tsx           # Componente raíz
└── main.tsx          # Punto de entrada
```

### Patrones de Diseño

1. **Container/Presentational Pattern**
   - Componentes de presentación separados de lógica
   - Hooks personalizados para lógica de negocio

2. **Custom Hooks**
   - `useAuth` - Autenticación
   - Hooks específicos por módulo (ej: `useReservas`, `useSocios`)

3. **State Management**
   - **Zustand** para estado global (auth)
   - **TanStack Query** para estado del servidor (cache, sincronización)
   - **Local State** (useState) para estado local de componentes

4. **API Layer**
   - Servicios centralizados (`api.ts`, `socios.ts`)
   - Interceptores de Axios para autenticación
   - Configuración centralizada

---

## ⚙️ Arquitectura Backend

### Stack Tecnológico
- **NestJS 10.4.17** - Framework Node.js
- **TypeScript** - Tipado estático
- **MongoDB + Mongoose** - Base de datos y ODM
- **Passport.js** - Autenticación
- **JWT** - Tokens de autenticación
- **class-validator** - Validación de DTOs
- **Swagger** - Documentación API

### Estructura de Carpetas

```
backend/src/
├── modules/          # Módulos de la aplicación
│   ├── auth/        # Autenticación
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── decorators/
│   ├── users/       # Usuarios
│   ├── socios/      # Socios
│   ├── inventory/   # Inventario
│   ├── ventas/      # Ventas
│   ├── reservas/    # Reservas
│   ├── invitaciones/# Invitaciones
│   └── uploads/     # Archivos
├── scripts/         # Scripts de utilidad
├── app.module.ts    # Módulo raíz
├── app.controller.ts
├── app.service.ts
└── main.ts          # Punto de entrada
```

### Estructura de Módulos (NestJS Pattern)

Cada módulo sigue la estructura estándar de NestJS:

```
module-name/
├── module-name.module.ts    # Definición del módulo
├── controllers/             # Controladores (endpoints)
│   └── module-name.controller.ts
├── services/                # Lógica de negocio
│   └── module-name.service.ts
├── dto/                     # Data Transfer Objects
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── schemas/                 # Schemas de MongoDB
│   └── module-name.schema.ts
└── types/                   # Tipos TypeScript (si aplica)
```

### Patrones de Diseño

1. **Modular Architecture**
   - Cada funcionalidad es un módulo independiente
   - Módulos exportan servicios para reutilización

2. **Dependency Injection**
   - NestJS maneja la inyección de dependencias
   - Servicios inyectados en controladores

3. **DTOs (Data Transfer Objects)**
   - Validación de entrada con class-validator
   - Transformación de datos con class-transformer

4. **Guards**
   - `JwtAuthGuard` - Verificación de token
   - `RolesGuard` - Verificación de roles
   - `LocalAuthGuard` - Autenticación local

5. **Strategies (Passport)**
   - `JwtStrategy` - Estrategia JWT
   - `LocalStrategy` - Estrategia local (username/password)

---

## 🔐 Arquitectura de Seguridad

### Autenticación

```
┌─────────────┐
│   Login     │
│  (Frontend) │
└──────┬──────┘
       │ POST /api/auth/login
       │ { username, password }
┌──────▼──────┐
│   Backend   │
│   Auth      │
│   Service   │
└──────┬──────┘
       │ Verifica credenciales
       │ Genera JWT token
┌──────▼──────┐
│   Frontend  │
│   Store     │
│   Token     │
└──────┬──────┘
       │ Incluye en headers
       │ Authorization: Bearer <token>
┌──────▼──────┐
│   Backend   │
│   Guards    │
│   Verify    │
└─────────────┘
```

### Autorización por Roles

```
Request → JwtAuthGuard → RolesGuard → Controller
           ↓              ↓
        Verifica      Verifica rol
        token JWT      del usuario
```

**Roles disponibles:**
- `ADMINISTRADOR` - Acceso total
- `JUNTA` - Acceso limitado
- `TRABAJADOR` - Acceso operativo

---

## 💾 Arquitectura de Datos

### MongoDB Collections

```
MongoDB Database: gestion-terranova
├── users           # Usuarios del sistema
├── socios          # Socios de la asociación
├── products        # Productos del inventario
├── ventas          # Ventas realizadas
├── reservas        # Reservas de instalaciones
├── servicios       # Servicios disponibles
├── suplementos     # Suplementos para reservas
└── invitaciones    # Invitaciones de socios
```

### Relaciones

- **Reservas** → Referencia a `Socios` y `Users`
- **Ventas** → Referencia a `Users` y código de socio
- **Invitaciones** → Referencia a `Socios`
- **Socios** → Puede tener `socioPrincipal` (auto-referencia)

---

## 🔄 Flujo de Datos

### Flujo Típico de una Petición

```
1. Usuario interactúa con UI (Frontend)
   ↓
2. Componente llama a servicio/hook
   ↓
3. Servicio hace petición HTTP con Axios
   ↓
4. Interceptor añade token JWT
   ↓
5. Backend recibe petición
   ↓
6. Guards verifican autenticación/autorización
   ↓
7. Controller recibe petición
   ↓
8. Controller llama a Service
   ↓
9. Service interactúa con MongoDB vía Mongoose
   ↓
10. Service retorna datos
    ↓
11. Controller retorna respuesta HTTP
    ↓
12. Frontend recibe respuesta
    ↓
13. TanStack Query cachea y actualiza UI
```

---

## 📡 API REST

### Convenciones

- **Prefijo global**: `/api`
- **Métodos HTTP**:
  - `GET` - Obtener recursos
  - `POST` - Crear recursos
  - `PUT` - Actualizar recursos completos
  - `PATCH` - Actualizar recursos parciales
  - `DELETE` - Eliminar recursos

### Estructura de Endpoints

```
/api
├── /auth
│   ├── POST /login
│   └── POST /register
├── /users
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── /socios
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── /inventory
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── POST /import
│   └── GET /export
├── /ventas
│   ├── GET /
│   ├── POST /
│   └── POST /:id/pago
├── /reservas
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   ├── POST /:id/cancelar
│   └── POST /:id/liquidar
└── /invitaciones
    ├── GET /
    ├── POST /
    └── GET /socio/:socioId
```

---

## 🚀 Despliegue

### Desarrollo Local

```
Backend:  http://localhost:3000
Frontend: http://localhost:5173
MongoDB:  mongodb://localhost:27017
```

### Producción

- Backend compilado con `nest build`
- Frontend build estático con `vite build`
- MongoDB puede ejecutarse en Docker o servidor dedicado

---

## 🔧 Configuración

### Variables de Entorno Requeridas

**Backend (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/gestion-terranova
JWT_SECRET=tu_secreto_jwt_aqui
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (config.ts)**
```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

---

*Última actualización: Enero 2025*




