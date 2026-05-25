# ============================================================
# Santana Previdencia - Script de Instalacao e Configuracao
# EXECUTE COMO ADMINISTRADOR (duplo clique em INSTALAR-COMO-ADMIN.bat)
# ============================================================

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Santana Previdencia - Instalacao" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Diretorio: $projectDir" -ForegroundColor Gray
Write-Host ""

# ─── 1. Verificar privilegios de admin ───────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "[ERRO] Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "       Use o arquivo INSTALAR-COMO-ADMIN.bat" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "[OK] Executando como Administrador" -ForegroundColor Green

# ─── 2. Verificar Node.js ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[1/6] Verificando Node.js..." -ForegroundColor Yellow

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "       Instale o Node.js em: https://nodejs.org (versao 20 ou superior)" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green

# Verificar versao minima (20+)
$major = [int]($nodeVersion -replace 'v(\d+)\..*','$1')
if ($major -lt 20) {
    Write-Host "[AVISO] Node.js $nodeVersion detectado. Recomendado: v20 ou superior." -ForegroundColor Yellow
}

# ─── 3. Instalar dependencias ────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/6] Instalando dependencias (npm install)..." -ForegroundColor Yellow

npm install --prefer-offline 2>&1 | Tee-Object -Variable npmOut | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependencias:" -ForegroundColor Red
    Write-Host ($npmOut | Select-Object -Last 20 | Out-String) -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green

# ─── 4. Detectar IP da rede ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Detectando IP da rede local..." -ForegroundColor Yellow

$networkIP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notmatch "^127\." -and
        $_.IPAddress -notmatch "^169\.254\." -and
        $_.PrefixOrigin -ne "WellKnown" -and
        $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL|VMware"
    } | Sort-Object -Property PrefixLength -Descending |
    Select-Object -First 1).IPAddress

if (-not $networkIP) { $networkIP = "localhost" }
Write-Host "[OK] IP da rede: $networkIP" -ForegroundColor Green

# ─── 5. Configurar .env ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Configurando arquivo .env..." -ForegroundColor Yellow

$secret = [System.Convert]::ToBase64String(
    [System.Text.Encoding]::UTF8.GetBytes(
        [System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()
    )
)

$envContent = @"
DB_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="$secret"
NEXTAUTH_URL="http://${networkIP}:3000"
AUTH_TRUST_HOST=true
SEED_ADMIN_EMAIL="gestor"
SEED_ADMIN_PASSWORD="admin123"
"@

Set-Content -Path "$projectDir\.env" -Value $envContent -Encoding UTF8
Write-Host "[OK] .env configurado" -ForegroundColor Green
Write-Host "     DATABASE_URL: file:./dev.db (SQLite)" -ForegroundColor Gray
Write-Host "     NEXTAUTH_URL: http://${networkIP}:3000" -ForegroundColor Gray

# ─── 6. Criar/atualizar banco de dados ───────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Criando banco de dados (SQLite)..." -ForegroundColor Yellow

$env:DATABASE_URL = "file:./dev.db"

# Gerar Prisma Client
$genResult = node_modules\.bin\prisma.cmd generate 2>&1
if ($LASTEXITCODE -ne 0) {
    $errMsg = $genResult | Out-String
    if ($errMsg -match "EPERM|locked|rename") {
        Write-Host "[AVISO] Prisma Client ja esta em uso (servidor ativo). Continuando..." -ForegroundColor Yellow
    } else {
        Write-Host "[AVISO] prisma generate: $($genResult | Select-Object -Last 2 | Out-String)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[OK] Prisma Client gerado" -ForegroundColor Green
}

# Criar/atualizar tabelas
$pushResult = node_modules\.bin\prisma.cmd db push --accept-data-loss 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Tabelas criadas/atualizadas no banco SQLite" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Falha ao criar tabelas:" -ForegroundColor Red
    Write-Host ($pushResult | Out-String) -ForegroundColor Red
    pause
    exit 1
}

# Popular dados iniciais
Write-Host "     Populando dados iniciais (orgaos, competencias, exercicios, usuario gestor)..." -ForegroundColor Gray
$seedResult = node_modules\.bin\tsx.cmd prisma/seed.ts 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dados iniciais inseridos" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Seed retornou aviso (pode ser normal se dados ja existem):" -ForegroundColor Yellow
    Write-Host ($seedResult | Select-Object -Last 5 | Out-String) -ForegroundColor Gray
}

# ─── 7. Liberar porta no Firewall ────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Liberando porta 3000 no Firewall do Windows..." -ForegroundColor Yellow

netsh advfirewall firewall delete rule name="SantanaPrevidencia-3000" 2>&1 | Out-Null
netsh advfirewall firewall add rule `
    name="SantanaPrevidencia-3000" `
    dir=in action=allow protocol=TCP localport=3000 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Porta 3000 liberada no firewall" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Nao foi possivel configurar o firewall automaticamente." -ForegroundColor Yellow
    Write-Host "        Libere manualmente: Painel de Controle > Firewall > Porta 3000 TCP" -ForegroundColor Gray
}

# ─── Resumo ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Acesso local:    http://localhost:3000" -ForegroundColor White
Write-Host "  Acesso na rede:  http://${networkIP}:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Credenciais de acesso:" -ForegroundColor Yellow
Write-Host "  Login: gestor" -ForegroundColor White
Write-Host "  Senha: admin123" -ForegroundColor White
Write-Host ""
Write-Host "  Para iniciar o sistema:" -ForegroundColor Yellow
Write-Host "  - Duplo clique em INICIAR-SANPREV.bat" -ForegroundColor White
Write-Host ""

$resp = Read-Host "Deseja iniciar o servidor agora? (S/N)"
if ($resp -match "^[Ss]") {
    Write-Host ""
    Write-Host "Iniciando servidor em http://${networkIP}:3000 ..." -ForegroundColor Green
    Write-Host "Pressione Ctrl+C para encerrar" -ForegroundColor Gray
    Write-Host ""
    node_modules\.bin\next.cmd dev --hostname 0.0.0.0
}
