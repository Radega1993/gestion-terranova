# Script de instalación para Gestión Terranova
Write-Host "Instalador de Gestión Terranova" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Verificar si Node.js está instalado
$nodeVersion = node -v
if (-not $?) {
    Write-Host "Instalando Node.js..." -ForegroundColor Yellow
    # Descargar e instalar Node.js
    $nodeInstaller = "node-v18.18.0-x64.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.18.0/$nodeInstaller" -OutFile $nodeInstaller
    Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet" -Wait
    Remove-Item $nodeInstaller
}

# Verificar si MongoDB está instalado
$mongodbService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if (-not $mongodbService) {
    Write-Host "Instalando MongoDB..." -ForegroundColor Yellow
    # Descargar e instalar MongoDB
    $mongodbInstaller = "mongodb-windows-x86_64-6.0.12-signed.msi"
    Invoke-WebRequest -Uri "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.12-signed.msi" -OutFile $mongodbInstaller
    Start-Process msiexec.exe -ArgumentList "/i $mongodbInstaller /quiet" -Wait
    Remove-Item $mongodbInstaller
}

# Crear directorio de datos de MongoDB si no existe
$mongodbDataPath = "C:\data\db"
if (-not (Test-Path $mongodbDataPath)) {
    New-Item -ItemType Directory -Path $mongodbDataPath -Force
}

# Crear directorio de uploads si no existe
$uploadsPath = "backend\uploads"
if (-not (Test-Path $uploadsPath)) {
    New-Item -ItemType Directory -Path $uploadsPath -Force
}

# Instalar dependencias del backend
Write-Host "Instalando dependencias del backend..." -ForegroundColor Yellow
Set-Location backend
npm install
Set-Location ..

# Instalar dependencias del frontend
Write-Host "Instalando dependencias del frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..

# Crear archivo de configuración del backend
$backendEnv = @"
# Configuración del servidor
PORT=3000
MONGODB_URI=mongodb://localhost:27017/terranova
JWT_SECRET=terranova_secret_key_2024
JWT_EXPIRATION=24h

# Configuración de CORS
FRONTEND_URL=http://localhost:5173

# Configuración de la base de datos
DB_NAME=terranova
DB_HOST=localhost
DB_PORT=27017

# Configuración de seguridad
BCRYPT_SALT_ROUNDS=10

# Configuración de archivos
UPLOADS_DIR=uploads
MAX_FILE_SIZE=5242880
"@
Set-Content -Path "backend\.env" -Value $backendEnv

# Crear archivo de configuración del frontend
$frontendEnv = @"
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Gestión Terranova
VITE_APP_VERSION=1.0.0
"@
Set-Content -Path "frontend\.env" -Value $frontendEnv

Write-Host "`nInstalación completada!" -ForegroundColor Green
Write-Host "Para iniciar la aplicación, ejecute 'start-app.bat'" -ForegroundColor Green 