## Status: DONE

## Commits Criados
- [97dafe4] feat: adicionar cálculos de Valor a Recolher no formulário

## O que foi implementado

### 1. API Route `GET /api/tipos-folha`
- Criada em `src/app/api/tipos-folha/route.ts`
- Delega para `getTiposFolhaAtivos()` do `tipo-folha-service.ts`
- Retorna `{ data: TipoFolhaRow[] }` (padrão do projeto)

### 2. Formulário `lancamento-form.tsx` atualizado
- **Imports adicionados:** `useEffect`, `Badge`, `Plus`, `Trash2`, funções de cálculo do `tipo-folha-service`, `TipoFolhaRow`
- **States adicionados:** `tiposFolha`, `folhas`, `showAddFolha`
- **useMemo adicionados:** `folhasComCalculos` (cálculos por folha), `resumoFolhas` (totalizadores), `tiposDisponiveis` (tipos não usados)
- **useEffect:** busca `/api/tipos-folha` ao montar e inicializa Folha Base
- **Seção "Folhas de Salários"** inserida antes da seção "Valores Legados":
  - Folha Base com fundo azul e badge OBRIGATÓRIA
  - Grid 4 colunas: Valor Folha | Alíquota (readonly) | A Recolher (auto) | Valor Recolhido
  - Indicador de Diferença por folha
  - Folhas opcionais adicionáveis com botão + e removíveis
  - Resumo de totalizadores
- **Payload de submissão** atualizado para incluir array `folhas` quando preenchido

### 3. Cálculo da alíquota
- Usa o valor do campo `aliquota` (editável pelo usuário, já existente)
- Fallback: PATRONAL → 15%, SEGURADO → 10% quando alíquota não preenchida
- Consistente com `lancamento-service.ts` (Tasks 1-4)

## Tests Executados
- Compilação TypeScript: PASS — nenhum erro novo introduzido (erros pré-existentes em outros arquivos não relacionados a esta task)
- Teste manual: Não executado (app não foi rodado durante a task)

## Concerns
- A seção "Valores" original foi renomeada para "Valores Legados" para deixar clara a distinção com a nova seção de Folhas Dinâmicas — o time pode querer renomear ou ocultar essa seção no futuro, uma vez que as folhas dinâmicas passem a ser o modo principal de entrada.
- O `tiposFolhaId` inicial é `0` (placeholder) até a API responder — quando a API retorna, o estado é reinicializado com o `id` real do tipo Base. Isso pode causar um flash de re-render breve, mas é imperceptível na prática.
- A API `/api/tipos-folha` não tem autenticação explícita — está alinhada com o padrão das demais APIs do projeto que protegem via middleware de sessão.
