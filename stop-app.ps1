# Detiene el backend (puerto 3000) y el frontend (puerto 5173) de Gestión Terranova.
param(
    [int[]]$Ports = @(3000, 5173),
    [switch]$Quiet
)

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    if (-not $Quiet) {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Get-ProcessIdsOnPort {
    param([int]$Port)

    $pids = New-Object System.Collections.Generic.HashSet[int]
    $pattern = ":$Port\s"

    $netstatOutput = netstat -ano 2>$null
    if (-not $netstatOutput) {
        return @()
    }

    foreach ($line in $netstatOutput) {
        if ($line -notmatch $pattern) {
            continue
        }

        $parts = ($line -split '\s+') | Where-Object { $_ -ne '' }
        if ($parts.Count -lt 1) {
            continue
        }

        $processId = $parts[-1]
        if ($processId -match '^\d+$' -and [int]$processId -gt 0) {
            [void]$pids.Add([int]$processId)
        }
    }

    return @($pids)
}

function Stop-ProcessOnPort {
    param([int]$Port)

    $processIds = Get-ProcessIdsOnPort -Port $Port
    if ($processIds.Count -eq 0) {
        Write-Log "Puerto $Port libre." "DarkGray"
        return
    }

    foreach ($processId in $processIds) {
        try {
            $process = Get-Process -Id $processId -ErrorAction Stop
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Log "Proceso detenido en puerto ${Port}: $($process.ProcessName) (PID $processId)" "Yellow"
        }
        catch {
            Write-Log "No se pudo detener PID $processId en puerto $Port : $($_.Exception.Message)" "Red"
        }
    }
}

Write-Log "Deteniendo Gestión Terranova..." "Cyan"

foreach ($port in $Ports) {
    Stop-ProcessOnPort -Port $port
}

Start-Sleep -Seconds 2

foreach ($port in $Ports) {
    $remaining = Get-ProcessIdsOnPort -Port $port
    if ($remaining.Count -gt 0) {
        Write-Log "Advertencia: el puerto $port sigue en uso (PIDs: $($remaining -join ', '))" "Red"
        exit 1
    }
}

Write-Log "Backend y frontend detenidos correctamente." "Green"
exit 0
