# 🚀 TODO: Upgrade Prisma v6 → v7

## Status Atual
- **Versão:** Prisma v6.19.3 (ESTÁVEL)
- **Data:** 2026-06-07
- **Ação:** Nenhuma (não fazer upgrade agora)

---

## Quando For Fazer o Upgrade (FUTURO)

### ✅ Antes de Começar:
- [ ] Revisar `prisma-v7-upgrade-checklist.md` (salvo em memória)
- [ ] Criar branch: `upgrade/prisma-v7`
- [ ] Notificar time de DevOps
- [ ] Ter plano de rollback pronto

### ✅ Desenvolvimento Local:
1. `npm install @prisma/client@7 prisma@7`
2. Criar `prisma/prisma.config.ts`
3. Remover `url = env(...)` de `schema.prisma`
4. `npm run prisma:generate`
5. Testar com dados reais

### ✅ Antes de Deploy em Produção:
```bash
npm cache clean --force
npm install
npm run prisma:generate
npx prisma validate
npm run build
```

### ✅ Deploy em Produção:
```bash
npm cache clean --force
npm install
npm run prisma:generate
npm run prisma:migrate deploy
npm run build
# Restart application
# Monitor logs
```

---

## 🔗 Referência Rápida
- Memória salva: `prisma-v7-upgrade-checklist.md`
- Status atual: v6.19.3 estável ✅
- Não faça upgrade direto em produção ⚠️

---

**Last checked:** 2026-06-07
