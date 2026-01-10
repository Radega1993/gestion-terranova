# Stack Tecnológico - Gestión Terranova

Documentación detallada de las tecnologías utilizadas en el proyecto.

---

## 🎯 Resumen del Stack

**Arquitectura**: Monolito modular (Frontend + Backend separados)

**Tipo de Aplicación**: SPA (Single Page Application) + API REST

**Base de Datos**: NoSQL (MongoDB)

---

## 🖥️ Backend

### Framework Principal

#### NestJS 10.4.17
- **Tipo**: Framework Node.js
- **Paradigma**: Programación orientada a objetos, decoradores
- **Características**:
  - Arquitectura modular
  - Inyección de dependencias
  - Soporte TypeScript nativo
  - Decoradores para routing, validación, etc.

**Documentación**: https://docs.nestjs.com/

### Lenguaje

#### TypeScript 5.0+
- **Versión**: 5.0.0+
- **Tipo**: Superset de JavaScript con tipado estático
- **Uso**: Todo el código backend está en TypeScript

### Base de Datos

#### MongoDB 7.8.7
- **Tipo**: Base de datos NoSQL orientada a documentos
- **ODM**: Mongoose 10.1.0
- **Características**:
  - Schemas con validación
  - Middleware de Mongoose
  - Queries tipadas
  - Relaciones y referencias

**Documentación**: 
- MongoDB: https://www.mongodb.com/docs/
- Mongoose: https://mongoosejs.com/

### Autenticación y Seguridad

#### Passport.js
- **Versión**: 0.6.0
- **Estrategias**:
  - `passport-jwt` 4.0.1 - Autenticación JWT
  - `passport-local` 1.0.0 - Autenticación local

#### JWT (JSON Web Tokens)
- **Librería**: `jsonwebtoken` 9.0.0
- **Integración**: `@nestjs/jwt` 11.0.0
- **Uso**: Tokens de autenticación con expiración configurable

#### Bcrypt
- **Versión**: 5.1.1
- **Uso**: Hash de contraseñas
- **Rondas**: Configurables (default: 10)

### Validación y Transformación

#### class-validator 0.14.2
- **Uso**: Validación de DTOs
- **Decoradores**: `@IsString()`, `@IsEmail()`, `@Min()`, etc.

#### class-transformer 0.5.1
- **Uso**: Transformación de objetos
- **Características**: Conversión de tipos, exclusión de propiedades

### Documentación API

#### Swagger (OpenAPI)
- **Librería**: `@nestjs/swagger` 7.0.0
- **Uso**: Documentación interactiva de API
- **Endpoint**: `/api` (configurado en `main.ts`)

### Manejo de Archivos

#### Multer
- **Tipo**: Middleware para manejo de archivos
- **Integración**: `@types/multer` 1.4.12
- **Uso**: Subida de imágenes de socios

### Procesamiento de Excel

#### ExcelJS 4.4.0
- **Uso**: Importación/exportación de inventario
- **Características**: Lectura y escritura de archivos Excel

#### xlsx 0.18.5
- **Uso**: Procesamiento adicional de Excel
- **Tipo**: Librería alternativa/complementaria

### Configuración

#### @nestjs/config 3.3.0
- **Uso**: Gestión de variables de entorno
- **Características**: Validación de configuración, módulos de configuración

### Testing (Disponible)

#### Jest 29.5.0
- **Uso**: Framework de testing
- **Integración**: `@nestjs/testing` 11.1.1
- **Configuración**: `jest.config.js`

#### Supertest 6.3.0
- **Uso**: Testing de endpoints HTTP
- **Integración**: Con Jest para tests E2E

### Herramientas de Desarrollo

#### ESLint
- **Versión**: 8.0.0
- **Plugins**: 
  - `@typescript-eslint/eslint-plugin` 6.0.0
  - `@typescript-eslint/parser` 6.0.0
- **Configuración**: `.eslintrc.js`

#### Prettier 3.0.0
- **Uso**: Formateo de código
- **Integración**: Con ESLint

#### Nodemon 3.0.0
- **Uso**: Auto-reload en desarrollo
- **Integración**: Con NestJS CLI

---

## 🎨 Frontend

### Framework Principal

#### React 19.0.0
- **Tipo**: Biblioteca de UI
- **Paradigma**: Componentes funcionales, hooks
- **Características**:
  - Virtual DOM
  - Componentes reutilizables
  - Hooks para estado y efectos

**Documentación**: https://react.dev/

#### React DOM 19.0.0
- **Uso**: Renderizado de React en el navegador

### Lenguaje

#### TypeScript 5.7.2
- **Tipo**: Superset de JavaScript con tipado estático
- **Uso**: Todo el código frontend está en TypeScript
- **Configuración**: `tsconfig.json`, `tsconfig.app.json`

### Build Tool

#### Vite 6.3.1
- **Tipo**: Build tool y dev server
- **Características**:
  - Hot Module Replacement (HMR) rápido
  - Build optimizado
  - Soporte TypeScript nativo
- **Configuración**: `vite.config.ts`

**Documentación**: https://vitejs.dev/

### UI Library

#### Material-UI (MUI) 5.15.12
- **Componentes**: Componentes Material Design
- **Características**:
  - Diseño consistente
  - Temas personalizables
  - Responsive design
- **Módulos**:
  - `@mui/material` - Componentes principales
  - `@mui/icons-material` - Iconos
  - `@mui/x-data-grid` - Tablas avanzadas
  - `@mui/x-date-pickers` - Selectores de fecha

**Documentación**: https://mui.com/

#### Emotion
- **Versiones**:
  - `@emotion/react` 11.14.0
  - `@emotion/styled` 11.14.0
- **Uso**: CSS-in-JS para MUI
- **Características**: Estilos dinámicos, temas

### Routing

#### React Router DOM 7.5.3
- **Uso**: Navegación y routing
- **Características**:
  - Rutas declarativas
  - Protected routes
  - Navegación programática
- **Configuración**: En `App.tsx`

**Documentación**: https://reactrouter.com/

### Gestión de Estado

#### Zustand 5.0.4
- **Uso**: Estado global (autenticación)
- **Características**:
  - API simple
  - Sin boilerplate
  - TypeScript friendly
- **Persistencia**: `zustand-persist` 0.4.0

**Documentación**: https://github.com/pmndrs/zustand

#### TanStack Query (React Query) 5.75.1
- **Uso**: Estado del servidor, cache, sincronización
- **Características**:
  - Cache automático
  - Refetch automático
  - Optimistic updates
  - Paginación y filtros

**Documentación**: https://tanstack.com/query/latest

### HTTP Client

#### Axios 1.9.0
- **Uso**: Peticiones HTTP al backend
- **Características**:
  - Interceptores
  - Transformación de datos
  - Manejo de errores
- **Configuración**: `services/api.ts`

**Documentación**: https://axios-http.com/

### Manejo de Fechas

#### date-fns 2.30.0
- **Uso**: Manipulación y formateo de fechas
- **Integración**: `@date-io/date-fns` 2.17.0 para MUI Date Pickers

**Documentación**: https://date-fns.org/

### Generación de PDFs

#### jsPDF 3.0.1
- **Uso**: Generación básica de PDFs
- **Características**: Creación programática de PDFs

#### @react-pdf/renderer 4.3.0
- **Uso**: Generación de PDFs con componentes React
- **Características**: PDFs declarativos con React

**Documentación**: https://react-pdf.org/

### Utilidades

#### SweetAlert2 11.21.2
- **Uso**: Alertas y diálogos modernos
- **Características**: Reemplazo de `alert()` y `confirm()`

**Documentación**: https://sweetalert2.github.io/

#### react-color 2.19.3
- **Uso**: Selector de colores
- **Tipos**: `@types/react-color` 3.0.13

#### Dexie 4.0.11
- **Uso**: IndexedDB wrapper (si se usa para almacenamiento local)
- **Características**: Base de datos local en el navegador

#### workbox-window 7.3.0
- **Uso**: Service Workers (PWA)
- **Características**: Caché offline, notificaciones push

### Testing (Disponible)

#### Jest 29.7.0
- **Uso**: Framework de testing
- **Configuración**: `jest.config.js`

#### Testing Library
- **Versiones**:
  - `@testing-library/react` 16.3.0
  - `@testing-library/jest-dom` 6.6.3
  - `@testing-library/user-event` 14.6.1
- **Uso**: Testing de componentes React

#### ts-jest 29.3.2
- **Uso**: Transpilación TypeScript para Jest

### Herramientas de Desarrollo

#### ESLint 9.22.0
- **Configuración**: `eslint.config.js`
- **Plugins**:
  - `eslint-plugin-react-hooks` 5.2.0
  - `eslint-plugin-react-refresh` 0.4.19
  - `typescript-eslint` 8.26.1

#### TypeScript ESLint 8.26.1
- **Uso**: Linting de TypeScript

---

## 🗄️ Base de Datos

### MongoDB 7.8.7
- **Tipo**: Base de datos NoSQL
- **Modelo**: Documentos (BSON)
- **Características**:
  - Escalabilidad horizontal
  - Schemas flexibles
  - Agregaciones potentes
  - Índices

### Mongoose 10.1.0
- **Tipo**: ODM (Object Document Mapper)
- **Características**:
  - Schemas con validación
  - Middleware (pre/post hooks)
  - Queries tipadas
  - Populate para relaciones

---

## 🐳 Contenedores

### Docker
- **Uso**: Contenedorización de MongoDB
- **Configuración**: `docker-compose.yml`
- **Imagen**: `mongo:latest`

---

## 📦 Gestión de Paquetes

### npm
- **Versión**: Incluida con Node.js
- **Uso**: Gestión de dependencias
- **Archivos**: `package.json`, `package-lock.json`

---

## 🔧 Herramientas Adicionales

### Git
- **Uso**: Control de versiones
- **Plataforma**: GitHub/GitLab (asumido)

### Scripts de Instalación
- **Windows**: `install.ps1` (PowerShell)
- **Inicio**: `start-app.bat` (Windows)

---

## 📊 Versiones y Compatibilidad

### Node.js
- **Mínimo**: 18.0.0
- **Recomendado**: 18.x LTS o superior

### npm
- **Mínimo**: 9.0.0
- **Recomendado**: Última versión estable

### MongoDB
- **Mínimo**: 6.0.0
- **Recomendado**: 7.x o superior

---

## 🔄 Actualizaciones y Mantenimiento

### Dependencias Principales

**Backend**:
- NestJS: Seguir versiones LTS
- MongoDB/Mongoose: Actualizar con cuidado (verificar breaking changes)
- JWT: Mantener actualizado por seguridad

**Frontend**:
- React: Seguir versiones estables
- MUI: Actualizar para nuevas características
- Vite: Mantener actualizado para mejor rendimiento

### Comandos de Actualización

```bash
# Backend
cd backend
npm outdated
npm update

# Frontend
cd frontend
npm outdated
npm update
```

### Verificación de Seguridad

```bash
# Backend
cd backend
npm audit
npm audit fix

# Frontend
cd frontend
npm audit
npm audit fix
```

---

## 📚 Recursos y Documentación

### Documentación Oficial

- **NestJS**: https://docs.nestjs.com/
- **React**: https://react.dev/
- **MongoDB**: https://www.mongodb.com/docs/
- **Mongoose**: https://mongoosejs.com/
- **Material-UI**: https://mui.com/
- **Vite**: https://vitejs.dev/
- **TanStack Query**: https://tanstack.com/query/latest

### Comunidades

- **NestJS Discord**: https://discord.gg/nestjs
- **React Community**: https://react.dev/community
- **Stack Overflow**: Tags `nestjs`, `react`, `mongodb`

---

## 🎯 Decisiones Técnicas

### ¿Por qué NestJS?
- Arquitectura modular escalable
- TypeScript nativo
- Ecosistema maduro
- Documentación excelente

### ¿Por qué React?
- Ecosistema amplio
- Gran comunidad
- Componentes reutilizables
- Rendimiento optimizado

### ¿Por qué MongoDB?
- Flexibilidad de schemas
- Escalabilidad horizontal
- JSON nativo
- Agregaciones potentes

### ¿Por qué Material-UI?
- Diseño consistente
- Componentes completos
- Temas personalizables
- Documentación excelente

---

*Última actualización: Enero 2025*







