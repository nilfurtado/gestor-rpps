# Folha Suplementar v2 - Plano Detalhado com Cálculos

> **Documentação Completa:** Configuração de campos, impacto nos cálculos, antes e depois.

---

## 1. CONFIGURAÇÃO DE CAMPOS

### 1.1 Campo Novo: `folhaSuplementar`

**Localização:** Tabela `FolhaPrevidenciaria`

**Definição Prisma:**
```prisma
model FolhaPrevidenciaria {
  // ... campos existentes ...
  
  folhaBase               Decimal?        @default(0)      // Existente
  folhaSuplementar        Decimal?        @default(0)      // NOVO
  
  // ... resto dos campos ...
}
```

**Especificação do Campo:**
- **Nome:** `folhaSuplementar`
- **Tipo:** `Decimal` (banco de dados)
- **Precisão:** 10 dígitos, 2 casas decimais (ex: 9999999,99)
- **Padrão:** 0 (zero)
- **Nulo:** SIM (pode ser null)
- **Validação:** >= 0 (não negativo)
- **Editável:** SIM (sempre editável)
- **Obrigatório:** NÃO (campo opcional)
- **Visível:** SIM (sempre mostrado na UI)

**UI - Input:**
```tsx
<div>
  <Label htmlFor="folha-suplementar">
    Folha Suplementar (R$)
    <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
  </Label>
  <Input
    id="folha-suplementar"
    type="number"
    step="0.01"
    min="0"
    max="999999.99"
    value={folhaSuplementar}
    onChange={(e) => setFolhaSuplementar(parseFloat(e.target.value) || 0)}
    placeholder="0,00"
    className="font-mono"
  />
</div>
```

---

### 1.2 Campo Derivado (Calculado): `folhaTotal`

**Localização:** Não é armazenado no BD, apenas calculado na exibição

**Definição:**
- **Nome:** `folhaTotal`
- **Tipo:** `Decimal` (calculado)
- **Fórmula:** `folhaBase + folhaSuplementar`
- **Armazenado:** NÃO (apenas em memória/exibição)
- **Editável:** NÃO (somente leitura)
- **Visível:** SIM (sempre mostrado)

**UI - Display:**
```tsx
<div>
  <Label htmlFor="folha-total">
    Folha Total (R$)
    <span className="text-muted-foreground text-xs ml-1">(calculado)</span>
  </Label>
  <Input
    id="folha-total"
    type="number"
    step="0.01"
    value={folhaBase + folhaSuplementar}
    disabled
    className="bg-primary/5 font-mono font-semibold"
  />
</div>
```

---

### 1.3 Campo Existente Recalculado: `valorRecolherCalculado`

**Localização:** Tabela `FolhaPrevidenciaria` (já existe)

**Definição Prisma (Existente):**
```prisma
valorRecolherCalculado  Decimal          @default(0)
```

**Mudança de Fórmula:**

**ANTES (v1):**
```
valorRecolherCalculado = folhaBase × aliquota ÷ 100
```

**DEPOIS (v2):**
```
valorRecolherCalculado = (folhaBase + folhaSuplementar) × aliquota ÷ 100
valorRecolherCalculado = folhaTotal × aliquota ÷ 100
```

**Impacto:**
- Campo EXISTENTE muda seu valor de cálculo
- Agora inclui o suplementar na fórmula
- Deve ser atualizado SEMPRE que folhaSuplementar muda
- Armazenado no banco (persiste)

**UI - Display (Atualizado):**
```tsx
<div>
  <Label htmlFor="valor-recolher-calculado">
    Valor a Recolher Calculado (R$)
    <span className="text-muted-foreground text-xs ml-1">(incluindo suplementar)</span>
  </Label>
  <Input
    id="valor-recolher-calculado"
    type="number"
    step="0.01"
    value={folhaTotal * (aliquota / 100)}
    disabled
    className="bg-success/5 font-mono font-semibold"
  />
</div>
```

---

## 2. IMPACTO NOS CÁLCULOS - ANTES vs DEPOIS

### 2.1 Exemplo Numérico Completo

#### CENÁRIO 1: SEM Folha Suplementar (v1 e v2 iguais)

**Dados de Entrada:**
- Folha Base: **R$ 5.000,00**
- Folha Suplementar: **R$ 0,00** (ou não preenchido)
- Aliquota: **20%**

**ANTES (v1):**
```
folhaTotal              = folhaBase = 5.000,00
valorRecolherCalculado  = 5.000,00 × 20 ÷ 100 = 1.000,00
```

**DEPOIS (v2):**
```
folhaTotal              = 5.000,00 + 0,00 = 5.000,00
valorRecolherCalculado  = 5.000,00 × 20 ÷ 100 = 1.000,00
```

**Resultado:** ✅ IGUAL (backward compatible)

---

#### CENÁRIO 2: COM Folha Suplementar (mudança real)

**Dados de Entrada:**
- Folha Base: **R$ 5.000,00**
- Folha Suplementar: **R$ 1.500,00** (NOVO)
- Aliquota: **20%**

**ANTES (v1) - NÃO CONSIDERAVA SUPLEMENTAR:**
```
folhaTotal              = 5.000,00
valorRecolherCalculado  = 5.000,00 × 20 ÷ 100 = 1.000,00
❌ Suplementar de 1.500,00 era IGNORADO
```

**DEPOIS (v2) - INCLUI SUPLEMENTAR:**
```
folhaTotal              = 5.000,00 + 1.500,00 = 6.500,00
valorRecolherCalculado  = 6.500,00 × 20 ÷ 100 = 1.300,00
✅ Diferença adicionada: +300,00
```

**Impacto Financeiro:**
```
Valor a Recolher ANTES:  1.000,00
Valor a Recolher DEPOIS: 1.300,00
Diferença:               +300,00 (30% a mais)
```

---

### 2.2 Impacto em Cascata nos Campos Existentes

#### Campos Afetados Diretamente:

| Campo | Antes | Depois | Fórmula Atualizada |
|-------|-------|--------|-------------------|
| **valorRecolherCalculado** | 1.000,00 | 1.300,00 | `folhaTotal × aliquota ÷ 100` |
| **deficit** | Recalculado | **MUDA** | `valorRecolher - folhaTotal` |
| **inadimplencia** | Recalculada | **MUDA** | `deficit ÷ valorRecolher × 100` |
| **percentualPago** | Recalculado | **MUDA** | `valorRecolhido ÷ valorRecolherCalculado × 100` |
| **valorTotalDevido** | Recalculado | **MUDA** | `deficit + multas + juros` |

#### Exemplo Completo com Impacto em Cascata:

**Dados Originais:**
```
folhaBase                  = 5.000,00
valorRecolher (esperado)   = 1.000,00  (calculado pela folha)
aliquota                   = 20%
valorRecolhido             = 500,00    (já foi recolhido)
multas                     = 50,00
juros                      = 20,00
```

**CENÁRIO A: SEM Suplementar**
```
folhaTotal                 = 5.000,00
valorRecolherCalculado     = 1.000,00
deficit                    = 1.000,00 - 1.000,00 = 0,00 ✅ (ok)
valorRecolhido             = 500,00
percentualPago             = 500,00 ÷ 1.000,00 × 100 = 50%
encargosTotal              = 50,00 + 20,00 = 70,00
valorTotalDevido           = 0,00 + 70,00 = 70,00
inadimplencia              = 0,00 ÷ 1.000,00 × 100 = 0%
```

**CENÁRIO B: COM Suplementar de R$ 1.500,00**
```
folhaSuplementar           = 1.500,00 ✨ NOVO
folhaTotal                 = 5.000,00 + 1.500,00 = 6.500,00
valorRecolherCalculado     = 6.500,00 × 20 ÷ 100 = 1.300,00 ⬆️ MUDA
deficit                    = 1.000,00 - 6.500,00 = -5.500,00 (superávit!)
valorRecolhido             = 500,00
percentualPago             = 500,00 ÷ 1.300,00 × 100 = 38,46% ⬇️ MUDA
encargosTotal              = 50,00 + 20,00 = 70,00 (não muda)
valorTotalDevido           = -5.500,00 + 70,00 = -5.430,00 (superávit)
inadimplencia              = -5.500,00 ÷ 1.000,00 × 100 = -550% ⬇️ MUDA
superavit                  = 1.300,00 - 1.000,00 = 300,00 ⬆️ MUDA
```

---

## 3. FLUXO DE ATUALIZAÇÃO (PASSO A PASSO)

### 3.1 Quando o Usuário Edita Folha Suplementar

```
1. USUÁRIO EDITA
   ├─ Abre página de edição de lançamento
   ├─ Encontra campo "Folha Suplementar"
   ├─ Altera valor: de 0 → 1.500,00
   └─ Clica "Salvar"

2. VALIDAÇÃO NO FRONT-END
   ├─ Validar folhaSuplementar >= 0 ✓
   ├─ Validar folhaSuplementar <= 999.999,99 ✓
   └─ Se OK → enviar para API

3. ENVIO PARA API
   └─ PUT /api/lancamentos/[id]
      ├─ { folhaSuplementar: 1500.00 }
      └─ Recebe resposta com folhaTotal calculado

4. RECALCULAR NO BACK-END
   ├─ Buscar FolhaPrevidenciaria com ID
   ├─ Atualizar folhaSuplementar = 1500.00
   ├─ Calcular folhaTotal = folhaBase + folhaSuplementar
   ├─ Calcular valorRecolherCalculado = folhaTotal × aliquota ÷ 100
   ├─ Recalcular deficit, inadimplencia, percentualPago
   ├─ Salvar todas as alterações no banco
   └─ Retornar folha atualizada

5. ATUALIZAR NO FRONT-END
   ├─ Mostrar folhaTotal (calculado) = 6.500,00
   ├─ Mostrar valorRecolherCalculado (recalculado) = 1.300,00
   ├─ Mostrar todos os outros campos atualizados
   └─ Toast: "Lançamento atualizado com sucesso!"

6. ATUALIZAR NA TABELA
   ├─ Refrescar linha na tabela
   ├─ Mostrar novo folhaTotal
   ├─ Mostrar novo valorRecolherCalculado
   └─ Dashboard atualiza stats
```

---

## 4. ESTRUTURA VISUAL - LAYOUT NA PÁGINA DE EDIÇÃO

### 4.1 Seção "Dados da Folha" (Atualizada)

```
╔═══════════════════════════════════════════════════════════════╗
║                    DADOS DA FOLHA                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌──────────────────┬──────────────────┬──────────────────┐  ║
║  │ Folha Base (R$)* │Folha Supl. (R$)  │ Folha Total (R$) │  ║
║  │     5.000,00     │    [1.500,00]    │   6.500,00       │  ║
║  │   (desabilitado) │   (editável)  ✏️ │ (calculado)   📊 │  ║
║  └──────────────────┴──────────────────┴──────────────────┘  ║
║                                                               ║
║  Aliquota: 20%                                                ║
║                                                               ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ Valor a Recolher Calculado (R$)       1.300,00          │ ║
║  │ (incluindo suplementar)             (calculado)  📊      │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

LEGENDA:
  ✏️  = Campo editável
  📊 = Campo calculado automaticamente
  [] = Valor adicionado/alterado
```

### 4.2 Seção "Cálculos" (Impactada)

```
╔═══════════════════════════════════════════════════════════════╗
║                     CÁLCULOS                                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Valor a Recolher (esperado):    1.000,00                    ║
║  Valor Recolhido:                  500,00                    ║
║  Deficit:                         -5.500,00 ⬆️ ATUALIZADO    ║
║  Superávit:                          300,00 ⬆️ NOVO         ║
║  Percentual Pago:                   38,46% ⬆️ ATUALIZADO     ║
║  Inadimplência:                     -550%  ⬆️ ATUALIZADO     ║
║                                                               ║
║  Multas:                             50,00                   ║
║  Juros:                              20,00                   ║
║  Encargos Total:                     70,00                   ║
║  Valor Total Devido:              -5.430,00 ⬆️ ATUALIZADO    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

⬆️ = Campo recalculado devido à alteração de folhaSuplementar
```

---

## 5. BANCO DE DADOS - MIGRAÇÃO

### 5.1 SQL Gerado pela Migration

```sql
-- Add folhaSuplementar column to FolhaPrevidenciaria
ALTER TABLE folhas_previdenciarias 
ADD COLUMN folhaSuplementar DECIMAL(10,2) DEFAULT 0;

-- Create index for performance (optional)
CREATE INDEX idx_folhas_previdenciarias_folha_suplementar 
ON folhas_previdenciarias(folhaSuplementar);
```

### 5.2 Backward Compatibility

```
Folhas EXISTENTES:
├─ Migração adiciona folhaSuplementar = 0 (padrão)
├─ Cálculos continuam funcionando (0 + folhaBase = folhaBase)
├─ Nenhuma folha é deletada
├─ Nenhum dado é alterado
└─ ✅ Totalmente compatível com dados antigos
```

---

## 6. PSEUDOCÓDIGO DO CÁLCULO (Back-end)

### 6.1 Função de Recalcular Folha

```typescript
async function recalcularFolha(folhaId: number): Promise<void> {
  // 1. Buscar folha do banco
  const folha = await prisma.folhaPrevidenciaria.findUnique({
    where: { id: folhaId }
  });
  
  if (!folha) throw new Error("Folha não encontrada");
  
  // 2. Extrair valores (converter Decimal para number)
  const folhaBase = Number(folha.folhaBase || 0);
  const folhaSuplementar = Number(folha.folhaSuplementar || 0);
  const aliquota = Number(folha.aliquota);
  const valorRecolhido = Number(folha.valorRecolhido || 0);
  const multas = Number(folha.multas || 0);
  const juros = Number(folha.juros || 0);
  const valorRecolher = Number(folha.valorRecolher);
  
  // 3. CALCULAR FOLHA TOTAL (NOVO)
  const folhaTotal = folhaBase + folhaSuplementar;
  
  // 4. RECALCULAR VALOR A RECOLHER (ATUALIZADO)
  const valorRecolherCalculado = (folhaTotal * aliquota) / 100;
  
  // 5. RECALCULAR DEFICIT (AFETADO)
  const deficit = Math.max(0, valorRecolher - folhaTotal);
  
  // 6. RECALCULAR SUPERAVIT (NOVO)
  const superavit = Math.max(0, folhaTotal - valorRecolher);
  
  // 7. RECALCULAR ENCARGOS (NÃO MUDA)
  const encargosTotal = multas + juros;
  
  // 8. RECALCULAR VALOR TOTAL DEVIDO (AFETADO)
  const valorTotalDevido = deficit + encargosTotal;
  
  // 9. RECALCULAR VALOR LÍQUIDO ARRECADADO (AFETADO)
  const valorLiquidoArrecadado = Math.max(0, valorRecolhido - multas - juros);
  
  // 10. RECALCULAR PERCENTUAL PAGO (AFETADO)
  const percentualPago = valorRecolherCalculado > 0 
    ? (valorRecolhido / valorRecolherCalculado) * 100 
    : 0;
  
  // 11. RECALCULAR INADIMPLÊNCIA (AFETADO)
  const inadimplencia = deficit > 0 
    ? (deficit / valorRecolher) * 100 
    : 0;
  
  // 12. SALVAR NO BANCO
  await prisma.folhaPrevidenciaria.update({
    where: { id: folhaId },
    data: {
      folhaTotal: new Decimal(folhaTotal),
      valorRecolherCalculado: new Decimal(valorRecolherCalculado),
      deficit: new Decimal(deficit),
      superavit: new Decimal(superavit),
      encargosTotal: new Decimal(encargosTotal),
      valorTotalDevido: new Decimal(valorTotalDevido),
      valorLiquidoArrecadado: new Decimal(valorLiquidoArrecadado),
      percentualPago: new Decimal(percentualPago),
      inadimplencia: new Decimal(inadimplencia),
      updatedAt: new Date()
    }
  });
}
```

---

## 7. CAMPOS AFETADOS - MATRIZ COMPLETA

### 7.1 Impacto em Todos os Campos de FolhaPrevidenciaria

| # | Campo | Tipo | Ação | Como Muda | Fórmula Nova |
|---|-------|------|------|-----------|-------------|
| 1 | `folhaBase` | Decimal | Leitura | Não muda | - |
| 2 | `folhaSuplementar` | Decimal | **EDITA** ✨ | **Novo campo** | - |
| 3 | `folhaTotal` | Decimal | **Calcula** | Sempre soma | `base + supl` |
| 4 | `aliquota` | Decimal | Leitura | Não muda | - |
| 5 | `valorRecolher` | Decimal | Leitura | Não muda | - |
| 6 | `valorRecolherCalculado` | Decimal | **Recalcula** | Usa folhaTotal | `total × aliq ÷ 100` |
| 7 | `valorRecolhido` | Decimal | Leitura | Não muda | - |
| 8 | `deficit` | Decimal | **Recalcula** | Afetado por folhaTotal | `max(0, recolher - total)` |
| 9 | `superavit` | Decimal | **Recalcula** | Afetado por folhaTotal | `max(0, total - recolher)` |
| 10 | `multas` | Decimal | Leitura | Não muda | - |
| 11 | `juros` | Decimal | Leitura | Não muda | - |
| 12 | `acrescimo` | Decimal | Leitura | Não muda | - |
| 13 | `encargosTotal` | Decimal | Leitura | Não muda | `multas + juros` |
| 14 | `valorTotalDevido` | Decimal | **Recalcula** | Usa novo deficit | `deficit + encargos` |
| 15 | `valorLiquidoArrecadado` | Decimal | **Recalcula** | Usa novo deficit | `recolhido - multas - juros` |
| 16 | `percentualPago` | Decimal | **Recalcula** | Usa novo calculado | `recolhido ÷ calculado × 100` |
| 17 | `inadimplencia` | Decimal | **Recalcula** | Usa novo deficit | `deficit ÷ recolher × 100` |
| 18 | `parcelado` | Boolean | Leitura | Não muda | - |
| 19 | `status` | Enum | Leitura | Não muda | - |
| 20 | `observacoes` | String | Leitura | Não muda | - |

**Legenda:**
- ✨ = Campo novo
- **Recalcula** = Campo existente que será recalculado
- **Edita** = Campo que será editável
- Leitura = Campo que só lê, não muda

---

## 8. VALIDAÇÕES E REGRAS

### 8.1 Validações no Front-end

```typescript
// Quando usuário edita folhaSuplementar:

1. Validar tipo
   └─ Deve ser número: folhaSuplementar >= 0

2. Validar intervalo
   └─ Min: 0 (não pode ser negativo)
   └─ Max: 999.999,99 (limite de campo Decimal 10,2)

3. Validar casas decimais
   └─ Máximo 2 casas: 1.500,50 ✓
   └─ Rejeitar: 1.500,555 ✗

4. Validar ao salvar
   └─ Se válido → enviar para API
   └─ Se inválido → mostrar erro, bloquear envio
```

### 8.2 Validações no Back-end

```typescript
// Quando API recebe folhaSuplementar:

1. Validar tipo
   └─ Converter string para Decimal
   └─ Se conversão falhar → erro 400

2. Validar intervalo
   └─ Se < 0 → erro 400 "Valor não pode ser negativo"
   └─ Se > 999.999,99 → erro 400 "Valor muito grande"

3. Validar permissão
   └─ Usuário é GESTOR? → OK
   └─ Usuário é OPERADOR? → OK (tudo pode editar)

4. Após salvar
   └─ Recalcular folha automaticamente
   └─ Retornar folha com todos os valores atualizados
```

---

## 9. EXEMPLO DE API RESPONSE

### 9.1 Requisição PUT

```json
PUT /api/lancamentos/123
Content-Type: application/json

{
  "folhaSuplementar": 1500.00
}
```

### 9.2 Response 200 OK

```json
{
  "success": true,
  "folha": {
    "id": 123,
    "orgaoId": 1,
    "tipo": "PATRONAL",
    "exercicioId": 2026,
    "competenciaId": 1,
    
    "folhaBase": 5000.00,
    "folhaSuplementar": 1500.00,
    "folhaTotal": 6500.00,
    
    "aliquota": 20.00,
    "valorRecolher": 1000.00,
    "valorRecolherCalculado": 1300.00,
    "valorRecolhido": 500.00,
    
    "deficit": 0.00,
    "superavit": 300.00,
    
    "multas": 50.00,
    "juros": 20.00,
    "encargosTotal": 70.00,
    "valorTotalDevido": 70.00,
    
    "percentualPago": 38.46,
    "inadimplencia": 0.00,
    
    "status": "SEM_MOVIMENTO",
    "updatedAt": "2026-06-17T15:30:00Z"
  }
}
```

---

## 10. TABELA DE RESUMO DE MUDANÇAS

| Item | Antes | Depois | Status |
|------|-------|--------|--------|
| **Campos** | 19 campos | 20 campos | ➕ +1 novo |
| **Cálculos** | 10 fórmulas | 12 fórmulas | ➕ +2 novas |
| **UI Elements** | 2 inputs | 3 inputs | ➕ +1 novo |
| **Compatibilidade** | N/A | 100% | ✅ OK |
| **Impacto de Dados** | N/A | Zero | ✅ Seguro |
| **Tempo de Implementação** | N/A | 2-3h | ✅ Rápido |

---

## 11. CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Task 1: Adicionar campo no schema e migration
- [ ] Task 2: Atualizar função de cálculos
- [ ] Task 3: Adicionar campo na UI (formulário edição)
- [ ] Task 4: Atualizar coluna na tabela
- [ ] Task 5: Adicionar stats no dashboard
- [ ] Task 6: Testes completos
  - [ ] Validar cálculos com 0
  - [ ] Validar cálculos com valor
  - [ ] Validar recalcular em cascata
  - [ ] Validar backward compatibility
  - [ ] Validar validações
  - [ ] Validar API response

---

## 📊 CONCLUSÃO

✅ **Campo novo:** `folhaSuplementar` (Decimal)  
✅ **Campo afetado:** `valorRecolherCalculado` e 7 outros  
✅ **Fórmula base:** `folhaTotal = folhaBase + folhaSuplementar`  
✅ **Impacto:** Todos os cálculos da folha são recalculados em cascata  
✅ **Compatibilidade:** 100% backward compatible (valor 0 = comportamento antigo)  
✅ **Segurança:** Nenhum dado é deletado, apenas adicionado  

🚀 **Pronto para implementação!**
