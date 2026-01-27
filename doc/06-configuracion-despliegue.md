# Configuración y Despliegue - Gestión Terranova

Guía completa para configurar y desplegar el proyecto.

---

## 📋 Requisitos Previos

### Software Requerido

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (o yarn)
- **MongoDB**: >= 6.0.0
- **Git**: Para clonar el repositorio (opcional)

### Sistema Operativo

- **Desarrollo**: Windows 11, Linux, macOS
- **Producción**: Linux recomendado

### Recursos del Sistema

- **RAM**: Mínimo 4GB (8GB recomendado)
- **Disco**: 2GB de espacio libre
- **Red**: Conexión a Internet para instalación de dependencias

---

## 🔧 Configuración del Backend

### 1. Instalación de Dependencias

```bash
cd backend
npm install
```

### 2. Variables de Entorno

Crear archivo `.env` en `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/gestion-terranova

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRATION=24h

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Configuración de MongoDB

#### Opción A: MongoDB Local

1. Instalar MongoDB desde [mongodb.com](https://www.mongodb.com/try/download/community)
2. Iniciar servicio MongoDB:
   ```bash
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```
3. Verificar conexión:
   ```bash
   mongosh
   ```

#### Opción B: MongoDB con Docker

```bash
docker-compose up -d mongodb
```

Esto iniciará MongoDB en el puerto **27117** (configurado en docker-compose.yml).

Actualizar `MONGODB_URI` en `.env`:
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27117/gestion-terranova?authSource=admin
```

### 4. Scripts de Inicialización

El backend incluye scripts de inicialización:

- `ensure-admin.ts`: Crea usuario administrador inicial si no existe
- `migrate-active-field.ts`: Migración de campos activos

Estos scripts se ejecutan automáticamente al iniciar el servidor.

### 5. Iniciar Backend

#### Desarrollo
```bash
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000`

#### Producción
```bash
npm run build
npm run start:prod
```

### 6. Verificar Backend

- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api (documentación interactiva)
- **Health Check**: http://localhost:3000/api/health (si está implementado)

---

## 🎨 Configuración del Frontend

### 1. Instalación de Dependencias

```bash
cd frontend
npm install
```

### 2. Configuración de API

Editar `frontend/src/config.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

Para producción, cambiar a la URL del backend:

```typescript
export const API_BASE_URL = 'https://api.tu-dominio.com/api';
```

### 3. Iniciar Frontend

#### Desarrollo
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

#### Producción
```bash
npm run build
npm run preview
```

El build se genera en `frontend/dist/`

### 4. Verificar Frontend

- Abrir navegador en: http://localhost:5173
- Debería mostrar la página de login

---

## 🐳 Despliegue con Docker

### Docker Compose Completo

Crear `docker-compose.yml` en la raíz:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: gestion-terranova-mongodb
    restart: always
    ports:
      - "27117:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=admin123
    networks:
      - terranova-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gestion-terranova-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://admin:admin123@mongodb:27017/gestion-terranova?authSource=admin
      - JWT_SECRET=tu_secreto_jwt_produccion
      - JWT_EXPIRATION=24h
      - PORT=3000
      - NODE_ENV=production
      - FRONTEND_URL=http://localhost:5173
    depends_on:
      - mongodb
    networks:
      - terranova-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: gestion-terranova-frontend
    restart: always
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3000/api
    depends_on:
      - backend
    networks:
      - terranova-network

volumes:
  mongodb_data:
    driver: local

networks:
  terranova-network:
    driver: bridge
```

### Dockerfile Backend

Crear `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Dockerfile Frontend

Crear `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Iniciar con Docker Compose

```bash
docker-compose up -d
```

---

## 🚀 Despliegue en Producción

### Opción 1: Servidor Dedicado (Linux)

#### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Instalar Nginx (para servir frontend)
sudo apt install -y nginx

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2
```

#### 2. Configurar Backend

```bash
# Clonar o subir código
cd /var/www
git clone <repo-url> gestion-terranova
cd gestion-terranova/backend

# Instalar dependencias
npm install --production

# Configurar .env
nano .env
# (configurar variables de entorno)

# Compilar
npm run build

# Iniciar con PM2
pm2 start dist/main.js --name "terranova-backend"
pm2 save
pm2 startup
```

#### 3. Configurar Frontend

```bash
cd /var/www/gestion-terranova/frontend

# Instalar dependencias
npm install

# Configurar API URL en config.ts
# Cambiar a URL de producción

# Build
npm run build

# Copiar a Nginx
sudo cp -r dist/* /var/www/html/terranova/
```

#### 4. Configurar Nginx

Crear `/etc/nginx/sites-available/terranova`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/html/terranova;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3000;
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/terranova /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Configurar SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Opción 2: Plataformas Cloud

#### Vercel (Frontend)

1. Conectar repositorio GitHub
2. Configurar build command: `npm run build`
3. Configurar output directory: `dist`
4. Configurar variables de entorno

#### Railway / Render (Backend)

1. Conectar repositorio GitHub
2. Configurar build command: `cd backend && npm install && npm run build`
3. Configurar start command: `cd backend && npm run start:prod`
4. Configurar variables de entorno
5. Conectar MongoDB (MongoDB Atlas recomendado)

#### MongoDB Atlas (Base de Datos)

1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cluster
3. Obtener connection string
4. Configurar IP whitelist
5. Usar connection string en `MONGODB_URI`

---

## 🔐 Seguridad en Producción

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` por uno seguro y único
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Configurar CORS correctamente
- [ ] Validar todas las entradas
- [ ] Implementar rate limiting
- [ ] Configurar firewall
- [ ] Hacer backups regulares de MongoDB
- [ ] Usar variables de entorno para secretos
- [ ] Mantener dependencias actualizadas
- [ ] Implementar logging y monitoreo

### Variables de Entorno Sensibles

Nunca commitear:
- `JWT_SECRET`
- Credenciales de MongoDB
- API keys
- Passwords

Usar servicios como:
- **Vercel**: Variables de entorno en dashboard
- **Railway**: Variables de entorno en dashboard
- **Docker**: Docker secrets o archivos `.env` externos

---

## 📊 Monitoreo y Logs

### PM2 Monitoring

```bash
# Ver logs
pm2 logs terranova-backend

# Monitoreo en tiempo real
pm2 monit

# Reiniciar aplicación
pm2 restart terranova-backend
```

### Logs de Nginx

```bash
# Logs de acceso
sudo tail -f /var/log/nginx/access.log

# Logs de error
sudo tail -f /var/log/nginx/error.log
```

### MongoDB Logs

```bash
# Ver logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

---

## 🔄 Actualización y Mantenimiento

### Actualizar Código

```bash
# Pull últimos cambios
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart terranova-backend

# Frontend
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/www/html/terranova/
```

### Backups de MongoDB

```bash
# Backup manual
mongodump --uri="mongodb://localhost:27017/gestion-terranova" --out=/backup/$(date +%Y%m%d)

# Restaurar backup
mongorestore --uri="mongodb://localhost:27017/gestion-terranova" /backup/20250101
```

### Script de Backup Automático

Crear `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://localhost:27017/gestion-terranova" --out="$BACKUP_DIR/$DATE"
# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +
```

Agregar a crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## 🐛 Solución de Problemas

### Backend no inicia

1. Verificar MongoDB está corriendo
2. Verificar variables de entorno
3. Verificar puerto 3000 disponible
4. Revisar logs: `pm2 logs terranova-backend`

### Frontend no conecta con Backend

1. Verificar `API_BASE_URL` en `config.ts`
2. Verificar CORS en backend
3. Verificar firewall
4. Revisar consola del navegador

### MongoDB no conecta

1. Verificar servicio MongoDB: `sudo systemctl status mongod`
2. Verificar `MONGODB_URI` en `.env`
3. Verificar credenciales
4. Verificar red/firewall

---

## 📝 Checklist de Despliegue

### Pre-despliegue

- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Build exitoso
- [ ] Tests pasando (si existen)
- [ ] Base de datos configurada
- [ ] Usuario administrador creado

### Despliegue

- [ ] Backend iniciado y funcionando
- [ ] Frontend servido correctamente
- [ ] API respondiendo
- [ ] Base de datos conectada
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado correctamente

### Post-despliegue

- [ ] Login funcionando
- [ ] Todas las rutas accesibles
- [ ] Uploads funcionando
- [ ] PDFs generándose correctamente
- [ ] Monitoreo configurado
- [ ] Backups configurados

---

*Última actualización: Enero 2025*











