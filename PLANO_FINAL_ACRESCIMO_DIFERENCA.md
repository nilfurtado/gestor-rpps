# 📋 PLANO: Campo Acréscimo Automático + Registro de Valores no Banco

## 🎯 OBJETIVO
Transformar campo "Acréscimo (R$)" em cálculo automático + registrar **valores e tipos** (ACRESCIMO/DIFERENÇA/QUITADO) no banco.

---

## 📐 FÓRMULA

```
Acréscimo/Diferença = Valor Recolhido - Valor a Recolher

Interpretação:
├─ Se > 0  → ACRESCIMO (Pagou a mais) ⭐ [valor positivo]
├─ Se < 0  → DIFERENÇA (Faltou pagar) ❌ [valor negativo]
└─ Se = 0  → QUITADO (Exato) ✅ [valor zero]
```

---

## 💾 MUDANÇAS NO BANCO

### **Coluna 1: acrescimo (já existe)**
```sql
acrescimo: DECIMAL(12,2)
-- Armazena o valor calculado (positivo ou negativo)
```

### **Coluna 2: acrescimo_tipo (NOVA)**
```sql
ALTER TABLE lancamentos ADD COLUMN acrescimo_tipo ENUM(
  'ACRESCIMO',   -- Pagou a mais (+)
  'DIFERENCA',   -- Faltou pagar (-)
  'QUITADO'      -- Exato (0)
) DEFAULT 'QUITADO';
```

---

## 🔄 FLUXO COMPLETO

### **Entrada (Usuário preenche)**
```
Base de Previdência:  R$ 137.284,80
Alíquota:             14%
Valor Recolhido:      R$ ?
Multas (opcional):    R$ ?
```

### **Cálculos (Sistema)**
```
1. Valor a Recolher = Base × Alíquota ÷ 100 = R$ 19.219,89
2. Total = Valor a Recolher + Multas
3. Acréscimo/Diferença = Valor Recolhido - Total
4. Tipo = ACRESCIMO | DIFERENÇA | QUITADO
```

### **Campo Acréscimo (Readonly com Cor)**
```
Campo mostra valor com cor e mensagem
├─ Verde: 0,00 (QUITADO)
├─ Amarelo: +780,11 (ACRESCIMO)
└─ Vermelho: -4.219,89 (DIFERENÇA)
```

### **Salvar no Banco**
```
acrescimo: 780,11 ou -4.219,89 ou 0,00  [VALOR]
acrescimo_tipo: 'ACRESCIMO' ou 'DIFERENCA' ou 'QUITADO'  [TIPO]
```

---

## 📊 EXEMPLOS COMPLETOS

### **Exemplo 1: ACRESCIMO (Pagou a Mais)**
```
Recolhido: R$ 20.000,00
a Recolher: R$ 19.219,89
──────────────────────
Cálculo: 20.000,00 - 19.219,89 = +780,11

FORMULÁRIO:
├─ Campo: +780,11
├─ Cor: 🟡 Amarelo
└─ Mensagem: "Recolheu R$ 780,11 a mais"

BANCO REGISTRA:
├─ acrescimo: 780.11
└─ acrescimo_tipo: 'ACRESCIMO'
```

### **Exemplo 2: DIFERENÇA (Faltou Pagar)**
```
Recolhido: R$ 15.000,00
a Recolher: R$ 19.219,89
──────────────────────
Cálculo: 15.000,00 - 19.219,89 = -4.219,89

FORMULÁRIO:
├─ Campo: -4.219,89
├─ Cor: 🔴 Vermelho
└─ Mensagem: "Faltam R$ 4.219,89"

BANCO REGISTRA:
├─ acrescimo: -4219.89
└─ acrescimo_tipo: 'DIFERENCA'
```

### **Exemplo 3: QUITADO (Exato)**
```
Recolhido: R$ 19.219,89
a Recolher: R$ 19.219,89
──────────────────────
Cálculo: 19.219,89 - 19.219,89 = 0,00

FORMULÁRIO:
├─ Campo: 0,00
├─ Cor: 🟢 Verde
└─ Mensagem: "Valor exato"

BANCO REGISTRA:
├─ acrescimo: 0.00
└─ acrescimo_tipo: 'QUITADO'
```

---

## 🔧 IMPLEMENTAÇÃO (3 HORAS)

### **Passo 1: Função de Cálculo (30 min)**
```typescript
// src/lib/calc/acrescimo-auto.ts

export function calcularAcrescimoAuto(
  valorARecolher: number,
  valorRecolhido: number,
  multas: number = 0
): {
  acrescimo: number;
  tipo: 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';
  cor: string;
  mensagem: string;
} {
  const total = valorARecolher + multas;
  const acrescimo = valorRecolhido - total;
  
  let tipo: 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';
  let cor: string;
  let mensagem: string;
  
  if (Math.abs(acrescimo) < 0.01) {
    tipo = 'QUITADO';
    cor = 'bg-green-50 border-green-200';
    mensagem = '✅ Valor exato';
  } else if (acrescimo > 0) {
    tipo = 'ACRESCIMO';
    cor = 'bg-yellow-50 border-yellow-200';
    mensagem = `⭐ Recolheu R$ ${acrescimo.toFixed(2)} a mais`;
  } else {
    tipo = 'DIFERENCA';
    cor = 'bg-red-50 border-red-200';
    mensagem = `❌ Faltam R$ ${Math.abs(acrescimo).toFixed(2)}`;
  }
  
  return {
    acrescimo: Number(acrescimo.toFixed(2)),
    tipo,
    cor,
    mensagem,
  };
}
```

### **Passo 2: Migration (1h)**
```sql
-- Adicionar nova coluna ao banco
ALTER TABLE lancamentos ADD COLUMN acrescimo_tipo ENUM(
  'ACRESCIMO',
  'DIFERENCA',
  'QUITADO'
) DEFAULT 'QUITADO' AFTER acrescimo;
```

### **Passo 3: Integração (1h)**
```typescript
// No lancamento-form.tsx

import { calcularAcrescimoAuto } from '@/lib/calc/acrescimo-auto';

const resultado = useMemo(() => {
  const vRecolhido = currencyToNumber(valorRecolhido);
  const vMultas = currencyToNumber(multas);
  
  if (valorRecolherCalculado > 0 && vRecolhido > 0) {
    return calcularAcrescimoAuto(valorRecolherCalculado, vRecolhido, vMultas);
  }
  return null;
}, [valorRecolherCalculado, valorRecolhido, multas]);

// Campo Acréscimo (readonly)
<div className={`p-3 rounded border ${resultado?.cor}`}>
  <Label>Acréscimo (R$)</Label>
  <Input
    type="text"
    value={resultado?.acrescimo.toFixed(2) ?? '0,00'}
    readOnly
    disabled
  />
  <p className="text-sm mt-1">{resultado?.mensagem}</p>
</div>

// SALVAR NO BANCO - COM VALOR E TIPO
const payload = {
  ...campos,
  acrescimo: resultado?.acrescimo ?? 0,        // ✅ VALOR (positivo/negativo)
  acrescimo_tipo: resultado?.tipo ?? 'QUITADO', // ✅ TIPO (ACRESCIMO/DIFERENCA/QUITADO)
};
```

---

## ✅ CHECKLIST (3 HORAS)

### **Fase 1: Banco (1h)**
- [ ] Adicionar coluna `acrescimo_tipo` no schema Prisma
- [ ] Criar migration
- [ ] Executar migration

### **Fase 2: Função (30 min)**
- [ ] Criar `calcularAcrescimoAuto()`
- [ ] Retornar valor + tipo + cor + mensagem

### **Fase 3: Integração (1h)**
- [ ] useMemo no formulário
- [ ] Campo readonly com cores
- [ ] Salvar VALOR + TIPO no banco
- [ ] Testar 3 cenários (ACRESCIMO, DIFERENÇA, QUITADO)

---

## 📋 SCHEMA FINAL

```typescript
// Prisma Schema

model Lancamento {
  // ... campos existentes ...
  
  acrescimo: Decimal           // VALOR: positivo, negativo ou zero
  acrescimo_tipo: TipoAcrescimo // TIPO: ACRESCIMO, DIFERENCA, QUITADO
}

enum TipoAcrescimo {
  ACRESCIMO   // Pagou a mais
  DIFERENCA   // Faltou pagar
  QUITADO     // Exato
}
```

---

## 🔍 RELATÓRIOS POSSÍVEIS

```sql
-- Total recolhido a mais (ACRESCIMO)
SELECT SUM(acrescimo) FROM lancamentos 
WHERE acrescimo_tipo = 'ACRESCIMO';

-- Total faltando (DIFERENÇA)
SELECT SUM(ABS(acrescimo)) FROM lancamentos 
WHERE acrescimo_tipo = 'DIFERENCA';

-- Lançamentos quitados
SELECT COUNT(*) FROM lancamentos 
WHERE acrescimo_tipo = 'QUITADO';

-- Por órgão e tipo
SELECT orgaoId, acrescimo_tipo, COUNT(*), SUM(acrescimo)
FROM lancamentos 
GROUP BY orgaoId, acrescimo_tipo;

-- Maior acréscimo
SELECT * FROM lancamentos 
WHERE acrescimo_tipo = 'ACRESCIMO'
ORDER BY acrescimo DESC
LIMIT 10;

-- Maior diferença
SELECT * FROM lancamentos 
WHERE acrescimo_tipo = 'DIFERENCA'
ORDER BY acrescimo ASC
LIMIT 10;
```

---

## 📊 TABELA DE DADOS

| Lançamento | acrescimo | acrescimo_tipo | Significado |
|-----------|-----------|----------------|------------|
| 1 | 780,11 | ACRESCIMO | Pagou R$ 780,11 a mais |
| 2 | -4.219,89 | DIFERENCA | Faltam R$ 4.219,89 |
| 3 | 0,00 | QUITADO | Valor exato, sem diferença |
| 4 | 1.500,00 | ACRESCIMO | Pagou R$ 1.500,00 a mais |
| 5 | -2.000,00 | DIFERENCA | Faltam R$ 2.000,00 |

---

## 🎯 RESUMO

**O que muda:**
✅ Campo Acréscimo fica automático (readonly)
✅ Registra VALOR (positivo ou negativo)
✅ Registra TIPO (ACRESCIMO/DIFERENCA/QUITADO)
✅ Cores e mensagens contextuais

**Banco:**
✅ Coluna acrescimo (existente) - armazena VALOR
✅ Coluna acrescimo_tipo (nova) - armazena TIPO

**Relatórios:**
✅ Fácil agrupar por tipo
✅ Fácil somar totais
✅ Fácil análise histórica

---

**Implementação: 3 horas**
**Registro completo: VALOR + TIPO** 📊
