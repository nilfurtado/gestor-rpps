# Comparação Completa: Cálculo Atual vs Plano com Suplementar

> **Todos os campos do schema FolhaPrevidenciaria com antes/depois**

---

## DADOS DE ENTRADA (Exemplo)

```
folhaBase          = 5.000,00
folhaSuplementar   = 1.500,00  ← NOVO no plano
aliquota           = 20%
valorRecolher      = 1.000,00  (esperado do órgão)
valorRecolhido     = 500,00    (já recolhido)
multas             = 50,00
juros              = 20,00
```

---

## COMPARAÇÃO CAMPO POR CAMPO

### 1️⃣ ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `id` | `id` | ❌ Não |
| **Tipo** | Int | Int | ❌ |
| **Fórmula** | Chave primária | Chave primária | ❌ |
| **Exemplo** | 123 | 123 | ❌ |

---

### 2️⃣ ORGAO_ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `orgaoId` | `orgaoId` | ❌ Não |
| **Tipo** | Int | Int | ❌ |
| **Fórmula** | FK (referência) | FK (referência) | ❌ |
| **Exemplo** | 1 | 1 | ❌ |

---

### 3️⃣ TIPO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `tipo` | `tipo` | ❌ Não |
| **Tipo** | Enum (PATRONAL/SEGURADO) | Enum (PATRONAL/SEGURADO) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | PATRONAL | PATRONAL | ❌ |

---

### 4️⃣ EXERCICIO_ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `exercicioId` | `exercicioId` | ❌ Não |
| **Tipo** | Int | Int | ❌ |
| **Fórmula** | FK (referência ano) | FK (referência ano) | ❌ |
| **Exemplo** | 2026 | 2026 | ❌ |

---

### 5️⃣ COMPETENCIA_ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `competenciaId` | `competenciaId` | ❌ Não |
| **Tipo** | Int | Int | ❌ |
| **Fórmula** | FK (referência mês) | FK (referência mês) | ❌ |
| **Exemplo** | 1 (Janeiro) | 1 (Janeiro) | ❌ |

---

### 6️⃣ ALIQUOTA
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `aliquota` | `aliquota` | ❌ Não |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 20% | 20% | ❌ |

---

### 7️⃣ VALOR_RECOLHER
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `valorRecolher` | `valorRecolher` | ❌ Não |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula** | Entrada do usuário (calculado pela folha) | Entrada do usuário | ❌ |
| **Exemplo** | 1.000,00 | 1.000,00 | ❌ |
| **Nota** | Valor esperado que deveria ter sido recolhido | Não muda com suplementar | - |

---

### 8️⃣ FOLHA_BASE (NOVO CAMPO NO PLANO)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `folhaBase` | `folhaBase` | ❌ Não |
| **Tipo** | Decimal (nullable) | Decimal (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 5.000,00 | 5.000,00 | ❌ |
| **Nota** | Base de cálculo da folha | Mantém seu valor | - |

---

### 🆕 9️⃣ FOLHA_SUPLEMENTAR (CAMPO NOVO)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | ❌ NÃO EXISTE | ✨ `folhaSuplementar` | ➕ NOVO |
| **Tipo** | - | Decimal (default 0) | ➕ |
| **Fórmula** | - | Entrada do usuário | ➕ |
| **Exemplo** | - | 1.500,00 | ➕ |
| **Nota** | Não havia | Novo campo editável | ✨ |

---

### 📊 10️⃣ FOLHA_TOTAL (DERIVADO - NÃO ARMAZENADO)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | ❌ NÃO EXISTE | 📊 `folhaTotal` (calculado) | ✨ NOVO CONCEITO |
| **Tipo** | - | Decimal (virtual/exibição) | ✨ |
| **Fórmula Atual** | Não existe | - | - |
| **Fórmula Plano** | - | `folhaBase + folhaSuplementar` | ✨ |
| **Exemplo Atual** | - | - | - |
| **Exemplo Plano** | - | 5.000 + 1.500 = 6.500,00 | ✨ |
| **Armazenado BD?** | Não aplica | ❌ Não (calculado) | ✨ |

---

### 1️⃣1️⃣ VALOR_RECOLHER_CALCULADO (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `valorRecolherCalculado` | `valorRecolherCalculado` | ⚠️ SIM |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula ATUAL** | `folhaBase × aliquota ÷ 100` | - | - |
| **Exemplo ATUAL** | `5.000 × 20 ÷ 100 = 1.000,00` | - | - |
| **Fórmula PLANO** | - | `(folhaBase + folhaSuplementar) × aliquota ÷ 100` | ⚠️ |
| **Exemplo PLANO** | - | `(5.000 + 1.500) × 20 ÷ 100 = 1.300,00` | ⚠️ |
| **Diferença** | Usa apenas folhaBase | ➕ Inclui suplementar | **+300,00** |

---

### 1️⃣2️⃣ VALOR_RECOLHIDO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `valorRecolhido` | `valorRecolhido` | ❌ Não |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 500,00 | 500,00 | ❌ |
| **Nota** | Valor que já foi recolhido | Não é afetado | - |

---

### 1️⃣3️⃣ QUANTIDADE_SERVIDORES
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `quantidadeServidores` | `quantidadeServidores` | ❌ Não |
| **Tipo** | Int (nullable) | Int (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 10 | 10 | ❌ |

---

### 1️⃣4️⃣ MULTAS
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `multas` | `multas` | ❌ Não |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 50,00 | 50,00 | ❌ |
| **Nota** | Multa por atraso | Não é afetada por suplementar | - |

---

### 1️⃣5️⃣ JUROS
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `juros` | `juros` | ❌ Não |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 20,00 | 20,00 | ❌ |
| **Nota** | Juros por atraso | Não é afetado por suplementar | - |

---

### 1️⃣6️⃣ ACRESCIMO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `acrescimo` | `acrescimo` | ❌ Não |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 0,00 | 0,00 | ❌ |
| **Nota** | Acréscimo por diferença | Não é afetado por suplementar | - |

---

### 1️⃣7️⃣ ACRESCIMO_TIPO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `acrescimo_tipo` | `acrescimo_tipo` | ❌ Não |
| **Tipo** | Enum | Enum | ❌ |
| **Fórmula** | QUITADO/ACRESCIMO/DIFERENCA | QUITADO/ACRESCIMO/DIFERENCA | ❌ |
| **Exemplo** | QUITADO | QUITADO | ❌ |

---

### 1️⃣8️⃣ PARCELADO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `parcelado` | `parcelado` | ❌ Não |
| **Tipo** | Boolean | Boolean | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | false | false | ❌ |

---

### 1️⃣9️⃣ DEFICIT (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `deficit` | `deficit` | ⚠️ SIM |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula ATUAL** | `valorRecolher - folhaBase` | - | - |
| **Exemplo ATUAL** | `1.000 - 5.000 = -4.000 (superávit)` | - | - |
| **Fórmula PLANO** | - | `valorRecolher - (folhaBase + folhaSuplementar)` | ⚠️ |
| **Exemplo PLANO** | - | `1.000 - (5.000 + 1.500) = -5.500 (maior superávit)` | ⚠️ |
| **Diferença** | -4.000 | -5.500 | **-1.500 (50% maior deficit negativo)** |

---

### 2️⃣0️⃣ SUPERAVIT (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `superavit` | `superavit` | ⚠️ SIM |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula ATUAL** | `max(0, folhaBase - valorRecolher)` | - | - |
| **Exemplo ATUAL** | `max(0, 5.000 - 1.000) = 4.000,00` | - | - |
| **Fórmula PLANO** | - | `max(0, (folhaBase + folhaSuplementar) - valorRecolher)` | ⚠️ |
| **Exemplo PLANO** | - | `max(0, 6.500 - 1.000) = 5.500,00` | ⚠️ |
| **Diferença** | 4.000 | 5.500 | **+1.500 (37,5% maior)** |

---

### 2️⃣1️⃣ INADIMPLENCIA (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `inadimplencia` | `inadimplencia` | ⚠️ SIM |
| **Tipo** | Decimal | Decimal | ❌ |
| **Fórmula ATUAL** | `deficit ÷ valorRecolher × 100` | - | - |
| **Exemplo ATUAL** | `(-4.000 ÷ 1.000) × 100 = -400%` | - | - |
| **Fórmula PLANO** | - | `deficit ÷ valorRecolher × 100` (usa novo deficit) | ⚠️ |
| **Exemplo PLANO** | - | `(-5.500 ÷ 1.000) × 100 = -550%` | ⚠️ |
| **Diferença** | -400% | -550% | **-150% (37,5% pior)** |

---

### 2️⃣2️⃣ PERCENTUAL_PAGO (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `percentualPago` | `percentualPago` | ⚠️ SIM |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula ATUAL** | `(valorRecolhido ÷ valorRecolher) × 100` | - | - |
| **Exemplo ATUAL** | `(500 ÷ 1.000) × 100 = 50%` | - | - |
| **Fórmula PLANO** | - | `(valorRecolhido ÷ valorRecolherCalculado) × 100` | ⚠️ |
| **Exemplo PLANO** | - | `(500 ÷ 1.300) × 100 = 38,46%` | ⚠️ |
| **Diferença** | 50% | 38,46% | **-11,54% (reduz percentual)** |

---

### 2️⃣3️⃣ VALOR_TOTAL_DEVIDO (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `valorTotalDevido` | `valorTotalDevido` | ⚠️ SIM |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula ATUAL** | `deficit + multas + juros` | - | - |
| **Exemplo ATUAL** | `(-4.000) + 50 + 20 = -3.930,00` | - | - |
| **Fórmula PLANO** | - | `deficit + multas + juros` (usa novo deficit) | ⚠️ |
| **Exemplo PLANO** | - | `(-5.500) + 50 + 20 = -5.430,00` | ⚠️ |
| **Diferença** | -3.930 | -5.430 | **-1.500 (38% maior)** |

---

### 2️⃣4️⃣ ENCARGOS_TOTAL
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `encargosTotal` | `encargosTotal` | ❌ Não |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula** | `multas + juros` | `multas + juros` | ❌ |
| **Exemplo** | `50 + 20 = 70,00` | `50 + 20 = 70,00` | ❌ |
| **Nota** | Independente do suplementar | Não é afetado | - |

---

### 2️⃣5️⃣ VALOR_LIQUIDO_ARRECADADO (⚠️ MUDA)
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `valorLiquidoArrecadado` | `valorLiquidoArrecadado` | ⚠️ SIM |
| **Tipo** | Decimal (default 0) | Decimal (default 0) | ❌ |
| **Fórmula ATUAL** | `valorRecolhido - multas - juros` | - | - |
| **Exemplo ATUAL** | `500 - 50 - 20 = 430,00` | - | - |
| **Fórmula PLANO** | - | `valorRecolhido - multas - juros` | ⚠️ |
| **Exemplo PLANO** | - | `500 - 50 - 20 = 430,00` | ⚠️ |
| **Diferença** | 430 | 430 | ❌ Não muda (não usa folhaTotal) |

---

### 2️⃣6️⃣ STATUS
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `status` | `status` | ❌ Não |
| **Tipo** | Enum | Enum | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | SEM_MOVIMENTO | SEM_MOVIMENTO | ❌ |

---

### 2️⃣7️⃣ RESPONSAVEL_ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `responsavelId` | `responsavelId` | ❌ Não |
| **Tipo** | Int (nullable) | Int (nullable) | ❌ |
| **Fórmula** | FK (referência usuário) | FK (referência usuário) | ❌ |
| **Exemplo** | 1 | 1 | ❌ |

---

### 2️⃣8️⃣ DATA_VENCIMENTO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `dataVencimento` | `dataVencimento` | ❌ Não |
| **Tipo** | DateTime (nullable) | DateTime (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | 2026-07-10 | 2026-07-10 | ❌ |

---

### 2️⃣9️⃣ OBSERVACOES
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `observacoes` | `observacoes` | ❌ Não |
| **Tipo** | String (nullable) | String (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | "Nota de pagamento" | "Nota de pagamento" | ❌ |

---

### 3️⃣0️⃣ JUSTIFICATIVA_DIFERENCA
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `justificativaDiferenca` | `justificativaDiferenca` | ❌ Não |
| **Tipo** | String (nullable) | String (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | null | null | ❌ |

---

### 3️⃣1️⃣ DIFERENCA_APROVADA
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `diferenca_aprovada` | `diferenca_aprovada` | ❌ Não |
| **Tipo** | Boolean (default false) | Boolean (default false) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | false | false | ❌ |

---

### 3️⃣2️⃣ DATA_APROVACAO
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `dataAprovacao` | `dataAprovacao` | ❌ Não |
| **Tipo** | DateTime (nullable) | DateTime (nullable) | ❌ |
| **Fórmula** | Entrada do usuário | Entrada do usuário | ❌ |
| **Exemplo** | null | null | ❌ |

---

### 3️⃣3️⃣ USUARIO_APROVADOR_ID
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `usuarioAprovadorId` | `usuarioAprovadorId` | ❌ Não |
| **Tipo** | Int (nullable) | Int (nullable) | ❌ |
| **Fórmula** | FK (referência usuário) | FK (referência usuário) | ❌ |
| **Exemplo** | null | null | ❌ |

---

### 3️⃣4️⃣ CREATED_AT
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `createdAt` | `createdAt` | ❌ Não |
| **Tipo** | DateTime | DateTime | ❌ |
| **Fórmula** | Auto (agora) | Auto (agora) | ❌ |
| **Exemplo** | 2026-06-01 15:30:00 | 2026-06-01 15:30:00 | ❌ |

---

### 3️⃣5️⃣ UPDATED_AT
| Aspecto | Atual | Plano | Muda? |
|---------|-------|-------|-------|
| **Campo** | `updatedAt` | `updatedAt` | ❌ Não |
| **Tipo** | DateTime | DateTime | ❌ |
| **Fórmula** | Auto (agora) | Auto (agora) | ❌ |
| **Exemplo** | 2026-06-17 10:20:00 | 2026-06-17 10:20:00 | ❌ |

---

## RESUMO EXECUTIVO

### Total de Campos: 35

| Categoria | Quantidade | Campos |
|-----------|-----------|---------|
| ❌ Sem mudanças | 28 | ID, OrgaoID, Tipo, ExercícioID, CompetênciaID, Aliquota, ValorRecolher, FolhaBase, ValorRecolhido, QuantidadeServidores, Multas, Juros, Acrescimo, AcrescimoTipo, Parcelado, EncargosTotal, Status, ResponsavelID, DataVencimento, Observações, JustificativaDiferença, DiferencaAprovada, DataAprovação, UsuarioAprovadorID, CreatedAt, UpdatedAt |
| ✨ Novos | 2 | **FolhaSuplementar**, **FolhaTotal** |
| ⚠️ Recalculados | 5 | **ValorRecolherCalculado**, **Deficit**, **Superavit**, **Inadimplência**, **PercentualPago** |
| ⚠️ Recalculados (não afeta) | 1 | **ValorLiquidoArrecadado** (mantém valor) |

### Impacto Financeiro (Exemplo)

```
                            ATUAL       PLANO       DIFERENÇA
─────────────────────────────────────────────────────────────
folhaBase                   5.000,00    5.000,00    ➖ 0,00
folhaSuplementar            -           1.500,00    ➕ 1.500,00
folhaTotal                  5.000,00    6.500,00    ➕ 1.500,00
─────────────────────────────────────────────────────────────
valorRecolherCalculado      1.000,00    1.300,00    ➕ 300,00
deficit                    -4.000,00   -5.500,00    ➖ -1.500,00
superavit                   4.000,00    5.500,00    ➕ 1.500,00
inadimplencia                -400%       -550%       ➖ -150%
percentualPago                 50%        38,46%     ➖ -11,54%
─────────────────────────────────────────────────────────────
```

### Impactos Principais

| Métrica | Antes | Depois | Mudança |
|---------|-------|--------|---------|
| **Valor a Recolher** | 1.000,00 | 1.300,00 | +30% |
| **Superávit** | 4.000,00 | 5.500,00 | +37,5% |
| **% Pago** | 50% | 38,46% | -11,54% |

---

## ✅ CONCLUSÃO

✨ **1 campo novo:** `folhaSuplementar`  
📊 **1 conceito novo:** `folhaTotal` (calculado)  
⚠️ **5 campos recalculados:** valorRecolherCalculado, deficit, superavit, inadimplência, percentualPago  
❌ **28 campos inalterados:** tudo mais continua igual  

**Todos os cálculos são recalculados quando suplementar é alterado, mas os dados nunca são deletados (backward compatible).**

🚀 **Seguro para implementação!**
