# 💾 Sistema de Backup do Banco de Dados

## 📋 Visão Geral

O sistema SANPREV agora possui backup automático do banco de dados SQLite.

**Localização:** `/backups/dev.db.backup.YYYY-MM-DD.sqlite`  
**Retenção:** Últimos 30 backups  
**Tamanho atual:** ~0.14 MB

---

## 🚀 Uso Manual

### Fazer Backup Agora

```bash
npm run backup
```

**Output esperado:**
```
✅ Backup criado: dev.db.backup.2026-06-07.sqlite (0.14 MB)
```

---

### Restaurar de um Backup

```bash
# Restaurar backup mais recente
npm run restore

# Restaurar backup específico (data)
npm run restore 2026-06-07

# Listar backups disponíveis
ls backups/
```

**O script faz:**
1. ✅ Lista backups disponíveis
2. ✅ Cria backup de segurança do banco atual (BEFORE-RESTORE)
3. ✅ Restaura dados do backup selecionado
4. ✅ Mostra como reverter se necessário

---

## ⏰ Automatizar Backups

### Linux/macOS (Cron)

Editar crontab:
```bash
crontab -e
```

Adicionar (backup diário às 02:00):
```bash
0 2 * * * cd /home/user/Documents/claude/PROJETOS/gestor && npm run backup >> /var/log/sanprev-backup.log 2>&1
```

### Windows (Task Scheduler)

1. Abrir **Task Scheduler**
2. Criar nova tarefa agendada:
   - **Ação:** `Iniciar um programa`
   - **Programa:** `C:\Program Files\nodejs\node.exe`
   - **Argumentos:** `C:\path\to\gestor\scripts\backup-database.js`
   - **Executar:** Diariamente às 02:00

---

## 📂 Estrutura de Backups

```
backups/
├── dev.db.backup.2026-06-07.sqlite    (0.14 MB)
├── dev.db.backup.2026-06-06.sqlite    (0.14 MB)
└── dev.db.backup.BEFORE-RESTORE.2026-06-07.sqlite  (segurança)
```

**Política:**
- ✅ Máximo 30 backups
- ✅ Antigos são deletados automaticamente
- ✅ Nomeados com data (YYYY-MM-DD)

---

## 🔒 Segurança

### Backup de Segurança Antes de Restaurar

Ao restaurar, o script cria automaticamente:
```
dev.db.backup.BEFORE-RESTORE.YYYY-MM-DD.sqlite
```

Permite reverter a restauração se necessário:
```bash
npm run restore BEFORE-RESTORE.2026-06-07
```

---

## 📊 Checklist de Backup

### Antes de Produção (Importante!)

- [ ] Testar restauração do backup
- [ ] Verificar se diretório `/backups/` tem espaço em disco
- [ ] Configurar cron job ou Task Scheduler
- [ ] Documentar localização de backups
- [ ] Considerar backup em nuvem (S3, Google Drive)

### Manutenção Mensal

- [ ] Verificar tamanho dos backups
- [ ] Testar restauração de um backup antigo
- [ ] Documentar qualquer incidente

---

## 🆘 Recuperação de Emergência

Se o banco ficar corrompido:

```bash
# 1. Ver backups disponíveis
ls -lh backups/

# 2. Restaurar backup mais recente
npm run restore

# 3. Reiniciar servidor
npm run dev
```

---

## 📝 Logs de Backup

Verifique logs após cada backup:

```bash
# Verificar último backup
ls -lht backups/ | head -1

# Contar total de backups
ls backups/ | wc -l
```

---

## 🔗 Referências

- **Script:** `scripts/backup-database.js`
- **Restauração:** `scripts/restore-database.js`
- **NPM Scripts:** `package.json` linhas 11-12
- **Banco:** `prisma/dev.db`

---

**Última atualização:** 2026-06-07  
**Status:** ✅ Sistema de backup operacional
