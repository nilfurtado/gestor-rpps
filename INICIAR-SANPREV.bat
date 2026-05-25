@echo off
title Santana Previdencia - Sistema de Gestao
cd /d "%~dp0"

echo.
echo =============================================
echo   Santana Previdencia - Sistema de Gestao
echo =============================================
echo.

:: Detectar IP da rede local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0"') do (
    set NETWORK_IP=%%a
    goto :found_ip
)
:found_ip
set NETWORK_IP=%NETWORK_IP: =%

echo   Acesso local:    http://localhost:3001
if defined NETWORK_IP (
    echo   Acesso na rede:  http://%NETWORK_IP%:3001
)
echo.
echo   Credenciais padrao:
echo   Login: gestor
echo   Senha: admin123
echo.
echo   Aguarde o servidor iniciar...
echo   Pressione Ctrl+C para encerrar
echo.

node_modules\.bin\next.cmd dev --hostname 0.0.0.0 --port 3001
pause
