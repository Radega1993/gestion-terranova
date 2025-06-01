@echo off
title Gestión Terranova - Cargando...
echo Iniciando Gestión Terranova...
echo ============================

REM Verificar si MongoDB está en ejecución
sc query MongoDB > nul
if %errorlevel% neq 0 (
    echo Iniciando MongoDB...
    net start MongoDB
    if %errorlevel% neq 0 (
        msg * "❌ Error al iniciar MongoDB. Verifica la instalación."
        exit /b 1
    )
)

REM Verificar si el directorio de uploads existe
if not exist "backend\uploads" (
    echo Creando directorio de uploads...
    mkdir "backend\uploads"
)

REM Verificar puertos ocupados
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    msg * "❌ Puerto 3000 en uso. Cierra la app que lo ocupa."
    exit /b 1
)

netstat -ano | findstr :5173 > nul
if %errorlevel% equ 0 (
    msg * "❌ Puerto 5173 en uso. Cierra la app que lo ocupa."
    exit /b 1
)

REM Iniciar el backend sin mostrar ventana
echo Iniciando backend...
start "" /min powershell -WindowStyle Hidden -Command "cd 'backend'; npm run start:dev"

REM Esperar backend
timeout /t 10 /nobreak > nul
curl -s http://localhost:3000/api/health > nul
if %errorlevel% neq 0 (
    msg * "❌ El backend no responde. Revisa los logs."
    exit /b 1
)

REM Iniciar frontend sin mostrar ventana
echo Iniciando frontend...
start "" /min powershell -WindowStyle Hidden -Command "cd 'frontend'; npm run dev"

REM Esperar frontend
timeout /t 10 /nobreak > nul
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    msg * "❌ El frontend no responde. Revisa los logs."
    exit /b 1
)

REM Abrir navegador
echo Abriendo la aplicación en el navegador...
start http://localhost:5173

REM Mensaje final
echo.
msg * "✅ Gestión Terranova está lista. Puedes usar la aplicación."
