# 📋 PLANO: Campo Acréscimo (R$) Automático

## 🎯 OBJETIVO
Transformar campo "Acréscimo (R$)" em cálculo automático (readonly).

---

## 📐 FÓRMULA

```
Acréscimo = Valor Recolhido - Valor a Recolher

Interpretação:
├─ Se > 0  → ACRESCIMO (Pagou a mais) ⭐
├─ Se < 0  → DIFERENÇA (Faltou pagar) ❌
└─ Se = 0  → QUITADO (Exato) ✅
```

---

## 🔄 FLUXO SIMPLES

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
3. Acréscimo = Valor Recolhido - Total
```

### **Campo Acréscimo (Readonly com Cor)**
```
Entrada:   Valor Recolhido
              ↓
Cálculo:   Total a Recolher = Valor a Recolher + Multas
              ↓
Output:    Campo Acréscimo = Valor Recolhido - Total
           (readonly, colored, com mensagem)
```

---

## 📊 EXEMPLOS

### **1. ACRESCIMO (Pagou a Mais): +780,11**
```
Recolhido: R$ 20.000,00
a Recolher: R$ 19.219,89
──────────────────────
= +780,11

EXIBIÇÃO:
├─ Campo: +780,11
├─ Cor: 🟡 Amarelo
└─ Mensagem: "Recolheu R$ 780,11 a mais"
```

### **2. DIFERENÇA (Faltou Pagar): -4.219,89**
```
Recolhido: R$ 15.000,00
a Recolher: R$ 19.219,89
──────────────────────
= -4.219,89

EXIBIÇÃO:
├─ Campo: -4.219,89
├─ Cor: 🔴 Vermelho
└─ Mensagem: "Faltam R$ 4.219,89"
```

### **3. QUITADO (Exato): 0,00**
```
Recolhido: R$ 19.219,89
a Recolher: R$ 19.219,89
──────────────────────
= 0,00

EXIBIÇÃO:
├─ Campo: 0,00
├─ Cor: 🟢 Verde
└─ Mensagem: "Valor exato"
```

---

## 🔧 IMPLEMENTAÇÃO (2 HORAS)

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

### **Passo 2: Integração no Formulário (1h)**
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

// Salvar no payload
const payload = {
  ...campos,
  acrescimo: resultado?.acrescimo ?? 0,
};
```

### **Passo 3: Testes (30 min)**
```
Teste 1: Recolhido > a Recolher → ACRESCIMO (amarelo)
Teste 2: Recolhido < a Recolher → DIFERENÇA (vermelho)
Teste 3: Recolhido = a Recolher → QUITADO (verde)
Teste 4: Com multas → cálculo correto
```

---

## ✅ CHECKLIST

- [ ] Criar `calcularAcrescimoAuto()`
- [ ] Integrar useMemo no formulário
- [ ] Campo readonly com cores
- [ ] Salvar valor no banco
- [ ] Testar 3 cenários

**Total: 2 horas**

---

## 📝 RESUMO

| Campo | Status | Mudança |
|-------|--------|---------|
| Acréscimo (R$) | ✅ Automático | Agora calcula sozinho |
| Cor | ✅ Novo | Verde/Amarelo/Vermelho |
| Mensagem | ✅ Novo | Mostra interpretação |
| Banco | ✅ Mesmo | Salva valor calculado |

---

**Apenas o campo Acréscimo muda. Nada de novo no banco!** 🎯
