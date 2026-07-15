# Actualiza Gestión Terranova desde GitHub preservando BD, .env y uploads.
param(
    [switch]$Force,
    [switch]$SkipBackup,
    [switch]$DryRun,
    [switch]$RunMigrations
)

$ErrorActionPreference = "Stop"

$GITHUB_REPO = "Radega1993/gestion-terranova"
$GITHUB_ZIP_URL = "https://github.com/$GITHUB_REPO/archive/refs/heads/main.zip"
$GITHUB_COMMITS_URL = "https://api.github.com/repos/$GITHUB_REPO/commits/main"
$GITHUB_WEB_URL = "https://github.com/$GITHUB_REPO"
$HEALTH_URL = "http://localhost:3000/api/health"
$HEALTH_FALLBACK_URL = "http://localhost:3000/api"

$RootPath = if ($PSScriptRoot) { $PSScriptRoot } else { Get-Location }
Set-Location $RootPath

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Test-IsAdministrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-InternetConnection {
    param([string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 20
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    }
    catch {
        return $false
    }
}

function Get-NodeMajorVersion {
    try {
        $versionText = (node -v).TrimStart('v')
        return [int]($versionText.Split('.')[0])
    }
    catch {
        return 0
    }
}

function Get-LocalUpdateVersion {
    $versionFile = Join-Path $RootPath ".update-version"
    if (-not (Test-Path $versionFile)) {
        return $null
    }

    $content = Get-Content $versionFile -ErrorAction SilentlyContinue
    foreach ($line in $content) {
        if ($line -match '^\s*commit\s*=\s*(.+)$') {
            return $matches[1].Trim()
        }
    }

    return $null
}

function Set-LocalUpdateVersion {
    param(
        [string]$CommitSha,
        [string]$CommitDate
    )

    $versionFile = Join-Path $RootPath ".update-version"
    @(
        "commit=$CommitSha"
        "updated_at=$CommitDate"
        "source=github"
    ) | Set-Content -Path $versionFile -Encoding UTF8
}

function Get-MongoDbUri {
    $envPath = Join-Path $RootPath "backend\.env"
    if (-not (Test-Path $envPath)) {
        return "mongodb://127.0.0.1:27017/terranova"
    }

    foreach ($line in Get-Content $envPath) {
        if ($line -match '^\s*MONGODB_URI\s*=\s*(.+)$') {
            return $matches[1].Trim()
        }
    }

    return "mongodb://127.0.0.1:27017/terranova"
}

function Get-LatestGitHubCommit {
    $headers = @{
        "User-Agent" = "Gestion-Terranova-Updater"
        "Accept"     = "application/vnd.github+json"
    }

    $response = Invoke-RestMethod -Uri $GITHUB_COMMITS_URL -Headers $headers -TimeoutSec 30
    return @{
        Sha  = $response.sha
        Date = $response.commit.committer.date
    }
}

function Invoke-StopApp {
    $stopScript = Join-Path $RootPath "stop-app.ps1"
    if (-not (Test-Path $stopScript)) {
        throw "No se encontró stop-app.ps1 en $RootPath"
    }

    & $stopScript
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudieron detener todos los procesos de la aplicación."
    }
}

function New-Backup {
    param([string]$BackupDir)

    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

    $mongoUri = Get-MongoDbUri
    $dbBackupDir = Join-Path $BackupDir "mongodb"
    New-Item -ItemType Directory -Path $dbBackupDir -Force | Out-Null

    Write-Info "Copia de seguridad de MongoDB ($mongoUri)..."
    $mongodump = Get-Command mongodump -ErrorAction SilentlyContinue
    if ($mongodump) {
        & mongodump --uri="$mongoUri" --out="$dbBackupDir"
        if ($LASTEXITCODE -ne 0) {
            throw "mongodump falló con código $LASTEXITCODE"
        }
    }
    else {
        Write-Warn "mongodump no está en PATH. Se omitió el backup de la base de datos."
    }

    $configBackupDir = Join-Path $BackupDir "config"
    New-Item -ItemType Directory -Path $configBackupDir -Force | Out-Null

    $backendEnv = Join-Path $RootPath "backend\.env"
    $frontendEnv = Join-Path $RootPath "frontend\.env"
    if (Test-Path $backendEnv) {
        Copy-Item $backendEnv (Join-Path $configBackupDir "backend.env") -Force
    }
    if (Test-Path $frontendEnv) {
        Copy-Item $frontendEnv (Join-Path $configBackupDir "frontend.env") -Force
    }

    $uploadsPath = Join-Path $RootPath "backend\uploads"
    if (Test-Path $uploadsPath) {
        Write-Info "Copiando backend\uploads..."
        Copy-Item $uploadsPath (Join-Path $BackupDir "uploads") -Recurse -Force
    }

    $codeBackupDir = Join-Path $BackupDir "code"
    Write-Info "Copiando código actual para rollback..."
    $robocopyArgs = @(
        $RootPath,
        $codeBackupDir,
        "/E",
        "/XD", "node_modules", "backups", ".git",
        "/XF", ".update-version",
        "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS"
    )
    $null = & robocopy @robocopyArgs
    if ($LASTEXITCODE -ge 8) {
        throw "No se pudo crear la copia de seguridad del código (robocopy $LASTEXITCODE)"
    }
}

function Test-GitWorkingTreeClean {
    $status = git status --porcelain 2>$null
    return [string]::IsNullOrWhiteSpace($status)
}

function Update-FromGit {
    Write-Info "Actualizando con Git..."
    if (-not (Test-GitWorkingTreeClean)) {
        throw "Hay cambios locales sin commitear. Abortando actualización Git para evitar pérdida de datos."
    }

    git fetch origin
    if ($LASTEXITCODE -ne 0) {
        throw "git fetch origin falló."
    }

    git reset --hard origin/main
    if ($LASTEXITCODE -ne 0) {
        throw "git reset --hard origin/main falló."
    }
}

function Update-FromZip {
    param([string]$CommitSha)

    $tempRoot = Join-Path $env:TEMP "gestion-terranova-update-$CommitSha"
    $zipPath = Join-Path $tempRoot "main.zip"
    $extractPath = Join-Path $tempRoot "extracted"

    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null

    Write-Info "Descargando $GITHUB_ZIP_URL ..."
    Invoke-WebRequest -Uri $GITHUB_ZIP_URL -OutFile $zipPath -UseBasicParsing -TimeoutSec 300

    Write-Info "Extrayendo paquete..."
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

    $sourcePath = Join-Path $extractPath "gestion-terranova-main"
    if (-not (Test-Path $sourcePath)) {
        $folders = Get-ChildItem -Path $extractPath -Directory
        if ($folders.Count -eq 1) {
            $sourcePath = $folders[0].FullName
        }
        else {
            throw "No se encontró la carpeta extraída del ZIP de GitHub."
        }
    }

    Write-Info "Copiando archivos nuevos (preservando .env, uploads y backups)..."
    $robocopyArgs = @(
        $sourcePath,
        $RootPath,
        "/E",
        "/XD", "node_modules", "uploads", "backups", ".git", "dist",
        "/XF", ".env", ".update-version",
        "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS"
    )
    $null = & robocopy @robocopyArgs
    if ($LASTEXITCODE -ge 8) {
        throw "Error al copiar archivos actualizados (robocopy $LASTEXITCODE)"
    }

    if (Test-Path $tempRoot) {
        Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Remove-BuildArtifacts {
    $paths = @(
        (Join-Path $RootPath "backend\dist"),
        (Join-Path $RootPath "frontend\dist")
    )

    foreach ($path in $paths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
            Write-Info "Eliminado $path"
        }
    }
}

function Install-Dependencies {
    $projects = @("backend", "frontend")
    foreach ($project in $projects) {
        Write-Info "npm install --legacy-peer-deps en $project..."
        Push-Location (Join-Path $RootPath $project)
        try {
            npm install --legacy-peer-deps
            if ($LASTEXITCODE -ne 0) {
                throw "npm install falló en $project"
            }
        }
        finally {
            Pop-Location
        }
    }
}

function Get-MigrationCommands {
    $migrationsFile = Join-Path $RootPath "MIGRATIONS.md"
    if (-not (Test-Path $migrationsFile)) {
        return @()
    }

    $commands = New-Object System.Collections.Generic.List[string]
    foreach ($line in Get-Content $migrationsFile) {
        if ($line -match '^\s*-\s*Comando:\s*(.+)$') {
            $commands.Add($matches[1].Trim())
        }
    }

    return $commands.ToArray()
}

function Invoke-DocumentedMigrations {
    $commands = Get-MigrationCommands
    if ($commands.Count -eq 0) {
        Write-Info "No hay migraciones documentadas en MIGRATIONS.md"
        return
    }

    Write-Warn "Migraciones documentadas encontradas:"
    foreach ($command in $commands) {
        Write-Host "  - $command"
    }

    Push-Location (Join-Path $RootPath "backend")
    try {
        foreach ($command in $commands) {
            if ($command -notmatch '^npm run ') {
                Write-Warn "Comando omitido (formato no soportado): $command"
                continue
            }

            $scriptName = $command.Substring('npm run '.Length).Trim()
            if (-not $RunMigrations) {
                Write-Warn "Omitido (use -RunMigrations para ejecutar): npm run $scriptName"
                continue
            }

            $confirmation = Read-Host "¿Ejecutar 'npm run $scriptName'? (s/N)"
            if ($confirmation -notin @('s', 'S', 'y', 'Y')) {
                Write-Info "Migración omitida: $scriptName"
                continue
            }

            Write-Info "Ejecutando npm run $scriptName ..."
            npm run $scriptName
            if ($LASTEXITCODE -ne 0) {
                throw "La migración '$scriptName' falló."
            }
        }
    }
    finally {
        Pop-Location
    }
}

function Test-BackendHealth {
    param(
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        foreach ($url in @($HEALTH_URL, $HEALTH_FALLBACK_URL)) {
            try {
                $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
                if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                    return $true
                }
            }
            catch {
                # Seguir esperando
            }
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

function Start-TemporaryBackend {
    $backendPath = Join-Path $RootPath "backend"
    $process = Start-Process `
        -FilePath "powershell" `
        -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"Set-Location '$backendPath'; npm run start:dev`"" `
        -PassThru `
        -WindowStyle Hidden

    return $process
}

function Restore-FromBackup {
    param([string]$BackupDir)

    Write-Warn "Restaurando código desde backup..."
    $codeBackupDir = Join-Path $BackupDir "code"
    if (-not (Test-Path $codeBackupDir)) {
        throw "No existe copia de código en $codeBackupDir"
    }

    $robocopyArgs = @(
        $codeBackupDir,
        $RootPath,
        "/E",
        "/XD", "node_modules", "backups",
        "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS"
    )
    $null = & robocopy @robocopyArgs
    if ($LASTEXITCODE -ge 8) {
        throw "Error al restaurar el backup (robocopy $LASTEXITCODE)"
    }
}

$backupDir = $null
$backendProcess = $null

try {
    Write-Host "Gestión Terranova - Actualización desde GitHub" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green

    Write-Step "Comprobaciones iniciales"
    if (-not (Test-IsAdministrator)) {
        throw "Ejecute este script como administrador (clic derecho > Ejecutar como administrador)."
    }

    if (-not (Test-Path (Join-Path $RootPath "start-app.bat"))) {
        throw "No se encontró start-app.bat. Ejecute el script desde la raíz de la instalación."
    }

    $nodeMajor = Get-NodeMajorVersion
    if ($nodeMajor -lt 18) {
        throw "Se requiere Node.js 18 o superior. Versión detectada: $(node -v)"
    }

    if (-not (Test-InternetConnection -Url $GITHUB_WEB_URL)) {
        throw "No hay conexión a GitHub. Conecte internet e inténtelo de nuevo."
    }

    $latestCommit = Get-LatestGitHubCommit
    $localCommit = Get-LocalUpdateVersion
    Write-Info "Commit remoto: $($latestCommit.Sha)"
    Write-Info "Commit local:  $(if ($localCommit) { $localCommit } else { '(sin registrar)' })"

    if (-not $Force -and $localCommit -and $localCommit -eq $latestCommit.Sha) {
        Write-Success "La aplicación ya está en la última versión ($($latestCommit.Sha.Substring(0, 7)))."
        exit 0
    }

    if ($DryRun) {
        Write-Success "[DryRun] Se actualizaría a $($latestCommit.Sha.Substring(0, 7)) sin aplicar cambios."
        exit 0
    }

    Write-Step "Deteniendo aplicación"
    Invoke-StopApp

    if (-not $SkipBackup) {
        Write-Step "Creando copia de seguridad"
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $backupDir = Join-Path $RootPath "backups\$timestamp"
        New-Backup -BackupDir $backupDir
        Write-Success "Backup creado en $backupDir"
    }
    else {
        Write-Warn "SkipBackup activo: no se creó copia de seguridad."
    }

    Write-Step "Actualizando código"
    $gitDir = Join-Path $RootPath ".git"
    if (Test-Path $gitDir) {
        Update-FromGit
    }
    else {
        Update-FromZip -CommitSha $latestCommit.Sha
    }

    Remove-BuildArtifacts

    Write-Step "Instalando dependencias"
    Install-Dependencies

    Write-Step "Migraciones documentadas"
    Invoke-DocumentedMigrations

    Write-Step "Verificando backend"
    $backendProcess = Start-TemporaryBackend
    if (-not (Test-BackendHealth)) {
        throw "El backend no respondió tras la actualización."
    }
    Write-Success "Backend verificado correctamente."

    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    & (Join-Path $RootPath "stop-app.ps1") -Quiet | Out-Null

    Set-LocalUpdateVersion -CommitSha $latestCommit.Sha -CommitDate $latestCommit.Date

    Write-Step "Reiniciando aplicación"
    Start-Process -FilePath (Join-Path $RootPath "start-app.bat") -WorkingDirectory $RootPath

    Write-Success "Actualización completada correctamente."
    Write-Info "Commit instalado: $($latestCommit.Sha.Substring(0, 7))"
    if ($backupDir) {
        Write-Info "Backup disponible en: $backupDir"
    }
    if (-not $RunMigrations -and (Get-MigrationCommands).Count -gt 0) {
        Write-Warn "Revise MIGRATIONS.md y ejecute migraciones si corresponde: update-app.ps1 -RunMigrations"
    }
    exit 0
}
catch {
    Write-Err $_.Exception.Message

    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }

    if ($backupDir -and (Test-Path $backupDir)) {
        try {
            Restore-FromBackup -BackupDir $backupDir
            Write-Warn "Código restaurado desde $backupDir"
            Write-Info "La base de datos no se modificó durante la actualización. El dump sigue en el backup."
        }
        catch {
            Write-Err "No se pudo restaurar automáticamente: $($_.Exception.Message)"
            Write-Warn "Restaure manualmente desde $backupDir"
        }
    }

    exit 1
}
