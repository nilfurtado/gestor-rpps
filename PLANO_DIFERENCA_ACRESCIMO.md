# 📋 PLANO: Implementar Diferença e Acréscimo em Novo Lançamento

## 🎯 OBJETIVO
Calcular corretamente a **diferença** e **acréscimo** entre valor esperado (folha) e valor recolhido, com validações e alertas apropriados.

---

## 📊 ESTRUTURA DE DADOS

### Entradas (Usuário Preenche)
```
┌─────────────────────────────────────────┐
│ 1. Ente (STTRANS)                      │
│ 2. Tipo (PATRONAL/SEGURADO)            │
│ 3. Exercício (2026)                    │
│ 4. Competência (05/2026)               │
│ 5. Base de Previdência (R$ 137.284,80) │
│ 6. Alíquota (14%)                      │
│ 7. Valor Recolhido (R$ ?)              │
│ 8. Multas (opcional)                   │
│ 9. Juros (opcional)                    │
│ 10. Acréscimo Manual (opcional)        │
└─────────────────────────────────────────┘
```

### Cálculos Automáticos
```
┌─────────────────────────────────────────┐
│ A. Valor Esperado (folha)              │
│    = Base × Alíquota ÷ 100             │
│    = 137.284,80 × 14 ÷ 100             │
│    = R$ 19.219,89                      │
│                                        │
│ B. Valor Total a Recolher              │
│    = Valor Esperado + Multas + Juros   │
│    = 19.219,89 + 0 + 0                 │
│    = R$ 19.219,89                      │
│                                        │
│ C. Diferença (CRÍTICO)                 │
│    = Valor Recolhido - Valor Total     │
│    = ? - 19.219,89                     │
│                                        │
│ D. Status                              │
│    Se Diferença = 0      → QUITADO     │
│    Se Diferença < 0      → INADIMPLENTE│
│    Se Diferença > 0      → ACRESCIMO   │
│                                        │
│ E. Percentual de Diferença             │
│    = (Diferença ÷ Valor Total) × 100  │
└─────────────────────────────────────────┘
```

---

## 🔄 FLUXO DE CÁLCULO (ORDEM IMPORTA!)

### Fase 1: Cálculo do Valor Esperado
```
1. Usuário preenche:
   ├─ Base de Previdência
   ├─ Alíquota (%)
   └─ [Sistema calcula automaticamente]

2. Sistema calcula:
   valorEsperado = (base × alíquota) ÷ 100
   └─ Exemplo: 137.284,80 × 14 ÷ 100 = 19.219,89
```

### Fase 2: Cálculo do Total a Recolher
```
3. Usuário preenche (opcional):
   ├─ Multas
   ├─ Juros
   └─ [Sistema calcula automaticamente]

4. Sistema calcula:
   valorTotal = valorEsperado + multas + juros
   └─ Exemplo: 19.219,89 + 0 + 0 = 19.219,89
```

### Fase 3: Comparação com Recolhido
```
5. Usuário preenche:
   └─ Valor Recolhido

6. Sistema calcula:
   diferenca = valorRecolhido - valorTotal
   
   EXEMPLOS:
   ├─ Se recolheu 19.219,89
   │  diferenca = 19.219,89 - 19.219,89 = 0,00 ✅ QUITADO
   │
   ├─ Se recolheu 18.000,00
   │  diferenca = 18.000,00 - 19.219,89 = -1.219,89 ❌ ATRASO
   │
   └─ Se recolheu 20.000,00
      diferenca = 20.000,00 - 19.219,89 = +780,11 ⚠️ ACRESCIMO
```

### Fase 4: Determinação de Status
```
7. Sistema determina status:
   ├─ Se |diferenca| < 0,01
   │  └─ Status = QUITADO ✅
   │
   ├─ Se diferenca < 0
   │  └─ Status = INADIMPLENTE ❌ (em atraso)
   │
   └─ Se diferenca > 0
      └─ Status = ACRESCIMO ⚠️ (recolheu a mais)
```

---

## 📝 CAMPOS NOVOS NECESSÁRIOS

### No Banco de Dados (campo valor_folha)
```sql
ALTER TABLE lancamentos ADD COLUMN valor_folha DECIMAL(12,2);
-- Armazena o valor esperado da folha para auditoria
```

### No Formulário (visível para usuário)
```
Seção: COMPARAÇÃO COM FOLHA
├─ Campo 1: Valor da Folha (informativo/readonly)
│  Mostra o valor calculado automaticamente
│  Usa: Base × Alíquota ÷ 100
│
├─ Campo 2: Valor Recolhido (já existe)
│  Usuário preenche quanto foi recebido
│
├─ Campo 3: Diferença (calculada/readonly)
│  Mostra: Valor Recolhido - Valor da Folha
│  Atualiza em tempo real
│
└─ Campo 4: Status (calculado/readonly)
   Mostra: QUITADO / INADIMPLENTE / ACRESCIMO
   Com ícone e cor apropriada
```

---

## 🎨 COMPONENTES A CRIAR

### 1. Função de Cálculo: `calcularValorFolha()`
```typescript
function calcularValorFolha(base: number, aliquota: number): number {
  if (base <= 0 || aliquota < 0) return 0;
  return Number((base * aliquota / 100).toFixed(2));
}
```

### 2. Função de Cálculo: `calcularDiferenca()`
```typescript
function calcularDiferenca(valorFolha: number, valorRecolhido: number): {
  diferenca: number;
  status: "QUITADO" | "INADIMPLENTE" | "ACRESCIMO";
  percentual: number;
} {
  const diferenca = valorRecolhido - valorFolha;
  const percentual = valorFolha > 0 ? (diferenca / valorFolha) * 100 : 0;
  
  let status: "QUITADO" | "INADIMPLENTE" | "ACRESCIMO";
  if (Math.abs(diferenca) < 0.01) status = "QUITADO";
  else if (diferenca < 0) status = "INADIMPLENTE";
  else status = "ACRESCIMO";
  
  return { diferenca: Number(diferenca.toFixed(2)), status, percentual };
}
```

### 3. Componente Visual: `<ComparativoFolha />`
```typescript
interface Props {
  valorFolha: number;
  valorRecolhido: number;
  diferenca: number;
  status: "QUITADO" | "INADIMPLENTE" | "ACRESCIMO";
  percentual: number;
}

// Exibe 3 linhas com cores:
// Verde: ✅ Quitado
// Vermelho: ❌ Inadimplente
// Amarelo: ⚠️ Acréscimo
```

### 4. Componente Visual: `<AlertaDiferenca />`
```typescript
// Alerta contextual baseado no status
// Se QUITADO → ✅ "Valor correto"
// Se INADIMPLENTE → ❌ "Faltam R$ X.XXX,XX"
// Se ACRESCIMO → ⚠️ "Recolheu R$ X.XXX,XX a mais"
```

---

## 🔄 INTEGRAÇÃO NO FORMULÁRIO

### Ordem de Campos Recomendada
```
SEÇÃO: CÁLCULOS
┌─────────────────────────────┐
│ 1. Base de Previdência      │ ← Input
│ 2. Alíquota (%)             │ ← Input
│    ↓ [Calcula automaticamente]
│ 3. Valor da Folha (R$)      │ ← Readonly (resultado)
└─────────────────────────────┘

SEÇÃO: RECOLHIMENTO
┌─────────────────────────────┐
│ 4. Valor Recolhido (R$)     │ ← Input
│ 5. Multas (opcional)        │ ← Input
│ 6. Juros (opcional)         │ ← Input
│    ↓ [Calcula automaticamente]
│ 7. Total a Recolher         │ ← Readonly (resultado)
└─────────────────────────────┘

SEÇÃO: COMPARAÇÃO COM FOLHA ⭐ NEW
┌─────────────────────────────┐
│ Valor Esperado: 19.219,89   │
│ Valor Recolhido: ?          │
│ ─────────────────────────   │
│ DIFERENÇA: ? ⚠️             │
│ STATUS: [QUITADO/ATRASO]    │
│ [ALERTA VISUAL]             │
└─────────────────────────────┘
```

---

## 📊 EXEMPLOS PRÁTICOS

### Exemplo 1: Recolhimento Correto
```
Entrada:
├─ Base: R$ 137.284,80
├─ Alíquota: 14%
└─ Recolhido: R$ 19.219,89

Cálculos:
├─ Valor Folha = 137.284,80 × 14 ÷ 100 = R$ 19.219,89
├─ Total = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 19.219,89 - 19.219,89 = R$ 0,00
├─ Percentual = 0%
└─ Status = QUITADO ✅

Resultado: ✅ VERDE - "Valor correto"
```

### Exemplo 2: Atraso de Pagamento
```
Entrada:
├─ Base: R$ 137.284,80
├─ Alíquota: 14%
└─ Recolhido: R$ 15.000,00

Cálculos:
├─ Valor Folha = R$ 19.219,89
├─ Total = R$ 19.219,89
├─ Diferença = 15.000,00 - 19.219,89 = R$ -4.219,89
├─ Percentual = -21,94%
└─ Status = INADIMPLENTE ❌

Resultado: ❌ VERMELHO - "Faltam R$ 4.219,89 (21,94% abaixo)"
```

### Exemplo 3: Acréscimo/Antecipação
```
Entrada:
├─ Base: R$ 137.284,80
├─ Alíquota: 14%
└─ Recolhido: R$ 20.000,00

Cálculos:
├─ Valor Folha = R$ 19.219,89
├─ Total = R$ 19.219,89
├─ Diferença = 20.000,00 - 19.219,89 = R$ +780,11
├─ Percentual = +4,06%
└─ Status = ACRESCIMO ⚠️

Resultado: ⚠️ AMARELO - "Recolheu R$ 780,11 a mais (4,06% acima)"
Dica: "Verifique se há juros ou antecipação inclusos"
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Funções de Cálculo
- [ ] Criar `src/lib/calc/lancamento-diferenca.ts`
  - [ ] `calcularValorFolha()`
  - [ ] `calcularDiferenca()`
  - [ ] `calcularStatus()`
  - [ ] `gerarMensagem()`

### Fase 2: Componentes Visuais
- [ ] Criar `src/components/lancamentos/comparativo-folha.tsx`
- [ ] Criar `src/components/lancamentos/alerta-diferenca.tsx`

### Fase 3: Integração no Formulário
- [ ] Atualizar `lancamento-form.tsx`
  - [ ] Adicionar imports
  - [ ] Adicionar useMemo para valorFolha
  - [ ] Adicionar useMemo para resultadoDiferenca
  - [ ] Adicionar novo campo "Valor da Folha"
  - [ ] Integrar componente `<ComparativoFolha />`
  - [ ] Integrar componente `<AlertaDiferenca />`

### Fase 4: Banco de Dados
- [ ] Adicionar coluna `valor_folha` em lancamentos
- [ ] Atualizar payload de salvamento

### Fase 5: Testes
- [ ] Teste: Valor correto (diferença = 0)
- [ ] Teste: Valor em atraso (diferença < 0)
- [ ] Teste: Acréscimo (diferença > 0)
- [ ] Teste: Com multas e juros
- [ ] Teste: Validação de limites

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

```
1º → Criar funções de cálculo (2h)
     └─ Sem componentes, sem formulário
     └─ Apenas lógica pura em TypeScript

2º → Criar componentes visuais (2h)
     └─ ComparativoFolha
     └─ AlertaDiferenca

3º → Integrar no formulário (2h)
     └─ Adicionar campos
     └─ Conectar cálculos
     └─ Testar fluxo

4º → Migração BD (1h)
     └─ Adicionar coluna valor_folha
     └─ Atualizar salvamento

5º → Testes e refinamento (1h)
     └─ Validar todos os cenários
     └─ Ajustar mensagens
     └─ Performance
```

**Total Estimado: 8 horas**

---

## 🚀 BENEFÍCIOS

✅ Diferença calculada corretamente  
✅ Status automático (QUITADO/ATRASO/ACRESCIMO)  
✅ Alertas visuais apropriados  
✅ Auditoria de valores (salva valor_folha)  
✅ Detecção de anomalias (acréscimos inesperados)  
✅ Melhor rastreabilidade de pagamentos  

---

## 📝 NOTAS IMPORTANTES

1. **Ordem de Cálculo**: Sempre Base → Alíquota → Valor Folha → Recolhido → Diferença
2. **Tolerância**: Considerar R$ 0,01 como "sem diferença"
3. **Percentual**: Sempre em relação ao valor total a recolher
4. **Status**: Determinado APENAS pela diferença, não por campos isolados
5. **Auditoria**: Sempre salvar o valor_folha para rastreabilidade futura
