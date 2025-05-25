# Gestión Terranova

Sistema de gestión para la Asociación de Vecinos Terranova.

## 🚀 Tecnologías

- **Frontend**: React + TypeScript
- **Backend**: NestJS + TypeScript
- **Base de Datos**: MongoDB

## 📋 Requisitos

- Node.js >= 18
- MongoDB >= 6.0
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/gestion-terranova.git
cd gestion-terranova
```

2. Instalar dependencias del backend:
```bash
cd backend
npm install
```

3. Instalar dependencias del frontend:
```bash
cd ../frontend
npm install
```

4. Configurar variables de entorno:
   - Copiar `.env.example` a `.env` en el directorio backend
   - Ajustar las variables según tu entorno

## 🚀 Desarrollo

1. Iniciar el backend:
```bash
cd backend
npm run start:dev
```

2. Iniciar el frontend:
```bash
cd frontend
npm run dev
```

## 📦 Producción

1. Construir el frontend:
```bash
cd frontend
npm run build
```

2. Construir el backend:
```bash
cd backend
npm run build
```

3. Iniciar en producción:
```bash
cd backend
npm run start:prod
```

## 👥 Roles de Usuario

- **ADMINISTRADOR**: Acceso total al sistema
- **JUNTA**: Acceso limitado a gestión de socios, reservas e invitaciones
- **TRABAJADOR**: Acceso a inventario, TPV y reservas

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.