@echo off
title Gestión Terranova - Iniciando...
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

REM Verificar si los puertos están ocupados
netstat -ano | findstr :3000 > nul
set BACKEND_RUNNING=%errorlevel%

netstat -ano | findstr :5173 > nul
set FRONTEND_RUNNING=%errorlevel%

REM Iniciar backend si no está corriendo
if %BACKEND_RUNNING% neq 0 (
    echo Iniciando el backend...
    start "" /min powershell -WindowStyle Hidden -Command "cd 'backend'; npm run start:dev"
) else (
    echo Backend ya en ejecución.
)

REM Iniciar frontend si no está corriendo
if %FRONTEND_RUNNING% neq 0 (
    echo Iniciando el frontend...
    start "" /min powershell -WindowStyle Hidden -Command "cd 'frontend'; npm run dev"
) else (
    echo Frontend ya en ejecución.
)

REM Esperar unos segundos para que ambos servicios arranquen
echo Esperando a que los servicios estén disponibles...
timeout /t 10 /nobreak > nul

REM Verificar si el backend está respondiendo
curl -s http://localhost:3000/api/health > nul
if %errorlevel% neq 0 (
    echo Error: El backend no responde en http://localhost:3000/api/health
    pause
    exit /b 1
)

REM Verificar si el frontend está respondiendo
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo Error: El frontend no responde en http://localhost:5173
    pause
    exit /b 1
)

REM Abrir navegador
echo Abriendo la aplicación en el navegador...
start http://localhost:5173

echo.
echo ✅ La aplicación está iniciada y lista para usar.
exit /b 0
