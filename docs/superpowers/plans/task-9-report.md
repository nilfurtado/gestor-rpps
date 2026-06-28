# Task 9 Report: Carregar Folhas Salvas no Edit Flow

## Status: CONCLUÍDO ✅

## O que foi implementado

### 1. GET endpoint implementado — `/api/lancamentos/[id]/route.ts`

O endpoint GET existia mas retornava `null` (stub não implementado). Foi implementado para:
- Autenticar via `auth()`
- Buscar o lançamento via Prisma incluindo `folhas { tipoFolha }`
- Retornar `{ data: lancamento }` com as folhas aninhadas

### 2. Novo `useEffect` adicionado — `lancamento-form.tsx`

Adicionado após o `useEffect` de `fetchTipos`, com dependência em `[initial?.id, tiposFolha]`:
- Só executa quando `initial?.id` existe (edit mode)
- Aguarda `tiposFolha.length > 0` antes de executar (evita race condition com `fetchTipos`)
- Faz `fetch(/api/lancamentos/{id})` e extrai o array `folhas`
- Mapeia para o formato do form usando `formatCurrency`
- Chama `setFolhas()` sobrescrevendo o estado inicial (apenas Base)

## Race condition resolvida

A dependência `tiposFolha` no segundo `useEffect` garante que ele só rode APÓS `fetchTipos` setar os tipos, evitando que `fetchTipos` sobrescreva as folhas carregadas do banco.

## TypeScript

`npx tsc --noEmit` — zero erros novos introduzidos. Erros pré-existentes em outros arquivos permanecem inalterados.

## Commit

```
feat: carregar folhas salvas no edit flow
```

Hash: `c42c2ba`

## Arquivos modificados

- `src/app/api/lancamentos/[id]/route.ts` — GET implementado com folhas
- `src/app/(dashboard)/lancamentos/novo/lancamento-form.tsx` — novo useEffect para carregar folhas no edit mode
