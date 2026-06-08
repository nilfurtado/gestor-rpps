# 📋 PLANO: Campo Acréscimo Automático com Registro no Banco

## 🎯 OBJETIVO
Transformar campo "Acréscimo (R$)" em cálculo automático que registra diferenças e acréscimos no banco de dados.

---

## 📐 FÓRMULA ÚNICA

```
Acréscimo/Diferença = Valor a Recolher - Valor Recolhido

Interpretação:
├─ Se > 0  → Acréscimo (faltou pagar)
├─ Se < 0  → Diferença (pagou a mais)
└─ Se = 0  → Quitado (sem variação)
```

---

## 📊 COMPORTAMENTO DO CAMPO

### **ANTES (Atual)**
```
Campo: Acréscimo (R$)
Status: ❌ Manual (usuário preenche)
Uso: Multas, juros extras
Salvo: Sim, no banco
```

### **DEPOIS (Proposto)**
```
Campo: Acréscimo (R$)
Status: ✅ Automático (calculado)
Usa a fórmula: Valor a Recolher - Valor Recolhido
Salvo: Sim, no banco com tipo (ACRESCIMO/DIFERENCA/QUITADO)

Se valor > 0  → Campo mostra acréscimo (positivo)
Se valor < 0  → Campo mostra diferença (negativo)
Se valor = 0  → Campo mostra 0,00
```

---

## 🔧 ESTRUTURA DO FORMULÁRIO

### **ENTRADA (Usuário preenche)**
```
├─ Valor a Recolher (calculado automaticamente)
│  └─ = Base × Alíquota ÷ 100
│
├─ Valor Recolhido (manual)
│  └─ R$ ???? (usuário digita)
│
└─ Multas (opcional, manual)
   └─ R$ ???? (usuário digita)
```

### **CÁLCULO (Sistema calcula)**
```
Total a Recolher = Valor Esperado + Multas

Acréscimo/Diferença = Total a Recolher - Valor Recolhido
```

### **SAÍDA (Campo readonly)**
```
Campo "Acréscimo (R$)" 
├─ Se > 0  → Mostra em VERMELHO (acréscimo/falta)
│  └─ Exemplo: +4.219,89 ❌ FALTA PAGAR
│
├─ Se < 0  → Mostra em AMARELO (diferença)
│  └─ Exemplo: -780,11 ⭐ PAGOU A MAIS
│
└─ Se = 0  → Mostra em VERDE (quitado)
   └─ Exemplo: 0,00 ✅ EXATO
```

---

## 📋 MUDANÇAS NO BANCO DE DADOS

### **Adicionar Coluna: acrescimo_tipo**
```sql
ALTER TABLE lancamentos ADD COLUMN acrescimo_tipo ENUM(
  'ACRESCIMO',    -- Falta pagar (positivo)
  'DIFERENCA',    -- Pagou a mais (negativo)
  'QUITADO'       -- Sem variação (zero)
) DEFAULT 'QUITADO';
```

### **Atualizar Coluna: acrescimo**
```
Tipo: DECIMAL(12,2)
Status: Readonly (não editar manualmente)
Valor: Calculado automaticamente
Salvo: Sim, toda vez que salva lançamento

Fórmula: Total a Recolher - Valor Recolhido
```

---

## 🔄 FLUXO DE CÁLCULO

### **Passo 1: Usuário Preenche**
```
Base de Previdência:  R$ 137.284,80
Alíquota:             14%
Valor Recolhido:      R$ 15.000,00
Multas:               R$ 0,00
```

### **Passo 2: Sistema Calcula**
```
1. Valor Esperado = 137.284,80 × 14 ÷ 100
                  = R$ 19.219,89

2. Total a Recolher = 19.219,89 + 0
                    = R$ 19.219,89

3. Acréscimo/Diferença = 19.219,89 - 15.000,00
                       = R$ 4.219,89

4. Tipo = ACRESCIMO (porque > 0)
```

### **Passo 3: Exibir Campo**
```
Campo "Acréscimo (R$)": 4.219,89 ❌ FALTA PAGAR
├─ Cor: Vermelho (alerta)
├─ Status: ACRESCIMO (falta)
└─ Mensagem: "Faltam R$ 4.219,89 (21,96%)"
```

### **Passo 4: Salvar no Banco**
```
INSERT INTO lancamentos (
  ...campos existentes...,
  acrescimo,           -- 4.219,89
  acrescimo_tipo,      -- 'ACRESCIMO'
  ...
) VALUES (...)
```

---

## 💾 BANCO DE DADOS - EXEMPLOS

### **Exemplo 1: QUITADO**
```sql
INSERT INTO lancamentos (...) VALUES (
  valor_recolher: 19.219,89,
  valor_recolhido: 19.219,89,
  multas: 0,
  acrescimo: 0.00,           ← Campo calculado
  acrescimo_tipo: 'QUITADO'  ← Tipo registrado
);
```

### **Exemplo 2: ACRESCIMO (Falta)**
```sql
INSERT INTO lancamentos (...) VALUES (
  valor_recolher: 19.219,89,
  valor_recolhido: 15.000,00,
  multas: 0,
  acrescimo: 4.219,89,       ← Campo calculado (+)
  acrescimo_tipo: 'ACRESCIMO'← Tipo: acréscimo
);
```

### **Exemplo 3: DIFERENCA (Pagou a Mais)**
```sql
INSERT INTO lancamentos (...) VALUES (
  valor_recolher: 19.219,89,
  valor_recolhido: 20.000,00,
  multas: 0,
  acrescimo: -780.11,        ← Campo calculado (-)
  acrescimo_tipo: 'DIFERENCA'← Tipo: diferença
);
```

---

## 🔧 IMPLEMENTAÇÃO NO CÓDIGO

### **1. Função de Cálculo (Nova)**
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
  const totalARecolher = valorARecolher + multas;
  const acrescimo = totalARecolher - valorRecolhido;
  const percentual = (acrescimo / totalARecolher) * 100;
  
  let tipo: 'ACRESCIMO' | 'DIFERENCA' | 'QUITADO';
  let mensagem: string;
  
  if (Math.abs(acrescimo) < 0.01) {
    tipo = 'QUITADO';
    mensagem = '✅ Valor exato - Quitado';
  } else if (acrescimo > 0) {
    tipo = 'ACRESCIMO';
    mensagem = `❌ Faltam R$ ${acrescimo.toFixed(2)} (${percentual.toFixed(2)}%)`;
  } else {
    tipo = 'DIFERENCA';
    mensagem = `⭐ Pagou R$ ${Math.abs(acrescimo).toFixed(2)} a mais (${Math.abs(percentual).toFixed(2)}%)`;
  }
  
  return {
    acrescimo: Number(acrescimo.toFixed(2)),
    tipo,
    percentual: Number(percentual.toFixed(2)),
    mensagem,
  };
}
```

### **2. Atualizar Formulário**
```typescript
// No lancamento-form.tsx

const resultadoAcrescimo = useMemo(() => {
  const vRecolhido = currencyToNumber(valorRecolhido);
  const vMultas = currencyToNumber(multas);
  
  if (valorRecolherCalculado > 0 && vRecolhido > 0) {
    return calcularAcrescimoAuto(valorRecolherCalculado, vRecolhido, vMultas);
  }
  return null;
}, [valorRecolherCalculado, valorRecolhido, multas]);

// Campo renderizado como readonly com cor
<div className={`
  p-3 rounded border
  ${resultadoAcrescimo?.tipo === 'QUITADO' ? 'bg-green-50 border-green-200' : ''}
  ${resultadoAcrescimo?.tipo === 'ACRESCIMO' ? 'bg-red-50 border-red-200' : ''}
  ${resultadoAcrescimo?.tipo === 'DIFERENCA' ? 'bg-yellow-50 border-yellow-200' : ''}
`}>
  <label>Acréscimo (R$)</label>
  <input 
    type="text"
    value={resultadoAcrescimo?.acrescimo.toFixed(2) ?? '0,00'}
    readOnly
    disabled
  />
  <p className="text-sm">{resultadoAcrescimo?.mensagem}</p>
</div>
```

### **3. Salvar no Banco**
```typescript
// No onSubmit()

const payload = {
  // ...campos existentes...
  acrescimo: resultadoAcrescimo?.acrescimo ?? 0,    // ✅ Automático
  acrescimo_tipo: resultadoAcrescimo?.tipo ?? 'QUITADO',
  // ...rest...
};
```

---

## 📊 VISUALIZAÇÃO NO FORMULÁRIO

```
┌─────────────────────────────────────────┐
│ VALORES                                 │
├─────────────────────────────────────────┤
│ Folha base: R$ 137.284,80               │
│ Alíquota: 14%                           │
│ Valor Esperado: R$ 19.219,89 (calc)    │
├─────────────────────────────────────────┤
│ Valor Recolhido: R$ 15.000,00 (manual)  │
│ Multas: R$ 0,00 (opcional)              │
├─────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐│
│ │ Acréscimo (R$): 4.219,89             ││ ← READONLY + COR
│ │ ❌ Faltam R$ 4.219,89 (21,96%)       ││
│ │ Tipo: ACRESCIMO                      ││
│ └──────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Banco de Dados (1h)**
- [ ] Adicionar coluna `acrescimo_tipo` no schema
- [ ] Criar migration
- [ ] Atualizar seed se necessário

### **Fase 2: Função de Cálculo (30 min)**
- [ ] Criar `calcularAcrescimoAuto()`
- [ ] Testar com 3 cenários (quitado, acréscimo, diferença)

### **Fase 3: Integração Formulário (1h)**
- [ ] Criar useMemo no formulário
- [ ] Renderizar campo com cores
- [ ] Integrar no payload de salvamento

### **Fase 4: UI/UX (30 min)**
- [ ] Testar renderização
- [ ] Ajustar cores e mensagens
- [ ] Testar em diferentes tamanhos de tela

**Total: 3 horas**

---

## 📈 BENEFÍCIOS

✅ Sem entrada manual de acréscimo  
✅ Cálculo automático e consistente  
✅ Registro completo no banco (tipo + valor)  
✅ Fácil auditoria (tipo registrado)  
✅ Alertas visuais (cores diferentes)  
✅ Interface intuitiva  
✅ Integra perfeitamente nos status existentes  

---

## 🔍 RELATÓRIOS POSSÍVEIS

Com acréscimo_tipo registrado, fica fácil fazer:

```sql
-- Total de acréscimos (falta pagar)
SELECT SUM(acrescimo) FROM lancamentos 
WHERE acrescimo_tipo = 'ACRESCIMO';

-- Total de diferenças (pagou a mais)
SELECT SUM(ABS(acrescimo)) FROM lancamentos 
WHERE acrescimo_tipo = 'DIFERENCA';

-- Quitados
SELECT COUNT(*) FROM lancamentos 
WHERE acrescimo_tipo = 'QUITADO';
```

---

## 📝 PADRÃO DO CAMPO ACRÉSCIMO

| Situação | Valor | Tipo | Cor | Mensagem |
|----------|-------|------|-----|----------|
| Exato | 0,00 | QUITADO | 🟢 Verde | Valor exato |
| Falta pagar | +4.219,89 | ACRESCIMO | 🔴 Vermelho | Faltam R$ |
| Pagou a mais | -780,11 | DIFERENCA | 🟡 Amarelo | Recolheu a mais |
