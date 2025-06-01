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

REM Verificar si los puertos ya están ocupados
netstat -ano | findstr :3000 > nul
set BACKEND_RUNNING=%errorlevel%

netstat -ano | findstr :5173 > nul
set FRONTEND_RUNNING=%errorlevel%

REM Si ambos están ocupados, solo abrir navegador
if %BACKEND_RUNNING% equ 0 if %FRONTEND_RUNNING% equ 0 (
    echo Backend y Frontend ya están en ejecución.
    echo Abriendo la aplicación en el navegador...
    start http://localhost:5173
    exit /b 0
)

REM Iniciar backend si no está corriendo
if %BACKEND_RUNNING% neq 0 (
    echo Iniciando el backend...
    start "" /min powershell -WindowStyle Hidden -Command "cd 'backend'; npm run start:dev"
    timeout /t 10 /nobreak > nul
)

REM Iniciar frontend si no está corriendo
if %FRONTEND_RUNNING% neq 0 (
    echo Iniciando el frontend...
    start "" /min powershell -WindowStyle Hidden -Command "cd 'frontend'; npm run dev"
    timeout /t 10 /nobreak > nul
)

REM Verificar si el frontend está respondiendo antes de abrir el navegador
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo Error: El frontend no está respondiendo. Verifique los logs.
    pause
    exit /b 1
)

REM Abrir la aplicación en el navegador
echo Abriendo la aplicación en el navegador...
start http://localhost:5173

echo.
echo La aplicación está iniciada y lista para usar.
exit /b 0
