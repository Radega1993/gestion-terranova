# Backend - Gestión Terranova

API REST para la aplicación de gestión de la asociación de vecinos Terranova.

## Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)
- MongoDB (v6 o superior)

## Tecnologías Principales

- NestJS
- MongoDB + Mongoose
- JWT Authentication
- Passport.js
- Class Validator
- Multer

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

1. Crear archivo `.env` en la raíz del proyecto backend:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/gestion-terranova

# JWT
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRATION=24h

# Server
PORT=3000
NODE_ENV=development
```

## Desarrollo

```bash
# Iniciar en modo desarrollo
npm run start:dev

# Iniciar en modo debug
npm run start:debug

# Iniciar en modo producción
npm run start:prod
```

## Estructura del Proyecto

```
src/
├── modules/           # Módulos de la aplicación
│   ├── auth/         # Autenticación
│   ├── users/        # Gestión de usuarios
│   ├── inventory/    # Gestión de inventario
│   └── ...
├── config/           # Configuraciones
├── utils/            # Utilidades
└── app.module.ts     # Módulo principal
```

## API Endpoints

### Autenticación
- POST /auth/login
- POST /auth/register

### Usuarios
- GET /users
- POST /users
- PUT /users/:id
- DELETE /users/:id

### Inventario
- GET /inventory
- POST /inventory
- PUT /inventory/:id
- DELETE /inventory/:id
- POST /inventory/import
- GET /inventory/export

## Scripts Disponibles

- `npm run start:dev`: Inicia el servidor en modo desarrollo
- `npm run start:debug`: Inicia el servidor en modo debug
- `npm run start:prod`: Inicia el servidor en modo producción
- `npm run test`: Ejecuta los tests
- `npm run test:e2e`: Ejecuta los tests end-to-end
- `npm run lint`: Ejecuta el linter
