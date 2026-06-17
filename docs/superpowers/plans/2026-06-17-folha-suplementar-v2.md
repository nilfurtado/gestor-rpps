# Folha Suplementar - Implementation Plan v2

> **Versão Simplificada:** Campo único de suplementar por lançamento, sem motivos, integrado na página de lançamento.

**Objetivo:** Adicionar campo de valor suplementar na folha de pagamento para lançamentos complementares, com cálculo automático de folhaTotal.

**Regras de Negócio Confirmadas:**
1. ✅ Campo único de suplementar por lançamento (sem motivos)
2. ✅ Campo visível na página de Lançamento (após Folha Base)
3. ✅ FolhaTotal calculado automaticamente: `folhaTotal = folhaBase + folhaSuplementar`
4. ✅ ValorRecolherCalculado automático: `valorRecolherCalculado = folhaTotal × aliquota ÷ 100`
5. ✅ Sem fluxo de aprovação (calcula automaticamente)
6. ✅ Pode editar/deletar (recalcula todos os valores)
7. ✅ Sem auditoria
8. ✅ Backward compatibility (folhas sem suplementar = 0)

**Arquitetura Simplificada:**
1. Adicionar campo `folhaSuplementar: Decimal @default(0)` na tabela `FolhaPrevidenciaria`
2. Atualizar UI de edição de lançamento para mostrar campo suplementar
3. Atualizar cálculos para incluir suplementar automaticamente
4. Atualizar dashboard para mostrar resumo de suplementares

**Tech Stack:**
- Prisma (adicionar campo na tabela existente)
- Next.js (formulário de edição)
- React (campo de entrada)

---

## Global Constraints

- Um campo suplementar por lançamento (simples e direto)
- Atualização de valor recalcula tudo automaticamente
- Sem tabela separada de suplementares
- Sem motivos/categorias
- Sem fluxo de aprovação
- Valor padrão = 0 (backward compatible)
- Suportado para todas as competências

---

## Estrutura de Arquivos

```
prisma/
└── schema.prisma (adicionar folhaSuplementar à FolhaPrevidenciaria)

src/app/(dashboard)/lancamentos/
├── [id]/editar/page.tsx (adicionar campo suplementar)
└── lancamentos-client.tsx (atualizar cálculos na tabela)

src/lib/
└── folha-calculo-service.ts (atualizar cálculos com suplementar)
```

---

## Task 1: Schema Prisma - Adicionar Campo

**Files:**
- Modify: `prisma/schema.prisma`

**Change:**
```prisma
model FolhaPrevidenciaria {
  // ... campos existentes ...
  folhaBase               Decimal?
  folhaSuplementar        Decimal?        @default(0)      // NOVO: Valor suplementar
  // ... resto dos campos ...
}
```

**Steps:**
1. Adicionar campo `folhaSuplementar: Decimal @default(0)` após `folhaBase`
2. Run: `npx prisma migrate dev --name add_folha_suplementar_field`
3. Commit: "prisma: adicionar campo folhaSuplementar na FolhaPrevidenciaria"

---

## Task 2: Atualizar Serviço de Cálculos

**Files:**
- Modify: `src/lib/folha-calculo-service.ts`

**Change:**
```typescript
export async function calcularFolhaTotal(folha: FolhaPrevidenciaria): Promise<{
  folhaBase: number;
  folhaSuplementar: number;
  folhaTotal: number;
  valorRecolherCalculado: number;
}> {
  const folhaBase = Number(folha.folhaBase || 0);
  const folhaSuplementar = Number(folha.folhaSuplementar || 0);
  const folhaTotal = folhaBase + folhaSuplementar;
  
  const valorRecolherCalculado = (folhaTotal * Number(folha.aliquota)) / 100;
  
  return {
    folhaBase,
    folhaSuplementar,
    folhaTotal,
    valorRecolherCalculado,
  };
}
```

**Steps:**
1. Atualizar função para incluir `folhaSuplementar` no cálculo
2. Retornar todos os 4 valores (folhaBase, folhaSuplementar, folhaTotal, valorRecolherCalculado)
3. Testar cálculos com diferentes valores
4. Commit: "lib: atualizar cálculos para incluir folhaSuplementar"

---

## Task 3: Atualizar UI - Editar Lançamento

**Files:**
- Modify: `src/app/(dashboard)/lancamentos/[id]/editar/page.tsx`

**Changes:**
1. Adicionar campo de entrada para `folhaSuplementar`
2. Mostrar `folhaTotal` calculado em tempo real (somente leitura)
3. Mostrar `valorRecolherCalculado` atualizado (somente leitura)
4. Layout: coluna 3 com Folha Base | Folha Suplementar | Folha Total

**Exemplo UI:**
```tsx
<div className="grid grid-cols-3 gap-4">
  {/* Folha Base */}
  <div>
    <Label>Folha Base (R$)*</Label>
    <Input 
      type="number" 
      value={folhaBase}
      disabled
      className="bg-muted"
    />
  </div>
  
  {/* Folha Suplementar - NOVO */}
  <div>
    <Label>Folha Suplementar (R$)</Label>
    <Input 
      type="number" 
      step="0.01"
      value={folhaSuplementar}
      onChange={(e) => setFolhaSuplementar(parseFloat(e.target.value) || 0)}
      placeholder="0,00"
    />
  </div>
  
  {/* Folha Total - CALCULADO */}
  <div>
    <Label>Folha Total (R$)</Label>
    <Input 
      type="number" 
      value={folhaBase + folhaSuplementar}
      disabled
      className="bg-primary/5 font-semibold"
    />
  </div>
</div>

{/* Valor a Recolher Calculado - ATUALIZADO */}
<div>
  <Label>Valor a Recolher Calculado (R$)</Label>
  <Input 
    type="number" 
    value={(folhaBase + folhaSuplementar) * (aliquota / 100)}
    disabled
    className="bg-success/5"
  />
</div>
```

**Steps:**
1. Localizar seção de campos de folha no formulário de edição
2. Adicionar campo `folhaSuplementar` após `folhaBase`
3. Adicionar exibição de `folhaTotal` (readonly)
4. Atualizar `valorRecolherCalculado` para usar folhaTotal
5. Validar que folhaSuplementar ≥ 0
6. Testar edição e salvamento
7. Commit: "ui: adicionar campo folhaSuplementar na edição de lançamento"

---

## Task 4: Atualizar Tabela de Lançamentos

**Files:**
- Modify: `src/app/(dashboard)/lancamentos/lancamentos-client.tsx`

**Changes:**
1. Mostrar coluna `Folha Total` na tabela (calculado)
2. Atualizar lógica de renderização para incluir suplementar nos cálculos

**Steps:**
1. Adicionar coluna à tabela: "Folha Total"
2. Fórmula: folhaBase + folhaSuplementar
3. Testar renderização
4. Commit: "ui: adicionar coluna Folha Total na tabela de lançamentos"

---

## Task 5: Dashboard - Resumo de Suplementares

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Changes:**
1. Adicionar card com:
   - Total de lançamentos com suplementar
   - Valor total de suplementares
   - Média de suplementar por lançamento

**Steps:**
1. Query: contar lançamentos onde folhaSuplementar > 0
2. Query: SUM(folhaSuplementar) de todos os lançamentos
3. Calcular média
4. Renderizar em cards
5. Commit: "dashboard: adicionar stats de suplementares"

---

## Task 6: Testes

**Verificações:**
1. ✅ Campo suplementar aparece na edição
2. ✅ FolhaTotal calcula corretamente: folhaBase + folhaSuplementar
3. ✅ ValorRecolherCalculado usa folhaTotal
4. ✅ Editar suplementar recalcula tudo
5. ✅ Deletar suplementar (zerar) recalcula
6. ✅ Tabela mostra folhaTotal
7. ✅ Dashboard mostra estatísticas
8. ✅ Backward compatibility: folhas sem suplementar funcionam
9. ✅ Validação: folhaSuplementar ≥ 0

**Steps:**
1. Testar manualmente: criar lançamento com suplementar
2. Verificar cálculos em tempo real
3. Editar valor e verificar recalcular
4. Verificar tabela
5. Verificar dashboard
6. Commit: "test: validar funcionalidade de folhaSuplementar"

---

## Status

| Tarefa | Status | Complexidade | Tempo |
|--------|--------|-------------|-------|
| 1. Schema Prisma | ⏳ TODO | Baixa | 15 min |
| 2. Serviço de Cálculos | ⏳ TODO | Média | 30 min |
| 3. UI - Editar Lançamento | ⏳ TODO | Média | 45 min |
| 4. UI - Tabela | ⏳ TODO | Baixa | 20 min |
| 5. Dashboard | ⏳ TODO | Baixa | 20 min |
| 6. Testes | ⏳ TODO | Média | 30 min |

**Total de tarefas:** 6  
**Tempo estimado:** 2-3 horas  
**Complexidade geral:** Baixa-Média  

---

## Principais Diferenças da v1

| Aspecto | v1 (Rejeitado) | v2 (Novo) |
|--------|---------|---------|
| **Estrutura** | Tabela separada | Campo simples |
| **Motivos** | 4 categorias | Sem motivos |
| **Múltiplos** | Múltiplos por lançamento | Um único valor |
| **UI** | Módulo separado | Campo integrado |
| **Complexidade** | 9 tarefas, alta | 6 tarefas, baixa |
| **Aprovação** | Com fluxo opcional | Sem fluxo |
| **Cálculo** | Complexo | Simples |

---

## Benefícios

✅ **Mais simples:** Menos código, menos bugs  
✅ **Mais rápido:** 2-3h vs 8-10h  
✅ **Melhor UX:** Campo na mesma página  
✅ **Menos dados:** Um valor, não múltiplas linhas  
✅ **Fácil de manter:** Sem motivos ou aprovações  
✅ **Backward compatible:** Folhas existentes funcionam  

---

## ✅ Confirmações v2

✅ Campo único de suplementar por lançamento  
✅ Sem motivos (simplificação)  
✅ Integrado na página de edição de lançamento  
✅ FolhaTotal calculada automaticamente  
✅ Sem fluxo de aprovação  
✅ Recálculos automáticos  
✅ Sem auditoria  

---

## 🚀 Próxima Ação

**Iniciar implementação do plano v2?**

Responda: **SIM** ou indicar mais ajustes
