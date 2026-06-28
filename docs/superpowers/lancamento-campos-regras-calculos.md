# Lançamento: Campos, Regras e Cálculos Detalhados

## 📊 ESTRUTURA COMPLETA DO BANCO

### Tabela 1: FolhaPrevidenciaria (Lançamento)

```sql
CREATE TABLE folhas_previdenciarias (
  -- IDENTIFICAÇÃO
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  orgao_id              INT NOT NULL,                    -- FK para órgão
  tipo                  ENUM('PATRONAL', 'SEGURADO'),   -- Define alíquota base
  exercicio_id          INT NOT NULL,                    -- Ano fiscal
  competencia_id        INT NOT NULL,                    -- Mês (1-12)
  
  -- CONTROLE
  status                ENUM('LANCADO', 'PAGO', 'PARCIAL', 'INADIMPLENTE'),
  responsavel_id        INT,                             -- User que criou
  data_emissao          DATE,
  data_vencimento       DATE,
  observacoes           TEXT,
  
  -- CONSOLIDADOS (SUM de lancamento_folhas)
  folha_total           DECIMAL(18,2) NOT NULL DEFAULT 0,        -- SUM(valor)
  total_a_recolher      DECIMAL(18,2) NOT NULL DEFAULT 0,        -- SUM(valorARecolher)
  total_recolhido       DECIMAL(18,2) NOT NULL DEFAULT 0,        -- SUM(valorRecolhido)
  deficit_total         DECIMAL(18,2) NOT NULL DEFAULT 0,        -- SUM(diferenca)
  
  -- METADADOS
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (orgao_id) REFERENCES orgaos(id),
  FOREIGN KEY (exercicio_id) REFERENCES exercicios(id),
  FOREIGN KEY (competencia_id) REFERENCES competencias(id),
  FOREIGN KEY (responsavel_id) REFERENCES users(id),
  UNIQUE KEY (orgao_id, tipo, exercicio_id, competencia_id),
  INDEX idx_status (status)
);
```

### Tabela 2: LancamentoFolha (Detalhe por Tipo)

```sql
CREATE TABLE lancamento_folhas (
  -- IDENTIFICAÇÃO
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  lancamento_id         INT NOT NULL,                    -- FK para Lançamento
  tipo_folha_id         INT NOT NULL,                    -- FK para tipo (Base, Suplementar, 13º, etc)
  
  -- ENTRADA DO USUÁRIO
  valor                 DECIMAL(18,2) NOT NULL,         -- Valor da folha (Base, Supl, 13º, etc)
  valor_recolhido       DECIMAL(18,2) NOT NULL,         -- Quanto entrou no caixa
  
  -- CÁLCULOS (Automáticos)
  aliquota              DECIMAL(5,2) NOT NULL,          -- Herdada do tipo Lançamento (10.00, 15.00)
  valor_a_recolher      DECIMAL(18,2) NOT NULL,         -- valor × aliquota / 100 (AUTO)
  diferenca             DECIMAL(18,2) NOT NULL,         -- valor_a_recolher - valor_recolhido (AUTO)
  
  -- METADADOS
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (lancamento_id) REFERENCES folhas_previdenciarias(id) ON DELETE CASCADE,
  FOREIGN KEY (tipo_folha_id) REFERENCES tipos_folha(id),
  UNIQUE KEY (lancamento_id, tipo_folha_id),
  INDEX idx_lancamento (lancamento_id),
  INDEX idx_tipo_folha (tipo_folha_id)
);
```

### Tabela 3: TipoFolha (Catálogo)

```sql
CREATE TABLE tipos_folha (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  nome                  VARCHAR(50) NOT NULL UNIQUE,    -- Base, Suplementar, 13º, Rescisão, Retroativa, Complementar
  descricao             VARCHAR(200),
  ordem                 INT DEFAULT 0,                  -- Ordem de exibição
  obrigatorio           BOOLEAN DEFAULT FALSE,          -- Base = true, outros = false
  customizado           BOOLEAN DEFAULT FALSE,          -- true se criado pelo usuário
  ativo                 BOOLEAN DEFAULT TRUE,
  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_nome (nome)
);
```

---

## 📋 CAMPOS DETALHADOS

### FolhaPrevidenciaria (Lançamento)

| Campo | Tipo | Obrigatório | Descrição | Regra |
|-------|------|-------------|-----------|-------|
| `id` | INT | ✅ | Identificador único | Auto-gerado |
| `orgaoId` | INT FK | ✅ | Órgão responsável | Deve existir em órgãos |
| `tipo` | ENUM | ✅ | PATRONAL ou SEGURADO | Define alíquota (PATRONAL 15%, SEGURADO 10%) |
| `exercicioId` | INT FK | ✅ | Ano fiscal (2026) | Deve existir em exercícios |
| `competenciaId` | INT FK | ✅ | Mês (1-12) | Deve existir em competências |
| `status` | ENUM | ✅ | Estado do lançamento | LANCADO, PAGO, PARCIAL, INADIMPLENTE |
| `responsavelId` | INT FK | ❌ | User que criou | Referencia users |
| `dataEmissao` | DATE | ❌ | Data de emissão da guia | Sistema usa TODAY() se não informada |
| `dataVencimento` | DATE | ❌ | Data de vencimento | Opcional |
| `observacoes` | TEXT | ❌ | Anotações livres | Até 1000 caracteres |
| `folhaTotal` | DECIMAL | ✅ | Total de todas as folhas | **AUTO**: SUM(lancamento_folhas.valor) |
| `totalARecolher` | DECIMAL | ✅ | Total a recolher | **AUTO**: SUM(lancamento_folhas.valor_a_recolher) |
| `totalRecolhido` | DECIMAL | ✅ | Total recebido | **AUTO**: SUM(lancamento_folhas.valor_recolhido) |
| `deficitTotal` | DECIMAL | ✅ | Total de diferenças | **AUTO**: SUM(lancamento_folhas.diferenca) |
| `createdAt` | DATETIME | ✅ | Timestamp criação | Auto |
| `updatedAt` | DATETIME | ✅ | Timestamp última edição | Auto |

### LancamentoFolha (Detalhe por Tipo)

| Campo | Tipo | Obrigatório | Descrição | Regra |
|-------|------|-------------|-----------|-------|
| `id` | INT | ✅ | Identificador único | Auto-gerado |
| `lancamentoId` | INT FK | ✅ | Referência ao lançamento | ON DELETE CASCADE |
| `tipoFolhaId` | INT FK | ✅ | Tipo de folha | Base, Supl, 13º, etc |
| `valor` | DECIMAL | ✅ | Valor da folha | ≥ 0,00; 2 casas decimais |
| `valorRecolhido` | DECIMAL | ✅ | Quanto foi recebido | ≥ 0,00; 2 casas decimais |
| `aliquota` | DECIMAL | ✅ | % de contribuição | Herdada do tipo Lançamento |
| `valorARecolher` | DECIMAL | ✅ | Valor a recolher | **AUTO**: valor × aliquota / 100 |
| `diferenca` | DECIMAL | ✅ | Diferença | **AUTO**: valorARecolher - valorRecolhido |
| `createdAt` | DATETIME | ✅ | Timestamp criação | Auto |
| `updatedAt` | DATETIME | ✅ | Timestamp última edição | Auto |

---

## 🧮 CÁLCULOS DETALHADOS

### Fórmula 1: Valor a Recolher

```
├─ ENTRADA
│  ├─ valor (do usuário)
│  └─ aliquota (herdada do tipo Lançamento)
│
└─ CÁLCULO
   valor_a_recolher = ROUND((valor × aliquota / 100), 2)

EXEMPLO:
├─ valor = 10.000,00
├─ aliquota = 15%
└─ valor_a_recolher = ROUND((10000 × 15 / 100), 2) = 1.500,00
```

### Fórmula 2: Diferença

```
├─ ENTRADA
│  ├─ valor_a_recolher (calculado acima)
│  └─ valor_recolhido (do usuário)
│
└─ CÁLCULO
   diferenca = ROUND((valor_a_recolher - valor_recolhido), 2)

EXEMPLO:
├─ valor_a_recolher = 1.500,00
├─ valor_recolhido = 1.200,00
└─ diferenca = ROUND((1500 - 1200), 2) = 300,00
```

### Fórmula 3: Folha Total

```
├─ ORIGEM: SUM de LancamentoFolha.valor
│
└─ CÁLCULO
   folha_total = SUM(lancamento_folhas.valor)
   
EXEMPLO (3 tipos):
├─ Base:       10.000,00
├─ Suplemen:   5.000,00
├─ 13º:        2.000,00
└─ folha_total = 17.000,00
```

### Fórmula 4: Total a Recolher

```
├─ ORIGEM: SUM de LancamentoFolha.valor_a_recolher
│
└─ CÁLCULO
   total_a_recolher = SUM(lancamento_folhas.valor_a_recolher)

EXEMPLO (PATRONAL 15%):
├─ Base:       10.000 × 15% = 1.500,00
├─ Suplemen:   5.000 × 15% = 750,00
├─ 13º:        2.000 × 15% = 300,00
└─ total_a_recolher = 2.550,00
```

### Fórmula 5: Total Recolhido

```
├─ ORIGEM: SUM de LancamentoFolha.valor_recolhido
│
└─ CÁLCULO
   total_recolhido = SUM(lancamento_folhas.valor_recolhido)

EXEMPLO:
├─ Base recebido:       1.500,00
├─ Suplemen recebido:   750,00
├─ 13º recebido:        300,00
└─ total_recolhido = 2.550,00
```

### Fórmula 6: Deficit Total

```
├─ ORIGEM: SUM de LancamentoFolha.diferenca
│
└─ CÁLCULO
   deficit_total = SUM(lancamento_folhas.diferenca)

EXEMPLO:
├─ Base dif:       1.500 - 1.500 = 0,00
├─ Suplemen dif:   750 - 700 = 50,00
├─ 13º dif:        300 - 250 = 50,00
└─ deficit_total = 100,00
```

---

## ✅ REGRAS DE VALIDAÇÃO

### Ao Criar Lançamento:

```
┌─ OBRIGATORIEDADE ─────────────────┐
│ ✅ orgaoId (deve existir)         │
│ ✅ tipo (PATRONAL | SEGURADO)     │
│ ✅ exercicioId (deve existir)     │
│ ✅ competenciaId (deve existir)   │
│ ✅ folhas com Base obrigatória    │
│ ❌ dataEmissao (default TODAY())  │
│ ❌ responsavelId (default do auth)│
└───────────────────────────────────┘

┌─ UNICIDADE ───────────────────────┐
│ ✅ Não pode ter 2 lançamentos     │
│    mesmo (orgao, tipo, exercicio, │
│    competencia)                   │
└───────────────────────────────────┘

┌─ FOLHAS ──────────────────────────┐
│ ✅ Deve ter pelo menos 1 folha    │
│ ✅ Folha Base (tipo_folha_id=1)   │
│    é OBRIGATÓRIA                  │
│ ✅ Não pode ter 2 folhas do mesmo │
│    tipo no mesmo lançamento       │
│ ✅ Cada folha: valor ≥ 0,00       │
│ ✅ Cada folha: valorRecolhido≥0,00│
└───────────────────────────────────┘

┌─ VALORES MONETÁRIOS ──────────────┐
│ ✅ 2 casas decimais (DECIMAL 18,2)│
│ ✅ Não negativos                  │
│ ✅ Max 9.999.999.999.999,99       │
└───────────────────────────────────┘
```

### Ao Atualizar Lançamento:

```
┌─ CAMPOS IMUTÁVEIS ────────────────┐
│ 🔒 orgaoId                        │
│ 🔒 tipo                           │
│ 🔒 exercicioId                    │
│ 🔒 competenciaId                  │
│ (não podem ser editados)          │
└───────────────────────────────────┘

┌─ CAMPOS EDITÁVEIS ────────────────┐
│ ✏️ folhas (valores e tipos)       │
│ ✏️ status                         │
│ ✏️ dataVencimento                 │
│ ✏️ observacoes                    │
│ (recalcula totalizadores)         │
└───────────────────────────────────┘
```

### Ao Deletar Lançamento:

```
┌─ REGRAS ──────────────────────────┐
│ ✅ Cascata: deleta lancamento_    │
│    folhas automaticamente         │
│ ✅ Registra em audit_log          │
│ ✅ Requer role GESTOR             │
└───────────────────────────────────┘
```

---

## 🎯 FLUXO COMPLETO DE CÁLCULO

```
┌─────────────────────────────────────────────────────┐
│ USUÁRIO PREENCHE LANÇAMENTO                         │
└──────────────────┬──────────────────────────────────┘
                   ↓
     ┌─────────────────────────────────────┐
     │ Para CADA Folha Adicionada:         │
     └──────────────┬──────────────────────┘
                    ↓
        ┌──────────────────────────────┐
        │ 1. Recebe valor              │
        │ 2. Copia aliquota do tipo Lç.│
        │ 3. Calcula valorARecolher    │
        │    = valor × aliquota / 100  │
        │ 4. Recebe valorRecolhido     │
        │ 5. Calcula diferenca         │
        │    = valorARecolher - receb  │
        └──────────────┬───────────────┘
                       ↓
     ┌─────────────────────────────────────┐
     │ Quando Todas as Folhas Prontas:     │
     └──────────────┬──────────────────────┘
                    ↓
        ┌──────────────────────────────┐
        │ Lançamento Recalcula:        │
        │ 1. folhaTotal = SUM(valor)   │
        │ 2. totalARecolher=SUM(valor  │
        │    aRecolher)                │
        │ 3. totalRecolhido=SUM(receb) │
        │ 4. deficitTotal=SUM(diferç) │
        └──────────────┬───────────────┘
                       ↓
            ┌──────────────────────────┐
            │ SALVA NO BANCO DADOS     │
            │ ✅ Pronto para consultar │
            └──────────────────────────┘
```

---

## 📝 EXEMPLO PRÁTICO COMPLETO

### Entrada: Lançamento PATRONAL - Fevereiro/2026

**User preenche:**

| Tipo | Valor Folha | Valor Recebido |
|------|-------------|---|
| Base | 50.000,00 | 48.000,00 |
| Suplementar | 10.000,00 | 10.000,00 |
| 13º | 5.000,00 | 5.000,00 |

**Sistema calcula automaticamente:**

#### LancamentoFolha 1 (Base)
```
Entrada:
├─ valor = 50.000,00
├─ valor_recolhido = 48.000,00
└─ aliquota = 15 (PATRONAL)

Cálculos:
├─ valor_a_recolher = 50.000 × 15 / 100 = 7.500,00
└─ diferenca = 7.500 - 48.000 = -40.500,00 (crédito)
```

#### LancamentoFolha 2 (Suplementar)
```
Entrada:
├─ valor = 10.000,00
├─ valor_recolhido = 10.000,00
└─ aliquota = 15 (PATRONAL)

Cálculos:
├─ valor_a_recolher = 10.000 × 15 / 100 = 1.500,00
└─ diferenca = 1.500 - 10.000 = -8.500,00 (crédito)
```

#### LancamentoFolha 3 (13º)
```
Entrada:
├─ valor = 5.000,00
├─ valor_recolhido = 5.000,00
└─ aliquota = 15 (PATRONAL)

Cálculos:
├─ valor_a_recolher = 5.000 × 15 / 100 = 750,00
└─ diferenca = 750 - 5.000 = -4.250,00 (crédito)
```

#### FolhaPrevidenciaria (Consolidado)
```
Totalizadores Automáticos:
├─ folhaTotal = 50.000 + 10.000 + 5.000 = 65.000,00
├─ totalARecolher = 7.500 + 1.500 + 750 = 9.750,00
├─ totalRecolhido = 48.000 + 10.000 + 5.000 = 63.000,00
└─ deficitTotal = -40.500 + -8.500 + -4.250 = -53.250,00

📊 RESUMO:
   Folha Total:        R$ 65.000,00
   Total a Recolher:   R$ 9.750,00
   Total Recebido:     R$ 63.000,00
   Status:             CRÉDITO de R$ 53.250,00 ✅
```

---

## 🔄 TRIGGER / RECÁLCULO AUTOMÁTICO

### Quando LancamentoFolha é criada/atualizada:

```sql
TRIGGER on lancamento_folhas AFTER INSERT/UPDATE:
  1. Recalcular valor_a_recolher = valor × aliquota / 100
  2. Recalcular diferenca = valor_a_recolher - valor_recolhido
  
TRIGGER on lancamento_folhas AFTER INSERT/UPDATE/DELETE:
  1. UPDATE folhas_previdenciarias SET
       folha_total = (SELECT SUM(valor) FROM lancamento_folhas WHERE lancamento_id = XX),
       total_a_recolher = (SELECT SUM(valor_a_recolher) FROM lancamento_folhas WHERE lancamento_id = XX),
       total_recolhido = (SELECT SUM(valor_recolhido) FROM lancamento_folhas WHERE lancamento_id = XX),
       deficit_total = (SELECT SUM(diferenca) FROM lancamento_folhas WHERE lancamento_id = XX)
     WHERE id = XX
```

Ou, se preferir no Application Layer (Prisma/Service):

```typescript
async function recalcularLancamento(lancamentoId: number) {
  const folhas = await prisma.lancamentoFolha.findMany({
    where: { lancamentoId }
  });

  const folhaTotal = folhas.reduce((s, f) => s + f.valor, 0);
  const totalARecolher = folhas.reduce((s, f) => s + f.valorARecolher, 0);
  const totalRecolhido = folhas.reduce((s, f) => s + f.valorRecolhido, 0);
  const deficitTotal = folhas.reduce((s, f) => s + f.diferenca, 0);

  await prisma.folhaPrevidenciaria.update({
    where: { id: lancamentoId },
    data: { folhaTotal, totalARecolher, totalRecolhido, deficitTotal }
  });
}
```
