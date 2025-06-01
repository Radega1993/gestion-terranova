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

REM Si ambos están corriendo, solo abrir el navegador
if %BACKEND_RUNNING% equ 0 if %FRONTEND_RUNNING% equ 0 (
    echo Backend y Frontend ya están en ejecución.
    echo Abriendo la aplicación en el navegador...
    timeout /t 2 > nul
    start "" "http://localhost:5173"
    exit /b 0
)

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

REM Esperar a que el backend esté disponible
echo Esperando al backend...
set RETRIES=0
:wait_backend
curl -s http://localhost:3000/api/health > nul
if %errorlevel% equ 0 (
    goto wait_frontend
)
set /a RETRIES+=1
if %RETRIES% GEQ 20 (
    echo ❌ Error: El backend no responde después de varios intentos.
    pause
    exit /b 1
)
timeout /t 1 /nobreak > nul
goto wait_backend

:wait_frontend
echo Esperando al frontend...
set RETRIES=0
:wait_frontend_loop
curl -s http://localhost:5173 > nul
if %errorlevel% equ 0 (
    goto open_browser
)
set /a RETRIES+=1
if %RETRIES% GEQ 20 (
    echo ❌ Error: El frontend no responde después de varios intentos.
    pause
    exit /b 1
)
timeout /t 1 /nobreak > nul
goto wait_frontend_loop

:open_browser
echo Abriendo la aplicación en el navegador...
start "" "http://localhost:5173"

echo.
echo ✅ La aplicación está iniciada y lista para usar.
exit /b 0
