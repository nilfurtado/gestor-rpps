@echo off
REM Servidor Next.js - Executa na inicialização do Windows
REM Coloque este arquivo em: C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup

cd /d "C:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"

REM Tenta fazer build antes de rodar
echo [%date% %time%] Iniciando servidor Next.js...
npm run build

if errorlevel 1 (
    echo [%date% %time%] Build falhou! Tentando rodar mesmo assim...
)

REM Inicia o servidor na porta 3001, acessível via 0.0.0.0
npm run dev -- --hostname 0.0.0.0 --port 3001

REM Se o servidor cair, reinicia após 10 segundos
ping localhost -n 11 > nul
goto :start

:start
echo [%date% %time%] Reiniciando servidor...
goto start
