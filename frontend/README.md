# Frontend - Gestión Terranova

Interfaz de usuario para la aplicación de gestión de la asociación de vecinos Terranova.

## Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)

## Tecnologías Principales

- React + TypeScript
- Vite
- Material-UI
- React Query
- React Router
- Axios

## Instalación

```bash
# Instalar dependencias
npm install
```

## Configuración

1. Crear archivo `.env` en la raíz del proyecto frontend:
```env
VITE_API_URL=http://localhost:3000
```

## Desarrollo

```bash
# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes React
│   ├── auth/      # Componentes de autenticación
│   ├── users/     # Gestión de usuarios
│   ├── inventory/ # Gestión de inventario
│   └── ...
├── types/         # Tipos TypeScript
├── services/      # Servicios API
├── hooks/         # Custom hooks
└── utils/         # Utilidades
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Vista previa de la versión de producción
- `npm run lint`: Ejecuta el linter
- `npm run test`: Ejecuta los tests
