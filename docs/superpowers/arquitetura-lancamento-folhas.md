# Arquitetura de Campos e Cálculos - Lançamento com Folhas Dinâmicas

## 📊 Estrutura de Tabelas

### Tabela: FolhaPrevidenciaria (Lançamento)

**Campos de Identificação:**
```
id                    INT PK
orgaoId              INT FK
tipo                 ENUM (PATRONAL, SEGURADO)
exercicioId          INT FK
competenciaId        INT FK
```

**Campos de Controle:**
```
status               ENUM (LANCADO, PAGO, PARCIAL, INADIMPLENTE)
responsavelId        INT FK
dataEmissao          DATE
dataVencimento       DATE
observacoes          TEXT
```

**Campos de Cálculo Consolidado:**
```
folhaTotal           DECIMAL (SUM de todas as folhas)
totalDevido          DECIMAL (SUM de todas as contribuições)
totalRecolhido       DECIMAL (SUM de todos os recolhidos)
deficitTotal         DECIMAL (totalDevido - totalRecolhido)
```

---

### Tabela: LancamentoFolha (Detalhe por Tipo)

**Para CADA tipo de folha, armazenar:**
```
id                   INT PK
lancamentoId         INT FK
tipoFolhaId          INT FK (Base, Suplementar, 13º, etc)

-- ENTRADA DO USUÁRIO:
valor                DECIMAL (valor da folha)

-- CÁLCULOS:
baseCalculo          DECIMAL (mesmo que valor, mas explícito)
aliquota             DECIMAL (%)
contribuicaoDevida   DECIMAL (baseCalculo × aliquota / 100)
valorRecolhido       DECIMAL (entrada do usuário)
diferenca            DECIMAL (contribuicaoDevida - valorRecolhido)

-- METADADOS:
createdAt            DATETIME
updatedAt            DATETIME
```

---

## 🧮 Cálculos por Tipo de Folha

### Fluxo de Cálculo para CADA LancamentoFolha:

```
┌─────────────────────────────────────────┐
│ 1. ENTRADA: Valor da Folha              │
│    (usuário preenche)                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 2. BASE CÁLCULO = Valor da Folha        │
│    (cópia do valor, para rastreamento)  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 3. ALÍQUOTA (%)                         │
│    - Servidor: 10% (fixo por tipo)      │
│    - Patronal: 15% (fixo por tipo)      │
│    - Suplementar: mesma do tipo base    │
│    - 13º: mesma do tipo base            │
│    - Rescisão: mesma do tipo base       │
│    - Retroativa: mesma do tipo base     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 4. CONTRIBUIÇÃO DEVIDA                  │
│    = Base Cálculo × Alíquota / 100      │
│    (CALCULADO AUTOMATICAMENTE)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 5. ENTRADA: Valor Recolhido             │
│    (usuário preenche)                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ 6. DIFERENÇA                            │
│    = Contribuição Devida - Valor        │
│      Recolhido                          │
│    (CALCULADO AUTOMATICAMENTE)          │
└─────────────────────────────────────────┘
```

---

## 📐 Exemplo Prático Completo

### Lançamento PATRONAL - Fevereiro/2026 - SEMAD

**Entrada do usuário:**

| Tipo | Valor Folha | Valor Recolhido |
|------|-------------|-----------------|
| Base | R$ 50.000 | R$ 7.500 |
| Suplementar | R$ 10.000 | R$ 1.500 |
| 13º | R$ 5.000 | R$ 750 |

**Cálculos automáticos por tipo:**

#### 1. Folha BASE (Patronal)
```
Base Cálculo:        R$ 50.000,00
Alíquota:            15% (Patronal fixo)
Contribuição Devida: R$ 50.000 × 15 / 100 = R$ 7.500,00
Valor Recolhido:     R$ 7.500,00 (entrada)
Diferença:           R$ 7.500 - R$ 7.500 = R$ 0,00 ✅
```

#### 2. Folha SUPLEMENTAR (Patronal)
```
Base Cálculo:        R$ 10.000,00
Alíquota:            15% (igual ao tipo base - Patronal)
Contribuição Devida: R$ 10.000 × 15 / 100 = R$ 1.500,00
Valor Recolhido:     R$ 1.500,00 (entrada)
Diferença:           R$ 1.500 - R$ 1.500 = R$ 0,00 ✅
```

#### 3. Folha 13º (Patronal)
```
Base Cálculo:        R$ 5.000,00
Alíquota:            15% (igual ao tipo base - Patronal)
Contribuição Devida: R$ 5.000 × 15 / 100 = R$ 750,00
Valor Recolhido:     R$ 750,00 (entrada)
Diferença:           R$ 750 - R$ 750 = R$ 0,00 ✅
```

**Consolidado no Lançamento:**
```
┌─────────────────────────────────────┐
│ TOTALIZADORES                       │
├─────────────────────────────────────┤
│ Folha Total:      R$ 65.000,00      │
│ Contribuição Dev.: R$ 9.750,00      │
│ Valor Recolhido:  R$ 9.750,00       │
│ Déficit Total:    R$ 0,00 ✅        │
└─────────────────────────────────────┘
```

---

## 🎯 Campos do Formulário (como preenchimento)

### Seção 1: IDENTIFICAÇÃO
```
☑ Órgão (select)
☑ Tipo (PATRONAL / SEGURADO) - radio
☑ Exercício (auto, 2026)
☑ Competência (select, Fevereiro)
☑ Responsável (auto, do login)
```

### Seção 2: TIPOS DE FOLHA (dinâmico)
```
┌─ FOLHA BASE (OBRIGATÓRIA) ────────┐
│ Valor da Folha Base:  ___,__       │ ← entrada
│ → Alíquota:          15% (P) 10% (S)│ ← cálculo
│ → Contribuição Devida: ___,__ (auto)│
│ Valor Recolhido:      ___,__       │ ← entrada
│ → Diferença:          ___,__ (auto)│
└────────────────────────────────────┘

┌─ FOLHA SUPLEMENTAR (opcional) ────┐
│ Valor da Folha:       ___,__       │ ← entrada
│ → Alíquota:          15% (P) 10% (S)│ ← mesmo base
│ → Contribuição Devida: ___,__ (auto)│
│ Valor Recolhido:      ___,__       │ ← entrada
│ → Diferença:          ___,__ (auto)│
│ [X] Remover                        │
└────────────────────────────────────┘

[+ Adicionar tipo de folha]

[Criar novo tipo personalizado]
```

### Seção 3: CONTROLE
```
☑ Data Emissão (DATE)
☑ Data Vencimento (DATE)
☑ Status (LANCADO)
☑ Observações (TEXT)
```

### Seção 4: RESUMO (ReadOnly)
```
─────────────────────────────────
Folha Total:           R$ 65.000,00
Total Contribuição Dev: R$ 9.750,00
Total Recolhido:       R$ 9.750,00
Déficit:               R$ 0,00
─────────────────────────────────
```

---

## 🔄 Regras de Cálculo (APLICADAS A TODOS OS TIPOS)

### Para CADA LancamentoFolha:

✅ **Regra 1: Alíquota por Tipo**
- Se tipo = Base → usar alíquota do Lançamento (PATRONAL 15%, SEGURADO 10%)
- Se tipo = Suplementar → usar mesma alíquota da Base
- Se tipo = 13º → usar mesma alíquota da Base
- Se tipo = Rescisão → usar mesma alíquota da Base
- Se tipo = Retroativa → usar mesma alíquota da Base
- Se tipo = Customizado → usuário define ou usa da Base

✅ **Regra 2: Contribuição Devida**
```
Para cada folha:
contribuição = valor_folha × alíquota / 100
(SEM arredondamento até o final)
```

✅ **Regra 3: Diferença**
```
Para cada folha:
diferença = contribuição_devida - valor_recolhido
- Positivo = débito (falta recolher)
- Negativo = crédito (recebeu mais)
- Zero = quitado
```

✅ **Regra 4: Totalizadores (SUM de todos os tipos)**
```
folhaTotal        = SUM(valor_folha)
totalDevido       = SUM(contribuição_devida)
totalRecolhido    = SUM(valor_recolhido)
deficitTotal      = SUM(diferença)
```

---

## 💾 Schema SQL Detalhado

```sql
-- Lançamento (Consolidador)
CREATE TABLE folhas_previdenciarias (
  id INT PRIMARY KEY,
  orgao_id INT NOT NULL,
  tipo ENUM('PATRONAL', 'SEGURADO'),
  exercicio_id INT NOT NULL,
  competencia_id INT NOT NULL,
  status ENUM('LANCADO', 'PAGO', 'PARCIAL', 'INADIMPLENTE'),
  
  -- Consolidados
  folha_total DECIMAL(18,2),      -- SUM(lancamento_folhas.valor)
  total_devido DECIMAL(18,2),     -- SUM(lancamento_folhas.contribuicao_devida)
  total_recolhido DECIMAL(18,2),  -- SUM(lancamento_folhas.valor_recolhido)
  deficit_total DECIMAL(18,2),    -- SUM(lancamento_folhas.diferenca)
  
  created_at DATETIME,
  updated_at DATETIME
);

-- Detalhes por tipo de folha
CREATE TABLE lancamento_folhas (
  id INT PRIMARY KEY,
  lancamento_id INT NOT NULL,
  tipo_folha_id INT NOT NULL,
  
  -- Entrada
  valor DECIMAL(18,2) NOT NULL,              -- Folha Base, Suplementar, etc
  
  -- Cálculos
  base_calculo DECIMAL(18,2),                -- Cópia de 'valor'
  aliquota DECIMAL(5,2),                     -- % (10.00, 15.00)
  contribuicao_devida DECIMAL(18,2),        -- valor × aliquota / 100
  valor_recolhido DECIMAL(18,2),            -- Entrada do usuário
  diferenca DECIMAL(18,2),                   -- contribuicao_devida - valor_recolhido
  
  created_at DATETIME,
  updated_at DATETIME,
  
  FOREIGN KEY (lancamento_id) REFERENCES folhas_previdenciarias(id),
  FOREIGN KEY (tipo_folha_id) REFERENCES tipos_folha(id),
  UNIQUE(lancamento_id, tipo_folha_id)
);
```

---

## 🔍 Triggers / Recalculos (Automáticos)

Quando LancamentoFolha é criada/atualizada:
```
1. Recalcular contribuição_devida = valor × aliquota / 100
2. Recalcular diferença = contribuição_devida - valor_recolhido
3. Atualizar totais em FolhaPrevidenciaria:
   - folha_total = SUM(lancamento_folhas.valor)
   - total_devido = SUM(lancamento_folhas.contribuição_devida)
   - total_recolhido = SUM(lancamento_folhas.valor_recolhido)
   - deficit_total = SUM(lancamento_folhas.diferença)
```

---

## ✨ Resumo da Arquitetura

| Responsabilidade | Onde | Automático? |
|---|---|---|
| Valor da Folha | LancamentoFolha | ❌ Entrada usuário |
| Alíquota | LancamentoFolha | ✅ Herda do tipo base |
| Contribuição | LancamentoFolha | ✅ Cálculo automático |
| Recolhido | LancamentoFolha | ❌ Entrada usuário |
| Diferença | LancamentoFolha | ✅ Cálculo automático |
| Folha Total | Lançamento | ✅ SUM automático |
| Total Devido | Lançamento | ✅ SUM automático |
| Total Recolhido | Lançamento | ✅ SUM automático |
| Déficit Total | Lançamento | ✅ SUM automático |
