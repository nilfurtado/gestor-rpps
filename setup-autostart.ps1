# Setup automático do servidor para rodar na inicialização do Windows
# Execute como Administrador: powershell -ExecutionPolicy Bypass -File setup-autostart.ps1

# Caminho do diretório do projeto
$projectDir = "C:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"
$scriptPath = "$projectDir\run-server.bat"
$taskName = "GestorApp-Server"
$taskDescription = "Servidor Next.js porta 3001 - Gestor RPPS"

Write-Host "=== Setup Autostart - Servidor Next.js ===" -ForegroundColor Green
Write-Host ""

# Verificar se está rodando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERRO: Este script deve ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique direito em PowerShell > Executar como Administrador" -ForegroundColor Yellow
    exit 1
}

# 1. Criar pasta Startup se não existir
$startupDir = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Write-Host "✓ Pasta Startup: $startupDir" -ForegroundColor Cyan

# 2. Copiar script batch para Startup
try {
    Copy-Item -Path $scriptPath -Destination $startupDir -Force -ErrorAction Stop
    Write-Host "✓ Script copiado para Startup" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao copiar script: $_" -ForegroundColor Red
    exit 1
}

# 3. Criar task no Agendador de Tarefas
Write-Host ""
Write-Host "Criando tarefa no Agendador de Tarefas..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction `
    -Execute "$projectDir\run-server.bat" `
    -WorkingDirectory $projectDir

$trigger = New-ScheduledTaskTrigger `
    -AtStartup

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description $taskDescription `
        -Force `
        -ErrorAction Stop | Out-Null

    Write-Host "✓ Tarefa '$taskName' criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "✗ Erro ao criar tarefa: $_" -ForegroundColor Red
    exit 1
}

# 4. Criar arquivo informativo
$infoFile = "$projectDir\SERVER-STATUS.txt"
$info = @"
=== SERVIDOR NEXT.JS - AUTOSTART CONFIGURADO ===

Servidor: http://localhost:3001
Rede Local: http://<SEU_IP_LOCAL>:3001

Para descobrir o IP local, abra PowerShell e execute:
  ipconfig

Procure por "IPv4 Address" sob "Ethernet" ou "Wi-Fi"

COMO PARAR O SERVIDOR:
- Abra Agendador de Tarefas
- Procure por "$taskName"
- Clique direito > Desabilitar

COMO REMOVER AUTOSTART:
- Abra Agendador de Tarefas
- Procure por "$taskName"
- Clique direito > Excluir

LOGS DO SERVIDOR:
- Verifique a porta 3001 em: http://localhost:3001

REINICIAR AGORA:
- Abra PowerShell como Administrador
- Execute: Restart-Computer -Force

Configurado em: $(Get-Date)
"@

$info | Out-File -FilePath $infoFile -Encoding UTF8 -Force
Write-Host "✓ Arquivo informativo criado: SERVER-STATUS.txt" -ForegroundColor Green

# 5. Descobrir IP local e exibir
Write-Host ""
Write-Host "=== INFORMAÇÕES DE ACESSO ===" -ForegroundColor Green

try {
    $ipConfig = ipconfig
    $ipMatch = [regex]::Matches($ipConfig, "IPv4[\s\w\.]+:\s+([\d\.]+)")

    if ($ipMatch.Count -gt 0) {
        $localIPs = @()
        foreach ($match in $ipMatch) {
            $ip = $match.Groups[1].Value
            if ($ip -notlike "169.254.*" -and $ip -ne "127.0.0.1") {
                $localIPs += $ip
            }
        }

        Write-Host "IP Local: " -NoNewline
        foreach ($ip in $localIPs) {
            Write-Host "http://$ip`:3001" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Não foi possível detectar IP local automaticamente" -ForegroundColor Yellow
    Write-Host "Execute 'ipconfig' no PowerShell para verificar" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== PRÓXIMOS PASSOS ===" -ForegroundColor Green
Write-Host "1. Reinicie o Windows (ou execute a tarefa manualmente)"
Write-Host "2. Acesse http://localhost:3001 ou http://<seu_ip>:3001" -ForegroundColor Cyan
Write-Host "3. Pronto! Servidor rodará automaticamente na inicialização" -ForegroundColor Green

Write-Host ""
Write-Host "Configuração concluída com sucesso!" -ForegroundColor Green
