# Gestión Terranova

Sistema de gestión para asociaciones, desarrollado con NestJS y React.

## 🚀 Tecnologías

- **Frontend**: React + TypeScript
- **Backend**: NestJS + TypeScript
- **Base de Datos**: MongoDB

## 📋 Requisitos

- Node.js >= 18
- MongoDB >= 6.0
- npm o yarn

## 🔧 Instalación

1. Descargue el archivo ZIP del proyecto y extráigalo en una ubicación de su elección.

2. Haga clic derecho en el archivo `install.ps1` y seleccione "Ejecutar con PowerShell como administrador".

3. El script de instalación realizará las siguientes acciones:
   - Verificará e instalará Node.js si es necesario
   - Verificará e instalará MongoDB si es necesario
   - Creará los directorios necesarios
   - Instalará las dependencias del backend y frontend
   - Configurará los archivos de entorno

4. Espere a que la instalación se complete. Esto puede tomar varios minutos.

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
- **TIENDA**: Acceso a ventas, reservas y gestión de trabajadores asociados

## 🆕 Funcionalidades Recientes

### Gestión de Normativa de Reservas
- ✅ Sistema de gestión de normativa editable para reservas
- ✅ Normativa incluida automáticamente en PDFs de reserva
- ✅ Edición de normativa disponible para ADMINISTRADOR y JUNTA
- ✅ Normativa en página separada del PDF para facilitar firma

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## Requisitos del Sistema

- Windows 11
- Conexión a Internet (para la instalación inicial)
- Mínimo 4GB de RAM
- 2GB de espacio libre en disco
- PowerShell 5.1 o superior
- Permisos de administrador

## Iniciar la Aplicación

1. Haga doble clic en el archivo `start-app.bat`
2. El script iniciará:
   - MongoDB (si no está en ejecución)
   - El servidor backend (puerto 3000)
   - El servidor frontend (puerto 5173)
   - Abrirá automáticamente la aplicación en su navegador predeterminado

## Solución de Problemas

### Problemas Comunes

1. **Error al iniciar MongoDB**
   - Verifique que MongoDB esté instalado correctamente
   - Asegúrese de que el servicio MongoDB esté en ejecución
   - Ejecute `net start MongoDB` como administrador

2. **Error de puertos en uso**
   - El backend usa el puerto 3000
   - El frontend usa el puerto 5173
   - Cierre cualquier aplicación que esté usando estos puertos
   - Reinicie su computadora si el problema persiste

3. **Error de conexión a la base de datos**
   - Verifique que MongoDB esté en ejecución
   - Compruebe que el archivo `.env` en la carpeta backend tenga la configuración correcta
   - Asegúrese de que la base de datos `terranova` esté creada

4. **Error al cargar la aplicación en el navegador**
   - Verifique que los puertos 3000 y 5173 estén accesibles
   - Compruebe que no haya un firewall bloqueando las conexiones
   - Intente acceder manualmente a http://localhost:5173

### Verificación de Servicios

Para verificar que todo está funcionando correctamente:

1. Backend: http://localhost:3000/api/health
2. Frontend: http://localhost:5173
3. MongoDB: `mongosh` en la terminal

## Desinstalación

1. Detenga todos los servicios:
   - Cierre las ventanas de terminal del backend y frontend
   - Ejecute `net stop MongoDB` como administrador

2. Elimine los directorios:
   - Backend: `backend`
   - Frontend: `frontend`
   - Datos de MongoDB: `C:\data\db`

3. Desinstale MongoDB desde el Panel de Control

## Soporte

Si encuentra algún problema durante la instalación o el uso de la aplicación, por favor:

1. Verifique los logs en las ventanas de terminal
2. Consulte la sección de Solución de Problemas
3. Contacte al soporte técnico

## Notas Importantes

- Mantenga la ventana de terminal abierta mientras use la aplicación
- No cierre las ventanas de terminal del backend o frontend
- Realice copias de seguridad regulares de la base de datos
- Mantenga actualizado Node.js y MongoDB