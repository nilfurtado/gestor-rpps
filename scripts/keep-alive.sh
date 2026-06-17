#!/bin/bash
cd /c/Users/SUPORTE\ INFOR/Documents/claude/PROJETOS/gestor

# Tentar acessar o servidor
if ! curl -s http://10.10.98.48:3002 > /dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Servidor DOWN - reiniciando..."
    pkill -f "node.*next" || true
    sleep 2
    npm run dev > /tmp/gestor-server.log 2>&1 &
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Servidor reiniciado"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Servidor OK"
fi
