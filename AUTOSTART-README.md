# Autostart - Servidor 3001 Permanente

## Setup Rápido (Recomendado)

1. **Abra PowerShell como Administrador**
   - Pressione `Win + X`
   - Selecione "Terminal Windows (Admin)" ou "Windows PowerShell (Admin)"

2. **Execute o script de setup:**
   ```powershell
   cd "C:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"
   powershell -ExecutionPolicy Bypass -File setup-autostart.ps1
   ```

3. **Reinicie o Windows**
   - O servidor iniciará automaticamente na porta **3001**

---

## Acesso ao Servidor

### Local (Sua máquina)
```
http://localhost:3001
```

### Rede Local (De outro computador)
```
http://<SEU_IP_LOCAL>:3001
```

**Para descobrir seu IP local:**
```powershell
ipconfig
```
Procure por **"IPv4 Address"** (ex: 192.168.1.100)

---

## Gerenciar o Servidor

### Ver Status
- Abra **Agendador de Tarefas** (Task Scheduler)
- Procure por: `GestorApp-Server`

### Parar o Servidor Temporariamente
```powershell
taskkill /IM node.exe /F
```

### Desabilitar Autostart
1. Abra **Agendador de Tarefas**
2. Procure por `GestorApp-Server`
3. Clique direito > **Desabilitar**

### Remover Autostart Completamente
1. Abra **Agendador de Tarefas**
2. Procure por `GestorApp-Server`
3. Clique direito > **Excluir**

---

## Manual (Sem Autostart)

Se preferir rodar manualmente:

```powershell
cd "C:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"
npm run dev -- --hostname 0.0.0.0 --port 3001
```

---

## Troubleshooting

### Porta 3001 já está em uso
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Servidor não inicia após reboot
- Verifique se o Node.js está instalado: `node --version`
- Verifique permissões da pasta do projeto
- Execute novamente o script de setup

### Erro de permissão no PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Logs

O servidor exibe logs diretos no console. Para salvar em arquivo:

```powershell
cd "C:\Users\SUPORTE INFOR\Documents\claude\PROJETOS\gestor"
npm run dev -- --hostname 0.0.0.0 --port 3001 > server.log 2>&1
```
