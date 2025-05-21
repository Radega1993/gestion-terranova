# Gestión Terranova

Aplicación TPV offline para gestión integral de una asociación de vecinos con bar, servicios (BBQ/piscinas) y control de acceso por roles.

## Requisitos Previos

- Node.js (v18 o superior)
- MongoDB Community Edition
- npm (v9 o superior)

## Estructura del Proyecto

```
gestion-terranova/
├── frontend/          # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── backend/           # API NestJS
    ├── src/
    │   ├── modules/
    │   ├── config/
    │   └── utils/
    └── package.json
```

## Instalación

1. Clonar el repositorio:
```bash
git clone [url-del-repositorio]
cd gestion-terranova
```

2. Instalar dependencias del frontend:
```bash
cd frontend
npm install
```

3. Instalar dependencias del backend:
```bash
cd ../backend
npm install
```

## Configuración

1. Frontend:
- No requiere configuración adicional para desarrollo

2. Backend:
- Copiar `.env.example` a `.env`
- Configurar las variables de entorno según necesidad

## Ejecución

1. Iniciar MongoDB:
```bash
sudo systemctl start mongod
```

2. Iniciar el backend:
```bash
cd backend
npm run start:dev
```

3. Iniciar el frontend:
```bash
cd frontend
npm run dev
```

## Módulos Principales

- Deudas: Historial y gestión de pagos pendientes
- Reservas: Sistema de booking para instalaciones
- Ventas: TPV con tickets y cierre de caja
- Socios: CRUD con campos personalizables
- Stock: Inventario con alertas
- Usuarios: Sistema de autenticación y perfiles

## Tecnologías Utilizadas

### Frontend
- React.js + TypeScript
- Material-UI
- Dexie.js (IndexedDB)
- React Query
- React Router

### Backend
- NestJS
- MongoDB
- JWT Authentication
- Zod Validation
- Passport.js

## Licencia

[MIT](LICENSE)