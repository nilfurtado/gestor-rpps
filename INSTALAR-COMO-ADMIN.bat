@echo off
echo Solicitando permissao de Administrador...
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File ""%~dp0setup-sanprev.ps1""' -Verb RunAs -Wait"
pause
