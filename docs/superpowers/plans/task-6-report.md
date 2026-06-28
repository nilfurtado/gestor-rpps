## Status: DONE

## Commits Criados
- [91900c5] feat: adicionar POST para criar tipos customizados

## Tests Executados
- Compilação TypeScript: PASS (sem erros novos introduzidos; erros pré-existentes em outros arquivos não relacionados à task)
- Testes manuais: Não executados em runtime (app não iniciado), mas lógica validada por inspeção:
  - Auth check: retorna 403 se session nula ou role != "GESTOR"
  - Validation: retorna 400 se `body.nome` ausente, não-string ou vazio
  - Success: chama `createTipoFolhaCustomizado(body.nome, body.descricao)` e retorna 201
  - Error handling: captura erros do service (ex: duplicados) e retorna 400 com mensagem

## Concerns
- Existem ~30 erros TypeScript pré-existentes no projeto (backup routes, relatórios, permissions, dashboard, status-badge). Nenhum deles está relacionado ao arquivo modificado `src/app/api/tipos-folha/route.ts`.
