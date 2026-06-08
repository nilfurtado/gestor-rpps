# 📋 PLANO: Integrar Acréscimo e Diferenças no Sistema de Status

## 🎯 OBJETIVO
Redefine os 6 status existentes incorporando o cálculo automático de **diferença** e **acréscimo**, removendo a necessidade de entrada manual.

---

## 📊 STATUS ATUAL vs PROPOSTO

### **HOJE (6 Status)**
```
1. PAGO              → Recolhido ≥ Esperado
2. PARCIAL           → 0 < Recolhido < Esperado
3. INADIMPLENTE      → Recolhido = 0
4. PARCELADO         → Débito parcelado/negociado
5. SEM_MOVIMENTO     → Não usado
6. RECOLHIMENTO_A_MAIOR → Não usado na lógica
```

### **PROPOSTA: Integrar Diferença**
```
Mantém os 6 status EXISTENTES
+ Adiciona cálculo de DIFERENÇA em cada status
+ DIFERENÇA determina o SUBTIPO do status

Fórmula de Diferença:
Diferença = Valor Recolhido - (Valor Esperado + Multas + Juros)
```

---

## 🔄 NOVA LÓGICA DE STATUS COM DIFERENÇA

### **1. PAGO** ✅
```
QUANDO: Recolhido ≥ Esperado (sem parcelado)

SUBTIPO por DIFERENÇA:
├─ Diferença = 0      → PAGO QUITADO ✅
│  Exemplo: Esperado 19.219,89 | Recolhido 19.219,89
│  Diferença: 0,00 → Status: PAGO (sem variação)
│
├─ Diferença > 0      → PAGO COM ACRESCIMO ⭐
│  Exemplo: Esperado 19.219,89 | Recolhido 20.000,00
│  Diferença: +780,11 (+4,06%)
│  Status: PAGO (com acréscimo)
│
└─ Superávit: R$ 780,11
   Percentual: 104,06%
```

### **2. PARCIAL** ⚠️
```
QUANDO: 0 < Recolhido < Esperado

SUBTIPO por DIFERENÇA:
├─ Diferença < 0      → PARCIAL EM ATRASO ⚠️
│  Exemplo: Esperado 19.219,89 | Recolhido 15.000,00
│  Diferença: -4.219,89 (-21,94%)
│  Faltam: R$ 4.219,89
│
└─ Percentual Pago: 78,04%
   Percentual Atraso: 21,96%
```

### **3. INADIMPLENTE** ❌
```
QUANDO: Recolhido = 0 OU Valor Esperado = 0

SUBTIPO por DIFERENÇA:
└─ Diferença < 0      → INADIMPLENTE SEM RECOLHIMENTO ❌
   Exemplo: Esperado 19.219,89 | Recolhido 0,00
   Diferença: -19.219,89 (-100%)
   Faltam: R$ 19.219,89 (100%)
```

### **4. PARCELADO** 📅
```
QUANDO: Checkbox "Parcelado" marcado

SUBTIPO por DIFERENÇA:
├─ Diferença ≤ 0      → PARCELADO EM ANDAMENTO 📅
│  Exemplo: 1ª parcela de 5.000,00
│  Diferença: -14.219,89 (73,96% faltando)
│
├─ Diferença = 0      → PARCELADO QUITADO ✅
│  Última parcela paga corretamente
│
└─ Diferença > 0      → PARCELADO COM ACRESCIMO ⭐
   Última parcela com acréscimo
```

### **5. SEM_MOVIMENTO** ⏸️
```
QUANDO: Nenhuma ação, sem entrada de dados

SUBTIPO por DIFERENÇA:
└─ Diferença = Esperado (valor integral em atraso)
   Motivo: Não houve movimento de recolhimento
   Status: Aguardando primeiro recolhimento
```

### **6. RECOLHIMENTO_A_MAIOR** 💰
```
QUANDO: Recolhido > Esperado (sem parcelado)

SUBTIPO por DIFERENÇA:
├─ Diferença > 0      → RECOLHIMENTO A MAIOR 💰
│  Exemplo: Esperado 19.219,89 | Recolhido 20.000,00
│  Diferença: +780,11 (+4,06%)
│  Acréscimo: R$ 780,11
│
└─ Ação recomendada:
   ├─ Compensar em próximas parcelas
   ├─ Devolver ao contribuinte
   └─ Registrar como crédito
```

---

## 📐 CÁLCULOS NECESSÁRIOS

### **Diferença (Principal)**
```typescript
diferenca = valorRecolhido - (valorEsperado + multas + juros)

Interpretação:
├─ diferenca = 0      → Exato ✅
├─ diferenca < 0      → Falta (atraso)
└─ diferenca > 0      → Acréscimo (a mais)
```

### **Percentual de Diferença**
```typescript
percentualDiferenca = (diferenca / (valorEsperado + multas + juros)) × 100

Exemplos:
├─ +4,06%  → Acréscimo pequeno
├─ -21,96% → Atraso significativo
└─ -100%   → Não recolheu nada
```

### **Saldo em Atraso (se negativo)**
```typescript
if (diferenca < 0) {
  saldoAtraso = Math.abs(diferenca)
}

Exemplo: diferenca = -4.219,89
        saldoAtraso = R$ 4.219,89
```

### **Acréscimo Identificado (se positivo)**
```typescript
if (diferenca > 0) {
  acrescimoIdentificado = diferenca
}

Exemplo: diferenca = +780,11
        acrescimoIdentificado = R$ 780,11
```

---

## 🎨 VISUALIZAÇÃO DE ALERTAS POR STATUS

### **PAGO**
```
✅ PAGO QUITADO
   Valor: R$ 19.219,89
   Diferença: 0,00
   Status: Tudo correto
   
⭐ PAGO COM ACRESCIMO
   Valor esperado: R$ 19.219,89
   Recolhido: R$ 20.000,00
   Acréscimo: R$ 780,11 (+4,06%)
   Ação: Verificar se há compensação
```

### **PARCIAL**
```
⚠️ PARCIAL EM ATRASO
   Esperado: R$ 19.219,89
   Recolhido: R$ 15.000,00
   Faltam: R$ 4.219,89 (-21,96%)
   Pago: 78,04%
   Ação: Aguardar complemento
```

### **INADIMPLENTE**
```
❌ INADIMPLENTE
   Esperado: R$ 19.219,89
   Recolhido: R$ 0,00
   Faltam: R$ 19.219,89 (-100%)
   Ação: Cobrança necessária
```

### **PARCELADO**
```
📅 PARCELADO EM ANDAMENTO
   Valor parcelas: R$ 19.219,89
   Pago até agora: R$ 5.000,00
   Faltam: R$ 14.219,89 (-73,96%)
   Próxima parcela: [data]
   
📅 PARCELADO QUITADO
   Todas as parcelas: R$ 19.219,89 ✅
   Status: Acordo cumprido
```

### **RECOLHIMENTO A MAIOR**
```
💰 RECOLHIMENTO A MAIOR
   Esperado: R$ 19.219,89
   Recolhido: R$ 20.000,00
   Acréscimo: R$ 780,11 (+4,06%)
   Ação: Definir compensação
```

---

## 📋 ESTRUTURA DE DADOS PROPOSTA

### **Campo Adicional: ResultadoDiferenca**
```typescript
interface ResultadoDiferenca {
  diferenca: number;           // Valor da diferença
  percentual: number;           // Percentual em relação ao total
  status: "QUITADO" | "ATRASO" | "ACRESCIMO";
  saldoAtraso?: number;         // Se diferença < 0
  acrescimoIdentificado?: number; // Se diferença > 0
  mensagem: string;             // Descrição legível
}
```

### **Campo Adicional: StatusComDiferenca**
```typescript
interface StatusComDiferenca {
  statusPrincipal: LancamentoStatus;  // PAGO, PARCIAL, etc
  statusSecundario: string;            // QUITADO, EM_ATRASO, COM_ACRESCIMO
  diferenca: number;
  percentual: number;
  alertas: string[];  // Lista de alertas
}
```

---

## 🔧 MUDANÇAS NO CÓDIGO

### **1. Atualizar calcularLancamento()**
```typescript
// Arquivo: src/lib/calc/lancamento.ts

export function calcularLancamento(input: CalcInput): CalcResult {
  // ... cálculos existentes ...
  
  // NOVO: Calcular diferença
  const valorTotalEsperado = valorRecolher + multas + juros;
  const diferenca = valorRecolhido - valorTotalEsperado;
  const percentualDiferenca = (diferenca / valorTotalEsperado) * 100;
  
  // NOVO: Adicionar ao resultado
  return {
    // ... retornos existentes ...
    diferenca: Number(diferenca.toFixed(2)),
    percentualDiferenca: Number(percentualDiferenca.toFixed(2)),
    saldoAtraso: diferenca < 0 ? Math.abs(diferenca) : 0,
    acrescimoIdentificado: diferenca > 0 ? diferenca : 0,
  };
}
```

### **2. Criar calcularDiferenca() (Novo)**
```typescript
// Arquivo: src/lib/calc/lancamento-diferenca.ts

export function calcularDiferenca(
  valorEsperado: number,
  valorRecolhido: number,
  multas: number = 0,
  juros: number = 0
): ResultadoDiferenca {
  const totalEsperado = valorEsperado + multas + juros;
  const diferenca = valorRecolhido - totalEsperado;
  const percentual = (diferenca / totalEsperado) * 100;
  
  // Determinar subtipo
  let status: "QUITADO" | "ATRASO" | "ACRESCIMO";
  if (Math.abs(diferenca) < 0.01) {
    status = "QUITADO";
  } else if (diferenca < 0) {
    status = "ATRASO";
  } else {
    status = "ACRESCIMO";
  }
  
  return {
    diferenca: Number(diferenca.toFixed(2)),
    percentual: Number(percentual.toFixed(2)),
    status,
    saldoAtraso: diferenca < 0 ? Math.abs(diferenca) : undefined,
    acrescimoIdentificado: diferenca > 0 ? diferenca : undefined,
    mensagem: gerarMensagem(status, diferenca, percentual),
  };
}
```

### **3. Atualizar LancamentoInitial Interface**
```typescript
export interface LancamentoInitial {
  // ... campos existentes ...
  
  // NOVO: Diferença e acréscimo calculados
  diferenca?: number;
  percentualDiferenca?: number;
  saldoAtraso?: number;
  acrescimoIdentificado?: number;
}
```

---

## 📊 EXEMPLOS PRÁTICOS COM NOVA LÓGICA

### **Exemplo 1: PAGO QUITADO**
```
Base: R$ 137.284,80
Alíquota: 14%
Esperado: R$ 19.219,89
Recolhido: R$ 19.219,89
Multas: R$ 0,00
Juros: R$ 0,00
Parcelado: NÃO

Cálculos:
├─ Valor Total Esperado = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 19.219,89 - 19.219,89 = R$ 0,00
├─ Percentual = (0,00 / 19.219,89) × 100 = 0,00%
└─ Saldo Atraso = 0 (não aplicável)

STATUS: PAGO ✅ (Principal)
SUBTIPO: QUITADO ✅ (Secundário)
ALERTA: "Valor correto - sem variações"
```

### **Exemplo 2: PARCIAL EM ATRASO**
```
Base: R$ 137.284,80
Alíquota: 14%
Esperado: R$ 19.219,89
Recolhido: R$ 15.000,00
Multas: R$ 0,00
Juros: R$ 0,00
Parcelado: NÃO

Cálculos:
├─ Valor Total Esperado = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 15.000,00 - 19.219,89 = R$ -4.219,89
├─ Percentual = (-4.219,89 / 19.219,89) × 100 = -21,96%
└─ Saldo Atraso = R$ 4.219,89

STATUS: PARCIAL ⚠️ (Principal)
SUBTIPO: EM ATRASO ⚠️ (Secundário)
ALERTA: "Faltam R$ 4.219,89 (21,96% abaixo)"
```

### **Exemplo 3: PAGO COM ACRESCIMO**
```
Base: R$ 137.284,80
Alíquota: 14%
Esperado: R$ 19.219,89
Recolhido: R$ 20.000,00
Multas: R$ 0,00
Juros: R$ 0,00
Parcelado: NÃO

Cálculos:
├─ Valor Total Esperado = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 20.000,00 - 19.219,89 = R$ +780,11
├─ Percentual = (+780,11 / 19.219,89) × 100 = +4,06%
└─ Acréscimo Identificado = R$ 780,11

STATUS: PAGO ✅ (Principal)
SUBTIPO: COM ACRESCIMO ⭐ (Secundário)
ALERTA: "Recolheu R$ 780,11 a mais (4,06% acima)"
```

### **Exemplo 4: PARCELADO EM ANDAMENTO**
```
Base: R$ 137.284,80
Alíquota: 14%
Esperado: R$ 19.219,89
Recolhido: R$ 5.000,00 (1ª parcela)
Multas: R$ 0,00
Juros: R$ 0,00
Parcelado: SIM

Cálculos:
├─ Valor Total Esperado = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 5.000,00 - 19.219,89 = R$ -14.219,89
├─ Percentual = (-14.219,89 / 19.219,89) × 100 = -73,96%
└─ Saldo Atraso = R$ 14.219,89

STATUS: PARCELADO 📅 (Principal)
SUBTIPO: EM ANDAMENTO 📅 (Secundário)
ALERTA: "1ª parcela recebida. Faltam R$ 14.219,89 em 4 parcelas"
```

### **Exemplo 5: RECOLHIMENTO A MAIOR**
```
Base: R$ 137.284,80
Alíquota: 14%
Esperado: R$ 19.219,89
Recolhido: R$ 22.000,00
Multas: R$ 0,00
Juros: R$ 0,00
Parcelado: NÃO

Cálculos:
├─ Valor Total Esperado = 19.219,89 + 0 + 0 = R$ 19.219,89
├─ Diferença = 22.000,00 - 19.219,89 = R$ +2.780,11
├─ Percentual = (+2.780,11 / 19.219,89) × 100 = +14,46%
└─ Acréscimo Identificado = R$ 2.780,11

STATUS: RECOLHIMENTO A MAIOR 💰 (Principal)
SUBTIPO: COM ACRESCIMO ⭐ (Secundário)
ALERTA: "Recolheu R$ 2.780,11 a mais (14,46% acima)"
```

---

## 📈 MATRIZ DE DECISÃO

```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│   STATUS    │ QUITADO      │ EM ATRASO    │ COM ACRESCIMO│
│             │ (Dif = 0)    │ (Dif < 0)    │ (Dif > 0)    │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ PAGO        │ PAGO QUITADO │ ❌ NÃO OCORRE│ PAGO + ACRESC│
│             │ ✅ Exato     │              │ ⭐ Excedente │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ PARCIAL     │ PARCIAL OK   │ PARCIAL ATRSO│ ❌ NÃO OCORRE│
│             │ ✅ Parcela OK│ ⚠️ Falta $   │              │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ INADIMPLENT │ ❌ NÃO OCORRE│ INADIMPLENTE │ ❌ NÃO OCORRE│
│             │              │ ❌ Nada pago │              │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ PARCELADO   │ PARCEL QUIT  │ PARCEL ANDA  │ PARCEL ACRESC│
│             │ ✅ Quitado   │ 📅 Em pgto   │ ⭐ Antecipa  │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ SEM_MOVIM   │ ❌ NÃO OCORRE│ SEM_MOVIMENT │ ❌ NÃO OCORRE│
│             │              │ ⏸️ Aguardando│              │
├─────────────┼──────────────┼──────────────┼──────────────┤
│ RECOLH_MOR  │ ❌ NÃO OCORRE│ ❌ NÃO OCORRE│ RECOLH_MOR OK│
│             │              │              │ 💰 Excedente │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Funções de Cálculo (3h)**
- [ ] Atualizar calcularLancamento() com diferença
- [ ] Criar calcularDiferenca() novo
- [ ] Criar gerarMensagemDiferenca()
- [ ] Testes unitários dos cálculos

### **Fase 2: Componentes Visuais (2h)**
- [ ] AlertaDiferenca com cores (verde/vermelho/amarelo)
- [ ] Card de resumo (Esperado | Recolhido | Diferença)
- [ ] Labels para cada subtipo

### **Fase 3: Integração no Formulário (2h)**
- [ ] Adicionar useMemo de diferença
- [ ] Integrar AlertaDiferenca
- [ ] Integrar Card de resumo
- [ ] Testar fluxo completo

### **Fase 4: Banco de Dados (1h)**
- [ ] Adicionar colunas ao schema
- [ ] Criar migration
- [ ] Atualizar seed se necessário

### **Fase 5: UI/UX & Testes (2h)**
- [ ] Refinar mensagens
- [ ] Ajustar cores e ícones
- [ ] Testes e2e

**Total: 10 horas**

---

## 🎯 BENEFÍCIOS

✅ Sistema automático (sem entrada manual)  
✅ Diferença visível em todos os status  
✅ Alertas contextuais (ação recomendada)  
✅ Rastreamento de acréscimo  
✅ Melhor visibilidade de atrasos  
✅ Interface intuitiva com cores  
✅ Dados para auditoria  
