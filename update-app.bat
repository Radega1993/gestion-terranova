@echo off
title Gestión Terranova - Actualizando...
echo Actualizando Gestión Terranova desde GitHub...
echo ============================================

powershell -ExecutionPolicy Bypass -File "%~dp0update-app.ps1"
set EXIT_CODE=%errorlevel%

if %EXIT_CODE% neq 0 (
    echo.
    echo Error durante la actualizacion. Codigo: %EXIT_CODE%
    pause
    exit /b %EXIT_CODE%
)

echo.
echo Actualizacion finalizada.
timeout /t 5 > nul
exit /b 0
