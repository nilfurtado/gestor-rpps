# 📋 PLANO: Diferença e Acréscimo com Fórmula Simples

## 🎯 OBJETIVO
Implementar cálculo de diferença e acréscimo usando fórmula simples e direta.

---

## 📐 FÓRMULA PRINCIPAL

```
Diferença = Valor a Recolher - Valor Recolhido

Interpretação:
├─ Diferença > 0  → Falta pagar (Atraso)
├─ Diferença = 0  → Exato (Quitado)
└─ Diferença < 0  → Pagou a mais (Acréscimo)
```

---

## 📊 STATUS SIMPLIFICADOS

| Status | Diferença | Significado | Cor |
|--------|-----------|-------------|-----|
| **QUITADO** | 0,00 | Valor exato | 🟢 Verde |
| **ATRASO** | > 0 | Falta pagar | 🔴 Vermelho |
| **ACRESCIMO** | < 0 | Pagou a mais | 🟡 Amarelo |

---

## 💰 EXEMPLOS PRÁTICOS

### **Cenário 1: Pagamento Correto (QUITADO)**
```
Valor a Recolher (esperado): R$ 19.219,89
Valor Recolhido (recebido):  R$ 19.219,89
─────────────────────────────────────────
Diferença = 19.219,89 - 19.219,89 = R$ 0,00

STATUS: ✅ QUITADO
ALERTA: "Valor correto"
COR: 🟢 Verde
```

### **Cenário 2: Recolhimento Parcial (ATRASO)**
```
Valor a Recolher (esperado): R$ 19.219,89
Valor Recolhido (recebido):  R$ 15.000,00
─────────────────────────────────────────
Diferença = 19.219,89 - 15.000,00 = R$ 4.219,89

STATUS: ⚠️ ATRASO
PERCENTUAL: (4.219,89 / 19.219,89) × 100 = 21,96%
ALERTA: "Faltam R$ 4.219,89 (21,96% em atraso)"
COR: 🔴 Vermelho
```

### **Cenário 3: Recolhimento Acima (ACRESCIMO)**
```
Valor a Recolher (esperado): R$ 19.219,89
Valor Recolhido (recebido):  R$ 20.000,00
─────────────────────────────────────────
Diferença = 19.219,89 - 20.000,00 = R$ -780,11

STATUS: ⭐ ACRESCIMO
PERCENTUAL: (-780,11 / 19.219,89) × 100 = -4,06%
ALERTA: "Recolheu R$ 780,11 a mais (4,06% acima)"
COR: 🟡 Amarelo
```

### **Cenário 4: Sem Recolhimento (TOTAL ATRASO)**
```
Valor a Recolher (esperado): R$ 19.219,89
Valor Recolhido (recebido):  R$ 0,00
─────────────────────────────────────────
Diferença = 19.219,89 - 0,00 = R$ 19.219,89

STATUS: ❌ INADIMPLENTE
PERCENTUAL: (19.219,89 / 19.219,89) × 100 = 100%
ALERTA: "Nenhum recolhimento (100% em atraso)"
COR: 🔴 Vermelho (crítico)
```

### **Cenário 5: Parcelado - 1ª Parcela (ATRASO PARCIAL)**
```
Valor a Recolher (total):    R$ 19.219,89
Valor Recolhido (1ª parc):   R$ 5.000,00
─────────────────────────────────────────
Diferença = 19.219,89 - 5.000,00 = R$ 14.219,89

STATUS: 📅 PARCELADO
PARCELAS RESTANTES: 4
PERCENTUAL: (14.219,89 / 19.219,89) × 100 = 73,96%
ALERTA: "1ª parcela recebida. Faltam R$ 14.219,89 em 4 parcelas"
COR: 🔵 Azul (aguardando)
```

---

## 🔧 IMPLEMENTAÇÃO

### **Função Simples**
```typescript
function calcularDiferenca(
  valorARecolher: number,
  valorRecolhido: number
): {
  diferenca: number;
  percentual: number;
  status: "QUITADO" | "ATRASO" | "ACRESCIMO";
  mensagem: string;
} {
  const diferenca = valorARecolher - valorRecolhido;
  const percentual = (diferenca / valorARecolher) * 100;
  
  let status: "QUITADO" | "ATRASO" | "ACRESCIMO";
  let mensagem: string;
  
  if (Math.abs(diferenca) < 0.01) {
    status = "QUITADO";
    mensagem = "✅ Valor correto";
  } else if (diferenca > 0) {
    status = "ATRASO";
    mensagem = `❌ Faltam R$ ${diferenca.toFixed(2)} (${percentual.toFixed(2)}% em atraso)`;
  } else {
    status = "ACRESCIMO";
    mensagem = `⭐ Recolheu R$ ${Math.abs(diferenca).toFixed(2)} a mais (${Math.abs(percentual).toFixed(2)}% acima)`;
  }
  
  return {
    diferenca: Number(diferenca.toFixed(2)),
    percentual: Number(percentual.toFixed(2)),
    status,
    mensagem,
  };
}
```

### **Componente de Alerta Simples**
```typescript
function AlertaDiferenca({ diferenca, status, mensagem }: Props) {
  const colors = {
    QUITADO: "bg-green-50 border-green-200 text-green-900",
    ATRASO: "bg-red-50 border-red-200 text-red-900",
    ACRESCIMO: "bg-yellow-50 border-yellow-200 text-yellow-900",
  };
  
  const icons = {
    QUITADO: "✅",
    ATRASO: "❌",
    ACRESCIMO: "⭐",
  };
  
  return (
    <div className={`rounded border p-4 ${colors[status]}`}>
      <p className="font-semibold">
        {icons[status]} {mensagem}
      </p>
    </div>
  );
}
```

---

## ✅ INTEGRAÇÃO NOS STATUS EXISTENTES

```
PAGO
├─ Se diferença = 0      → ✅ QUITADO
└─ Se diferença < 0      → ⭐ ACRESCIMO

PARCIAL
└─ Se diferença > 0      → ⚠️ ATRASO

INADIMPLENTE
└─ Se diferença = valor total → ❌ TOTAL ATRASO

PARCELADO
└─ Se diferença > 0      → 📅 EM ANDAMENTO

RECOLHIMENTO_A_MAIOR
└─ Se diferença < 0      → ⭐ ACRESCIMO
```

---

## 🎯 CHECKLIST (3 HORAS)

- [ ] Criar função `calcularDiferenca()` (30 min)
- [ ] Criar componente `AlertaDiferenca` (30 min)
- [ ] Integrar no formulário (1h)
- [ ] Testes (1h)

---

## 💡 VANTAGENS

✅ Fórmula simples (uma subtração)  
✅ Sem dependências complexas  
✅ Fácil de testar  
✅ Intuitivo para usuários  
✅ Integra facilmente nos status existentes  
✅ Sem necessidade de remodelar banco de dados  
