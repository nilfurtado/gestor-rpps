# Task 7: E2E Testing — Lançamento com Valor a Recolher

## Objective
Write comprehensive unit and integration tests for the Lançamento system's new Valor a Recolher calculations, validating that folhas are calculated correctly end-to-end.

## Files to Modify/Create
- Create: `src/__tests__/lancamento-folhas.test.ts` (new comprehensive test file)
- Modify: `src/__tests__/lancamento.test.ts` (if exists; add to existing tests if present)

## Requirements

### Test Suite Structure

Create tests organized by domain:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { 
  calcularValorARecolher, 
  calcularDiferenca, 
  calcularFolhaTotal,
  calcularTotalARecolher,
  calcularTotalRecolhido,
  calcularDeficitTotal
} from "@/lib/tipo-folha-service";
import { createLancamento, updateLancamento, getLancamento } from "@/lib/lancamento-service";
import { prisma } from "@/lib/db";
```

### 1. Unit Tests: Calculation Functions

```typescript
describe("Tipo Folha Service - Calculations", () => {
  it("calcularValorARecolher: 10000 × 15% = 1500", () => {
    expect(calcularValorARecolher(10000, 15)).toBe(1500);
  });

  it("calcularValorARecolher: 10000 × 10% = 1000", () => {
    expect(calcularValorARecolher(10000, 10)).toBe(1000);
  });

  it("calcularValorARecolher: handles decimal values", () => {
    expect(calcularValorARecolher(3333.33, 15)).toBe(500); // 3333.33 × 15 / 100 ≈ 500
  });

  it("calcularDiferenca: positive (debt)", () => {
    expect(calcularDiferenca(1500, 1200)).toBe(300);
  });

  it("calcularDiferenca: negative (credit)", () => {
    expect(calcularDiferenca(1000, 1500)).toBe(-500);
  });

  it("calcularDiferenca: zero (quitado)", () => {
    expect(calcularDiferenca(1500, 1500)).toBe(0);
  });

  it("calcularFolhaTotal: sums all folha values", () => {
    const folhas = [
      { valor: 10000 },
      { valor: 5000 },
      { valor: 3000 }
    ];
    expect(calcularFolhaTotal(folhas)).toBe(18000);
  });

  it("calcularFolhaTotal: handles empty array", () => {
    expect(calcularFolhaTotal([])).toBe(0);
  });

  it("calcularTotalARecolher: sums all valorARecolher", () => {
    const folhas = [
      { valorARecolher: 1500 },
      { valorARecolher: 750 },
      { valorARecolher: 450 }
    ];
    expect(calcularTotalARecolher(folhas)).toBe(2700);
  });

  it("calcularTotalRecolhido: sums all collected", () => {
    const folhas = [
      { valorRecolhido: 1500 },
      { valorRecolhido: 700 },
      { valorRecolhido: 450 }
    ];
    expect(calcularTotalRecolhido(folhas)).toBe(2650);
  });

  it("calcularDeficitTotal: sums all differences", () => {
    const folhas = [
      { diferenca: 300 },   // 1500 - 1200
      { diferenca: 0 },     // quitado
      { diferenca: -500 }   // credit
    ];
    expect(calcularDeficitTotal(folhas)).toBe(-200);
  });
});
```

### 2. Integration Tests: Lançamento CRUD

```typescript
describe("Lançamento - CRUD com Folhas Dinâmicas", () => {
  let orgaoId: number;
  let exercicioId: number;
  let competenciaId: number;
  let usuarioId: number;

  beforeEach(async () => {
    // Setup: create test data
    const orgao = await prisma.orgao.create({
      data: { sigla: "TEST", nome: "Test Org", cor: "#000000" }
    });
    orgaoId = orgao.id;

    const exercicio = await prisma.exercicio.create({
      data: { ano: 2026 }
    });
    exercicioId = exercicio.id;

    const competencia = await prisma.competencia.create({
      data: { ordem: 1, mes: "Janeiro" }
    });
    competenciaId = competencia.id;

    const usuario = await prisma.usuario.create({
      data: { email: "test@test.com", nome: "Test", role: "GESTOR", passwordHash: "hash" }
    });
    usuarioId = usuario.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.lancamentoFolha.deleteMany({});
    await prisma.folhaPrevidenciaria.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.competencia.deleteMany({});
    await prisma.exercicio.deleteMany({});
    await prisma.orgao.deleteMany({});
  });

  it("cria lançamento com Folha Base e calcula totais corretamente", async () => {
    const lancamento = await createLancamento({
      orgaoId,
      tipo: "PATRONAL",
      exercicioId,
      competenciaId,
      dataEmissao: new Date(),
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "LANCADO",
      folhas: [
        {
          tipoFolhaId: 1, // Base
          valor: 10000,
          valorRecolhido: 9500
        }
      ]
    }, usuarioId);

    // Validações
    expect(lancamento.folhaTotal).toBe(10000);
    expect(lancamento.totalARecolher).toBe(1500); // 10000 × 15%
    expect(lancamento.totalRecolhido).toBe(9500);
    expect(lancamento.deficitTotal).toBe(500); // 1500 - 9500
  });

  it("cria lançamento com múltiplas folhas (Base + Suplementar)", async () => {
    const lancamento = await createLancamento({
      orgaoId,
      tipo: "PATRONAL",
      exercicioId,
      competenciaId,
      dataEmissao: new Date(),
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "LANCADO",
      folhas: [
        {
          tipoFolhaId: 1, // Base
          valor: 10000,
          valorRecolhido: 9500
        },
        {
          tipoFolhaId: 2, // Suplementar
          valor: 5000,
          valorRecolhido: 5000
        }
      ]
    }, usuarioId);

    // Total: (10000 + 5000) × 15% = 2250
    // Deficit: (1500 - 9500) + (750 - 5000) = -500 + (-4250) = -4750
    expect(lancamento.folhaTotal).toBe(15000);
    expect(lancamento.totalARecolher).toBe(2250);
    expect(lancamento.totalRecolhido).toBe(14500);
    expect(lancamento.deficitTotal).toBe(-4750); // Credit!
  });

  it("atualiza lançamento recalculando folhas", async () => {
    // Create
    const created = await createLancamento({
      orgaoId,
      tipo: "SEGURADO",
      exercicioId,
      competenciaId,
      dataEmissao: new Date(),
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "LANCADO",
      folhas: [
        {
          tipoFolhaId: 1,
          valor: 5000,
          valorRecolhido: 4000
        }
      ]
    }, usuarioId);

    // Update: change valor
    const updated = await updateLancamento(created.id, {
      folhas: [
        {
          tipoFolhaId: 1,
          valor: 10000, // doubled
          valorRecolhido: 4000
        }
      ]
    }, usuarioId);

    // Expected: 10000 × 10% (SEGURADO) = 1000
    expect(updated.folhaTotal).toBe(10000);
    expect(updated.totalARecolher).toBe(1000);
    expect(updated.totalRecolhido).toBe(4000);
    expect(updated.deficitTotal).toBe(-3000); // Credit
  });

  it("rejeita lançamento sem Folha Base", async () => {
    try {
      await createLancamento({
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        dataEmissao: new Date(),
        dataVencimento: new Date(),
        status: "LANCADO",
        folhas: [
          {
            tipoFolhaId: 2, // Suplementar (não Base)
            valor: 5000,
            valorRecolhido: 5000
          }
        ]
      }, usuarioId);
      fail("Should have thrown");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("deleta lançamento com folhas associadas (cascade)", async () => {
    const lancamento = await createLancamento({
      orgaoId,
      tipo: "PATRONAL",
      exercicioId,
      competenciaId,
      dataEmissao: new Date(),
      dataVencimento: new Date(),
      status: "LANCADO",
      folhas: [
        {
          tipoFolhaId: 1,
          valor: 10000,
          valorRecolhido: 9500
        }
      ]
    }, usuarioId);

    // Delete
    const before = await prisma.lancamentoFolha.count();
    await prisma.folhaPrevidenciaria.delete({ where: { id: lancamento.id } });
    const after = await prisma.lancamentoFolha.count();

    expect(before).toBe(1);
    expect(after).toBe(0);
  });
});
```

### 3. Decimal Precision Tests

```typescript
describe("Decimal Precision", () => {
  it("handles .toFixed(2) rounding correctly", () => {
    // 3333.33 × 15% = 499.9995 → 500.00
    expect(calcularValorARecolher(3333.33, 15)).toBe(500);
  });

  it("handles very small fractions", () => {
    // 0.01 × 15% = 0.0015 → 0.00
    expect(calcularValorARecolher(0.01, 15)).toBe(0);
  });

  it("handles negative differences", () => {
    // Credit scenario
    const diff = calcularDiferenca(500, 1000);
    expect(diff).toBe(-500);
  });
});
```

## Global Constraints

- Use Jest or existing project test framework
- All tests must pass: `npm test`
- No skipped tests (`it.skip`)
- Database tests must cleanup afterEach
- Mock or use real database as project standard dictates
- Test names describe the behavior, not the implementation
- Each test validates one behavioral aspect

## Test Execution

```bash
# Run all tests
npm test

# Run only lancamento tests
npm test lancamento

# Run with coverage
npm test -- --coverage
```

## Success Criteria

✅ All unit tests for calculation functions pass
✅ All integration tests for CRUD operations pass
✅ Decimal precision handled correctly
✅ No skipped or pending tests
✅ No console errors
✅ No new TypeScript errors
✅ Test coverage > 80% for lancamento-service and tipo-folha-service
