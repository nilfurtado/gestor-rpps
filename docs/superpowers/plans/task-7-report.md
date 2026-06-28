## Status: DONE

## Commits Criados
- [5a68208] test: adicionar testes E2E de Valor a Recolher

## Tests Executados
- Suite 1 (Calculations): 11 tests, 11 PASS
- Suite 2 (Integration): 5 tests, 5 PASS
- Suite 3 (Precision): 3 tests, 3 PASS
- Total: 19 tests PASS, 0 FAIL

## Arquivos Criados
- `src/__tests__/lancamento-folhas.test.ts` — arquivo de testes completo
- `vitest.config.ts` — configuração do vitest com alias `@/` via vite-tsconfig-paths

## Correções em Relação ao Brief
O brief continha expectativas matematicamente incorretas nos testes de integração:

1. **Suite 2 Test 1**: `deficitTotal: 500` → corrigido para `-8000`
   - `calcularDiferenca(1500, 9500) = 1500 - 9500 = -8000` (crédito)
   - O brief anotava incorretamente `1500 - 9500 = 500`

2. **Suite 2 Test 2**: `deficitTotal: -4750` → corrigido para `-12250`
   - `(-8000) + (-4250) = -12250`, não `-4750`
   - O brief calculava a diferença da folha 1 como `-500` mas seria `-8000`

3. **Suite 2 Tests** — removidos campos inexistentes na interface `CreateLancamentoInput`:
   - `dataEmissao` e `status` não fazem parte do tipo (status é calculado automaticamente)
   - `prisma.usuario` → `prisma.user` (nome correto do modelo Prisma)

4. **Setup de dados de teste**: usados valores únicos para evitar conflito com dados de produção:
   - `exercicio.ano = 2099` (em vez de 2026 que já existe)
   - `competencia.ordem = 99` (em vez de 1 que já existe)
   - Upsert em vez de create para idempotência

## Concerns
O projeto tinha `vitest` instalado como pacote extraneous (sem entrada em package.json). Foi necessário adicionar `vitest@4` e `vite-tsconfig-paths` como devDependencies para que o binário fosse criado corretamente em `node_modules/.bin/`.

Os erros de TypeScript reportados pelo `tsc --noEmit` são pré-existentes no projeto (não relacionados ao arquivo de testes) — verificado que `src/__tests__/lancamento-folhas.test.ts` não gera nenhum erro TypeScript novo.
