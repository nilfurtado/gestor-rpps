# 📋 PLANO: Campo Acréscimo Automático com Registro no Banco

## 🎯 OBJETIVO
Transformar campo "Acréscimo (R$)" em cálculo automático que registra acréscimos e diferenças no banco de dados.

---

## 📐 FÓRMULA ÚNICA

```
Acréscimo/Diferença = Valor a Recolher - Valor Recolhido

Interpretação:
├─ Se > 0  → DIFERENÇA + (Faltou pagar) ❌
├─ Se < 0  → ACRESCIMO - (Pagou a mais) ⭐
└─ Se = 0  → QUITADO (Exato) ✅
```

---

## 📊 COMPORTAMENTO DO CAMPO

### **ANTES (Atual)**
```
Campo: Acréscimo (R$)
Status: ❌ Manual (usuário preenche)
Salvo: Sim, no banco
```

### **DEPOIS (Proposto)**
```
Campo: Acréscimo (R$)
Status: ✅ Automático (calculado)
Fórmula: Valor a Recolher - Valor Recolhido
Salvo: Sim, com tipo (ACRESCIMO/DIFERENCA/QUITADO)

Se > 0  → DIFERENÇA (positivo, faltou pagar)
Se < 0  → ACRESCIMO (negativo, pagou a mais)
Se = 0  → QUITADO (zero, exato)
```

---

## 🔄 FLUXO

### **Entrada (Usuário)**
```
Base de Previdência:  R$ 137.284,80
Alíquota:             14%
Valor Recolhido:      R$ ?
Multas (opcional):    R$ ?
```

### **Cálculos (Sistema)**
```
1. Valor Esperado = Base × Alíquota ÷ 100 = R$ 19.219,89
2. Total = Valor Esperado + Multas
3. Acréscimo/Diferença = Total - Valor Recolhido
```

### **Saída (Readonly com Cor)**
```
Se > 0 → DIFERENÇA (vermelho) ❌
Se < 0 → ACRESCIMO (amarelo) ⭐
Se = 0 → QUITADO (verde) ✅
```

---

## 💾 BANCO DE DADOS

### **Nova Coluna**
```sql
ALTER TABLE lancamentos ADD COLUMN acrescimo_tipo ENUM(
  'ACRESCIMO',   -- Pagou a mais (-)
  'DIFERENCA',   -- Faltou pagar (+)
  'QUITADO'      -- Exato (0)
) DEFAULT 'QUITADO';
```

### **Coluna Existente (acrescimo)**
```
Tipo: DECIMAL(12,2)
Valor: Calculado automaticamente
Salvo: Sempre, na inserção/atualização
```

---

## 📊 EXEMPLOS

### **Exemplo 1: DIFERENÇA (Faltou Pagar)**
```
Esperado: R$ 19.219,89
Recolhido: R$ 15.000,00
─────────────────────────
Cálculo: 19.219,89 - 15.000,00 = +4.219,89

SAÍDA:
├─ Campo: +4.219,89
├─ Cor: 🔴 Vermelho
├─ Tipo: DIFERENÇA
├─ Percentual: 21,96%
└─ Mensagem: "Faltam R$ 4.219,89"

BANCO:
├─ acrescimo: 4.219,89
└─ acrescimo_tipo: 'DIFERENCA'
```

### **Exemplo 2: ACRESCIMO (Pagou a Mais)**
```
Esperado: R$ 19.219,89
Recolhido: R$ 20.000,00
─────────────────────────
Cálculo: 19.219,89 - 20.000,00 = -780,11

SAÍDA:
├─ Campo: -780,11
├─ Cor: 🟡 Amarelo
├─ Tipo: ACRESCIMO
├─ Percentual: -4,06%
└─ Mensagem: "Recolheu R$ 780,11 a mais"

BANCO:
├─ acrescimo: -780,11
└─ acrescimo_tipo: 'ACRESCIMO'
```

### **Exemplo 3: QUITADO (Exato)**
```
Esperado: R$ 19.219,89
Recolhido: R$ 19.219,89
─────────────────────────
Cálculo: 19.219,89 - 19.219,89 = 0,00

SAÍDA:
├─ Campo: 0,00
├─ Cor: 🟢 Verde
├─ Tipo: QUITADO
├─ Percentual: 0%
└─ Mensagem: "Valor exato"

BANCO:
├─ acrescimo: 0,00
└─ acrescimo_tipo: 'QUITADO'
```

---

## 🔧 IMPLEMENTAÇÃO

### **Função (30 min)**
```typescript
// src/lib/calc/acrescimo-auto.ts

export function calcularAcrescimoAuto(
  valorARecolher: number,
  valorRecolhido: number,
  multas: number = 0
): {
  acrescimo: number;
  tipo: 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';
  percentual: number;
  mensagem: string;
} {
  const total = valorARecolher + multas;
  const acrescimo = total - valorRecolhido;
  const percentual = (acrescimo / total) * 100;
  
  let tipo: 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';
  let mensagem: string;
  
  if (Math.abs(acrescimo) < 0.01) {
    tipo = 'QUITADO';
    mensagem = '✅ Valor exato';
  } else if (acrescimo > 0) {
    tipo = 'DIFERENCA';
    mensagem = `❌ Faltam R$ ${acrescimo.toFixed(2)} (${percentual.toFixed(2)}%)`;
  } else {
    tipo = 'ACRESCIMO';
    mensagem = `⭐ Recolheu R$ ${Math.abs(acrescimo).toFixed(2)} a mais`;
  }
  
  return {
    acrescimo: Number(acrescimo.toFixed(2)),
    tipo,
    percentual: Number(percentual.toFixed(2)),
    mensagem,
  };
}
```

### **Formulário (1h)**
```typescript
const resultado = useMemo(() => {
  const vRecolhido = currencyToNumber(valorRecolhido);
  const vMultas = currencyToNumber(multas);
  
  if (valorRecolherCalculado > 0 && vRecolhido > 0) {
    return calcularAcrescimoAuto(valorRecolherCalculado, vRecolhido, vMultas);
  }
  return null;
}, [valorRecolherCalculado, valorRecolhido, multas]);

// Campo com cores
<div className={`
  p-3 rounded border
  ${resultado?.tipo === 'QUITADO' ? 'bg-green-50' : ''}
  ${resultado?.tipo === 'DIFERENCA' ? 'bg-red-50' : ''}
  ${resultado?.tipo === 'ACRESCIMO' ? 'bg-yellow-50' : ''}
`}>
  <label>Acréscimo (R$)</label>
  <input 
    type="text"
    value={resultado?.acrescimo.toFixed(2) ?? '0,00'}
    readOnly
    disabled
  />
  <p className="text-sm">{resultado?.mensagem}</p>
</div>

// Payload
const payload = {
  ...dados,
  acrescimo: resultado?.acrescimo ?? 0,
  acrescimo_tipo: resultado?.tipo ?? 'QUITADO',
};
```

### **Migration (1h)**
```sql
-- Criar migration
ALTER TABLE lancamentos ADD COLUMN acrescimo_tipo ENUM(
  'ACRESCIMO',
  'DIFERENCA', 
  'QUITADO'
) DEFAULT 'QUITADO' AFTER acrescimo;
```

---

## ✅ CHECKLIST (3 HORAS)

### **Fase 1: Função (30 min)**
- [ ] Criar `calcularAcrescimoAuto()`
- [ ] Testar 3 cenários

### **Fase 2: Migration (1h)**
- [ ] Adicionar coluna schema
- [ ] Criar migration Prisma
- [ ] Deploy

### **Fase 3: Integração (1h)**
- [ ] useMemo no formulário
- [ ] Renderizar com cores
- [ ] Integrar payload

### **Fase 4: UI (30 min)**
- [ ] Cores e mensagens
- [ ] Responsividade

---

## 📝 TABELA FINAL

| Situação | Valor | Tipo | Cor | Mensagem |
|----------|-------|------|-----|----------|
| Exato | 0,00 | QUITADO | 🟢 | Valor exato |
| Faltou pagar | +X.XXX,XX | DIFERENÇA | 🔴 | Faltam R$ |
| Pagou a mais | -X.XXX,XX | ACRESCIMO | 🟡 | Recolheu a mais |

---

## 🚀 RELATÓRIOS

```sql
-- Total faltando
SELECT SUM(acrescimo) FROM lancamentos 
WHERE acrescimo_tipo = 'DIFERENCA';

-- Total recolhido a mais
SELECT SUM(ABS(acrescimo)) FROM lancamentos 
WHERE acrescimo_tipo = 'ACRESCIMO';

-- Quitados
SELECT COUNT(*) FROM lancamentos 
WHERE acrescimo_tipo = 'QUITADO';
```
