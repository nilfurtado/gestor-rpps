# ⚠️ PRODUCTION DEPLOYMENT CHECKLIST

**Status:** MVP Local concluído ✅
**Data Criação:** 2026-06-17
**Próxima Ação:** Preparar para deploy Vercel/Prisma

---

## Antes de fazer Deploy no Vercel:

### 1. ❌ Sistema de Backup (CRÍTICO)
**Problema:** Filesystem efêmero no Vercel - backups são perdidos
- [ ] Migrar de `./backups/` local para S3 AWS ou Supabase Storage
- [ ] Atualizar `src/lib/backup-service.ts` para usar storage em nuvem
- [ ] Adicionar credenciais S3 em `.env.production`

**Arquivo afetado:** `src/lib/backup-service.ts`

---

### 2. ❌ Banco de Dados SQLite (CRÍTICO)
**Problema:** Vercel não persiste SQLite entre deploys
- [ ] Migrar de SQLite (`prisma/dev.db`) para PostgreSQL
- [ ] Executar `prisma migrate deploy` em produção
- [ ] Configurar `DATABASE_URL` no Vercel

**Arquivos afetados:** 
- `prisma/schema.prisma`
- `.env.production`
- `.env.local` (Vercel)

---

### 3. ❌ Logs em Memória (IMPORTANTE)
**Problema:** Logs perdidos a cada restart/deploy
- [ ] Criar tabela `SystemLog` no Prisma
- [ ] Atualizar `src/lib/logs-service.ts` para persistir em DB
- [ ] Migrar logs históricos (ou começar do zero)

**Arquivos afetados:**
- `prisma/schema.prisma`
- `src/lib/logs-service.ts`

---

### 4. ⚠️ NextAuth Configuration
**Status:** Já configurado, mas verificar
- [ ] Verificar `NEXTAUTH_SECRET` está em `.env.production`
- [ ] Verificar `NEXTAUTH_URL` está correto (domínio do Vercel)
- [ ] Testar login após deploy

**Arquivo:** `src/lib/auth.ts`

---

### 5. 📝 Variáveis de Ambiente Necessárias

Adicionar no Vercel (Project Settings > Environment Variables):

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_SECRET=<gerar: openssl rand -base64 32>
NEXTAUTH_URL=https://seu-dominio.vercel.app
AWS_ACCESS_KEY_ID=xxx (se usar S3)
AWS_SECRET_ACCESS_KEY=xxx (se usar S3)
AWS_S3_BUCKET=seu-bucket (se usar S3)
```

---

### 6. 🧪 Testes Pré-Deploy

```bash
# Testar build production localmente
npm run build

# Testar start production
npm start

# Verificar APIs
curl http://localhost:3000/api/admin/backup
```

---

## Ordem Recomendada:

1. **Preparar PostgreSQL** (criar BD em Vercel/Railway/Supabase)
2. **Migrar schema Prisma** para PostgreSQL
3. **Implementar persistência de logs** em Prisma
4. **Configurar S3 ou storage em nuvem** para backups
5. **Atualizar `.env.production`**
6. **Deploy no Vercel**
7. **Testar `/admin/backup`** em produção

---

## Documentação Relacionada:

- `docs/features/BACKUP_LOGS.md` - Features implementadas
- `src/lib/backup-service.ts` - Serviço de backup (precisa migrar para S3)
- `src/lib/logs-service.ts` - Serviço de logs (precisa persistência)

---

## Status por Módulo:

| Módulo | MVP Local | Pronto Produção |
|--------|-----------|-----------------|
| APIs | ✅ | ❌ (DB) |
| Componentes | ✅ | ✅ |
| Autenticação | ✅ | ⚠️ (env vars) |
| Backup Service | ✅ | ❌ (storage) |
| Logs Service | ✅ | ❌ (persistência) |

---

**Última Atualização:** 2026-06-17
**Próximo Responsável:** [Seu nome]
**Estimativa:** 2-3 dias de trabalho para production-ready
