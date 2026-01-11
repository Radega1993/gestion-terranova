# Gestión Terranova v1.0

**Versión 1.0 - Finalizada** ✅

Sistema de gestión integral para asociaciones de vecinos, desarrollado con NestJS y React. Plataforma SaaS completa para la administración de socios, inventario, ventas, reservas, invitaciones, recaudaciones y más.

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

### Tabla de Permisos por Módulo

| Módulo | ADMINISTRADOR | JUNTA | TRABAJADOR | TIENDA |
|--------|---------------|-------|------------|--------|
| Autenticación | ✅ | ✅ | ✅ | ✅ |
| Usuarios | ✅ | ✅ | ❌ | ❌ |
| Socios | ✅ | ✅ | ❌ | ✅ (solo lectura) |
| Inventario | ✅ | ❌ | ✅ | ✅ |
| Ventas (TPV) | ✅ | ❌ | ✅ | ✅ |
| Gestión de Ventas | ✅ | ❌ | ❌ | ❌ |
| Cambios | ✅ | ✅ | ✅ | ✅ |
| Devoluciones | ✅ | ✅ | ❌ | ❌ |
| Deudas | ✅ | ✅ | ✅ | ✅ |
| Recaudaciones | ✅ | ✅ | ✅ | ✅ |
| Reservas | ✅ | ✅ | ✅ | ✅ |
| Invitaciones | ✅ | ✅ | ✅ | ✅ |
| Trabajadores | ✅ | ❌ | ❌ | ✅ (solo sus trabajadores) |
| Tiendas | ✅ | ❌ | ❌ | ❌ |
| Configuración | ✅ | ✅ | ❌ | ❌ |
| Productos Retirados | ✅ | ❌ | ❌ | ❌ |

## 📦 Módulos Implementados (v1.0)

### 1. Autenticación y Autorización
- ✅ Sistema de login/registro con JWT
- ✅ Control de acceso por roles (ADMINISTRADOR, JUNTA, TRABAJADOR, TIENDA)
- ✅ Guards y decorators para protección de rutas
- ✅ Persistencia de sesión
- ✅ Logout automático cuando el token expira
- ✅ Redirección automática al login en caso de token inválido

### 2. Gestión de Usuarios
- ✅ CRUD completo de usuarios
- ✅ Gestión de roles y permisos
- ✅ Control de estado activo/inactivo
- ✅ Script de creación de administrador inicial

### 3. Gestión de Socios
- ✅ CRUD completo de socios
- ✅ Gestión de asociados (miembros familiares)
- ✅ Información completa: datos personales, dirección, contacto, banco
- ✅ Control de estado activo/inactivo
- ✅ Fotos de socios
- ✅ Importación masiva desde Excel
- ✅ Historial de actividad

### 4. Inventario
- ✅ Gestión completa de productos
- ✅ Control de stock en tiempo real
- ✅ Importación/exportación Excel
- ✅ Categorización de productos
- ✅ Precios de compra y venta
- ✅ Registro de productos retirados (solo ADMINISTRADOR)
- ✅ Motivos de retiro: Caducado, Dañado, Defectuoso, Roto, Contaminado, Otro
- ✅ Informes de productos retirados con resúmenes por motivo y producto

### 5. Ventas (TPV)
- ✅ Crear ventas con múltiples productos
- ✅ Selección de socio o asociado
- ✅ Pagos parciales y múltiples pagos
- ✅ Métodos de pago: Efectivo y Tarjeta
- ✅ Cálculo automático de cambio
- ✅ Trazabilidad de trabajador/usuario que realiza la venta
- ✅ Historial completo de ventas
- ✅ **Panel de Gestión de Ventas** (solo ADMINISTRADOR): Edición completa de ventas existentes
  - Modificación de productos y cantidades
  - Edición de montos pagados y métodos de pago
  - Cambio de usuario/trabajador que realizó la venta
  - Actualización automática de inventario al modificar productos

### 6. Cambios de Productos
- ✅ Cambio de productos en ventas del día actual
- ✅ Gestión de diferencias de precio (cobrar más o devolver)
- ✅ Procesamiento de pagos/devoluciones con selección de método y trabajador
- ✅ Actualización automática de inventario (devuelve producto original, quita producto nuevo)
- ✅ Estados de pago: PENDIENTE, PAGADO, DEVUELTO
- ✅ Historial completo de cambios por venta
- ✅ Integración con recaudaciones para reflejar movimientos de caja

### 7. Devoluciones
- ✅ Registro de devoluciones a socios (solo ADMINISTRADOR y JUNTA)
- ✅ Selección de venta y productos a devolver
- ✅ Métodos de devolución: Efectivo y Tarjeta
- ✅ Estados: PENDIENTE, PROCESADA, CANCELADA
- ✅ Procesamiento de devoluciones (actualiza inventario)
- ✅ Historial completo de devoluciones

### 8. Deudas
- ✅ Visualización de deudas pendientes por socio
- ✅ Pagos parciales y acumulados
- ✅ Selección de trabajador al pagar deudas (rol TIENDA)
- ✅ Manejo correcto de pagos múltiples con múltiples trabajadores
- ✅ Cálculo automático de cambio cuando se paga más de lo debido
- ✅ Generación de PDFs de deudas

### 9. Recaudaciones
- ✅ Resumen de Socios: Información detallada de pagos por socio con productos y días de consumo
- ✅ Resumen de Productos: Productos vendidos con acumulado y desglose por trabajador
- ✅ Resumen Detallado: Desglose diario con ventas, reservas y cambios
- ✅ Filtros por método de pago (efectivo, tarjeta, todos)
- ✅ Filtros por usuario y/o trabajador (selección múltiple para TIENDA, ADMINISTRADOR, JUNTA)
- ✅ Trazabilidad completa de quién realizó cada pago (trabajador o usuario)
- ✅ Manejo correcto de pagos múltiples en ventas (muestra índice y acumulado)
- ✅ Inclusión de cambios en recaudaciones con signo correcto (positivo para cobros, negativo para devoluciones)
- ✅ Cambios PENDIENTE no se cuentan en el total hasta ser procesados
- ✅ Redondeo automático a 2 decimales en todos los montos
- ✅ Sincronización correcta entre tabla y PDFs (mismo cálculo de totales)
- ✅ Generación de múltiples tipos de PDFs (Detallado, General, Socios)

### 10. Reservas
- ✅ Crear, modificar y cancelar reservas
- ✅ Gestión de servicios y suplementos
- ✅ Visualización de disponibilidad en calendario
- ✅ Pagos parciales y liquidación de reservas
- ✅ Gestión de normativa editable para reservas
- ✅ Normativa incluida automáticamente en PDFs de reserva
- ✅ Editor de texto con formato (negrita, cursiva, subrayado)
- ✅ Generación de PDFs de reserva con normativa

### 11. Invitaciones
- ✅ Cada socio dispone de 12 invitaciones por año
- ✅ Registro de uso de invitaciones
- ✅ Registro del usuario que crea cada invitación
- ✅ Selector de trabajador para usuarios TIENDA
- ✅ Visualización del usuario registrador en la lista de invitaciones
- ✅ Historial completo de invitaciones y modificaciones
- ✅ Generación de PDFs de invitaciones

### 12. Trabajadores
- ✅ Gestión de trabajadores asociados a tiendas
- ✅ Control de estado activo/inactivo
- ✅ Asignación de trabajadores a usuarios TIENDA
- ✅ Trazabilidad de acciones realizadas por trabajadores

### 13. Tiendas
- ✅ Gestión de tiendas (solo ADMINISTRADOR)
- ✅ Asignación de usuarios TIENDA a tiendas
- ✅ Gestión de trabajadores por tienda

### 14. Configuración
- ✅ Gestión de normativa de reservas
- ✅ Editor de texto con formato
- ✅ Persistencia de configuración

## 🎯 Características Principales

- ✅ **Interfaz moderna y responsive** con Material-UI
- ✅ **Navbar optimizado** con menús desplegables para mejor usabilidad en pantallas pequeñas
- ✅ **Dashboard completo** con acceso a todos los módulos según el rol del usuario
- ✅ **Autenticación segura** con JWT
- ✅ **Control de acceso granular** por roles
- ✅ **Gestión completa de inventario** con control de stock
- ✅ **Sistema TPV completo** para ventas
- ✅ **Panel de Gestión de Ventas** para administradores con edición completa
- ✅ **Gestión de reservas** con calendario y disponibilidad
- ✅ **Sistema de invitaciones** con límite anual por socio
- ✅ **Recaudaciones avanzadas** con múltiples filtros y reportes
- ✅ **Generación de PDFs** para múltiples módulos
- ✅ **Importación/exportación Excel** para inventario y socios
- ✅ **Trazabilidad completa** de todas las operaciones

## 📊 Estado del Proyecto

**Versión 1.0 - Finalizada** ✅

Esta versión incluye todas las funcionalidades principales del sistema de gestión para asociaciones de vecinos. El sistema está completamente funcional y listo para uso en producción.

### Próximas Versiones

Las mejoras y nuevas funcionalidades se implementarán en futuras versiones según las necesidades del proyecto.

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 📅 Historial de Versiones

### v1.0 (Finalizada)
- ✅ Implementación completa de todos los módulos principales
- ✅ Sistema de autenticación y autorización
- ✅ Gestión completa de socios, inventario, ventas, reservas e invitaciones
- ✅ Módulos de cambios y devoluciones
- ✅ Sistema avanzado de recaudaciones con múltiples filtros y reportes
- ✅ Generación de PDFs para múltiples módulos
- ✅ Trazabilidad completa de operaciones
- ✅ Optimización y limpieza de código

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