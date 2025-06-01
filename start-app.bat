@echo off
echo Iniciando Gestión Terranova...
echo ============================

REM Verificar si MongoDB está en ejecución
sc query MongoDB > nul
if %errorlevel% neq 0 (
    echo Iniciando MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        echo Error al iniciar MongoDB. Por favor, verifique la instalación.
        pause
        exit /b 1
    )
)

REM Verificar si el directorio de uploads existe
if not exist "backend\uploads" (
    echo Creando directorio de uploads...
    mkdir "backend\uploads"
)

REM Verificar si los puertos están disponibles
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo Error: El puerto 3000 ya está en uso. Por favor, cierre la aplicación que lo esté usando.
    pause
    exit /b 1
)

netstat -ano | findstr :5173 > nul
if %errorlevel% equ 0 (
    echo Error: El puerto 5173 ya está en uso. Por favor, cierre la aplicación que lo esté usando.
    pause
    exit /b 1
)

REM Iniciar el backend
echo Iniciando el backend...
start cmd /k "cd backend && npm run start:dev"

REM Esperar a que el backend esté listo
echo Esperando a que el backend esté listo...
timeout /t 15 /nobreak

REM Verificar si el backend está respondiendo
curl -s http://localhost:3000/api/health > nul
if %errorlevel% neq 0 (
    echo Error: El backend no está respondiendo. Por favor, verifique los logs.
    pause
    exit /b 1
)

REM Iniciar el frontend
echo Iniciando el frontend...
start cmd /k "cd frontend && npm run dev"

REM Esperar a que el frontend esté listo
echo Esperando a que el frontend esté listo...
timeout /t 15 /nobreak

REM Verificar si el frontend está respondiendo
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo Error: El frontend no está respondiendo. Por favor, verifique los logs.
    pause
    exit /b 1
)

REM Abrir el navegador
echo Abriendo la aplicación en el navegador...
start http://localhost:5173

echo.
echo La aplicación está iniciada y lista para usar.
echo Mantenga esta ventana abierta mientras use la aplicación.
echo.
pause 