$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$url = "http://10.10.98.48:3002"
$projectPath = "c:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"

try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -ErrorAction Stop
    Write-Host "[$timestamp] ✅ Servidor OK"
} catch {
    Write-Host "[$timestamp] ❌ Servidor DOWN - reiniciando..."

    # Kill all Node processes
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

    Start-Sleep -Seconds 2

    # Start the server in background
    Push-Location $projectPath
    Start-Process -FilePath npm -ArgumentList "run", "dev" -WindowStyle Hidden
    Pop-Location

    Write-Host "[$timestamp] ✅ Servidor reiniciado"
}
