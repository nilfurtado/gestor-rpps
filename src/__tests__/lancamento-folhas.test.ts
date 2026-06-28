/**
 * Suite de testes para Lançamento com Folhas Dinâmicas e Valor a Recolher.
 *
 * Suite 1: Unit tests das funções de cálculo
 * Suite 2: Integration tests CRUD com folhas dinâmicas
 * Suite 3: Edge cases de precisão decimal
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  calcularValorARecolher,
  calcularDiferenca,
  calcularFolhaTotal,
  calcularTotalARecolher,
  calcularTotalRecolhido,
  calcularDeficitTotal,
} from "@/lib/tipo-folha-service";
import { createLancamento, updateLancamento } from "@/lib/lancamento-service";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Suite 1: Unit tests — Funções de cálculo
// ---------------------------------------------------------------------------

describe("Tipo Folha Service - Calculations", () => {
  it("calcularValorARecolher: 10000 × 15% = 1500", () => {
    expect(calcularValorARecolher(10000, 15)).toBe(1500);
  });

  it("calcularValorARecolher: 10000 × 10% = 1000", () => {
    expect(calcularValorARecolher(10000, 10)).toBe(1000);
  });

  it("calcularValorARecolher: handles decimal values (3333.33 × 15% ≈ 500)", () => {
    // 3333.33 × 15 / 100 = 499.9995 → toFixed(2) → 500.00
    expect(calcularValorARecolher(3333.33, 15)).toBe(500);
  });

  it("calcularDiferenca: positive debt (valorARecolher > valorRecolhido)", () => {
    expect(calcularDiferenca(1500, 1200)).toBe(300);
  });

  it("calcularDiferenca: negative credit (valorRecolhido > valorARecolher)", () => {
    expect(calcularDiferenca(1000, 1500)).toBe(-500);
  });

  it("calcularDiferenca: zero when quitado", () => {
    expect(calcularDiferenca(1500, 1500)).toBe(0);
  });

  it("calcularFolhaTotal: sums all folha values", () => {
    const folhas = [{ valor: 10000 }, { valor: 5000 }, { valor: 3000 }];
    expect(calcularFolhaTotal(folhas)).toBe(18000);
  });

  it("calcularFolhaTotal: handles empty array", () => {
    expect(calcularFolhaTotal([])).toBe(0);
  });

  it("calcularTotalARecolher: sums all valorARecolher", () => {
    const folhas = [
      { valorARecolher: 1500 },
      { valorARecolher: 750 },
      { valorARecolher: 450 },
    ];
    expect(calcularTotalARecolher(folhas)).toBe(2700);
  });

  it("calcularTotalRecolhido: sums all collected", () => {
    const folhas = [
      { valorRecolhido: 1500 },
      { valorRecolhido: 700 },
      { valorRecolhido: 450 },
    ];
    expect(calcularTotalRecolhido(folhas)).toBe(2650);
  });

  it("calcularDeficitTotal: sums all differences (including negatives)", () => {
    const folhas = [
      { diferenca: 300 }, // 1500 - 1200
      { diferenca: 0 }, // quitado
      { diferenca: -500 }, // credit
    ];
    expect(calcularDeficitTotal(folhas)).toBe(-200);
  });
});

// ---------------------------------------------------------------------------
// Suite 2: Integration tests — CRUD com Folhas Dinâmicas
// ---------------------------------------------------------------------------

describe("Lançamento - CRUD com Folhas Dinâmicas", () => {
  let orgaoId: number;
  let exercicioId: number;
  let competenciaId: number;
  let userId: number;

  beforeEach(async () => {
    // Usar ano e ordem únicos para evitar conflito com dados de produção
    const TEST_ANO = 2099;
    const TEST_ORDEM = 99;
    const TEST_SIGLA = "TST";

    const orgao = await prisma.orgao.upsert({
      where: { sigla: TEST_SIGLA },
      update: { nome: "Test Org" },
      create: { sigla: TEST_SIGLA, nome: "Test Org", status: "ATIVO" },
    });
    orgaoId = orgao.id;

    const exercicio = await prisma.exercicio.upsert({
      where: { ano: TEST_ANO },
      update: {},
      create: { ano: TEST_ANO, status: "ABERTO" },
    });
    exercicioId = exercicio.id;

    const competencia = await prisma.competencia.upsert({
      where: { ordem: TEST_ORDEM },
      update: { mes: "Teste" },
      create: { ordem: TEST_ORDEM, mes: "Teste" },
    });
    competenciaId = competencia.id;

    const user = await prisma.user.upsert({
      where: { email: "test-lancamento@test.com" },
      update: {},
      create: {
        email: "test-lancamento@test.com",
        nome: "Test User",
        role: "GESTOR",
        passwordHash: "hash",
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    // Limpar lançamentos de teste (com cascade para LancamentoFolha)
    await prisma.folhaPrevidenciaria.deleteMany({
      where: { orgaoId },
    });
    // Limpar dados auxiliares de teste
    await prisma.user.deleteMany({ where: { email: "test-lancamento@test.com" } });
    await prisma.competencia.deleteMany({ where: { ordem: 99 } });
    await prisma.exercicio.deleteMany({ where: { ano: 2099 } });
    await prisma.orgao.deleteMany({ where: { sigla: "TST" } });
  });

  it("cria lançamento com Folha Base e calcula totais corretamente", async () => {
    const lancamento = await createLancamento(
      {
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        folhas: [
          {
            tipoFolhaId: 1, // Base (obrigatória)
            valor: 10000,
            valorRecolhido: 9500,
          },
        ],
      },
      userId
    );

    // PATRONAL = 15%; valorARecolher = 10000 × 15% = 1500
    // diferenca = 1500 - 9500 = -8000 (crédito)
    expect(Number(lancamento.folhaTotal)).toBe(10000);
    expect(Number(lancamento.totalARecolher)).toBe(1500);
    expect(Number(lancamento.totalRecolhido)).toBe(9500);
    expect(Number(lancamento.deficitTotal)).toBe(-8000);
  });

  it("cria lançamento com múltiplas folhas (Base + Suplementar)", async () => {
    const lancamento = await createLancamento(
      {
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        folhas: [
          {
            tipoFolhaId: 1, // Base
            valor: 10000,
            valorRecolhido: 9500,
          },
          {
            tipoFolhaId: 2, // Suplementar
            valor: 5000,
            valorRecolhido: 5000,
          },
        ],
      },
      userId
    );

    // folha1: 10000 × 15% = 1500; diferenca = 1500 - 9500 = -8000
    // folha2: 5000 × 15% = 750;  diferenca = 750 - 5000 = -4250
    // totais: folhaTotal=15000, totalARecolher=2250, totalRecolhido=14500, deficitTotal=-12250
    expect(Number(lancamento.folhaTotal)).toBe(15000);
    expect(Number(lancamento.totalARecolher)).toBe(2250);
    expect(Number(lancamento.totalRecolhido)).toBe(14500);
    expect(Number(lancamento.deficitTotal)).toBe(-12250);
  });

  it("atualiza lançamento recalculando folhas", async () => {
    const created = await createLancamento(
      {
        orgaoId,
        tipo: "SEGURADO",
        exercicioId,
        competenciaId,
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        folhas: [
          {
            tipoFolhaId: 1, // Base
            valor: 5000,
            valorRecolhido: 4000,
          },
        ],
      },
      userId
    );

    // Update: dobrar o valor da folha
    const updated = await updateLancamento(
      created.id,
      {
        folhas: [
          {
            tipoFolhaId: 1, // Base
            valor: 10000,
            valorRecolhido: 4000,
          },
        ],
      },
      userId
    );

    // SEGURADO = 10%; valorARecolher = 10000 × 10% = 1000
    // diferenca = 1000 - 4000 = -3000 (crédito)
    expect(Number(updated.folhaTotal)).toBe(10000);
    expect(Number(updated.totalARecolher)).toBe(1000);
    expect(Number(updated.totalRecolhido)).toBe(4000);
    expect(Number(updated.deficitTotal)).toBe(-3000);
  });

  it("rejeita lançamento sem Folha Base (obrigatória)", async () => {
    await expect(
      createLancamento(
        {
          orgaoId,
          tipo: "PATRONAL",
          exercicioId,
          competenciaId,
          dataVencimento: new Date(),
          folhas: [
            {
              tipoFolhaId: 2, // Suplementar — não é obrigatória
              valor: 5000,
              valorRecolhido: 5000,
            },
          ],
        },
        userId
      )
    ).rejects.toThrow();
  });

  it("deleta lançamento com folhas associadas (cascade)", async () => {
    const lancamento = await createLancamento(
      {
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        dataVencimento: new Date(),
        folhas: [
          {
            tipoFolhaId: 1, // Base
            valor: 10000,
            valorRecolhido: 9500,
          },
        ],
      },
      userId
    );

    const before = await prisma.lancamentoFolha.count({
      where: { lancamentoId: lancamento.id },
    });

    await prisma.folhaPrevidenciaria.delete({ where: { id: lancamento.id } });

    const after = await prisma.lancamentoFolha.count({
      where: { lancamentoId: lancamento.id },
    });

    expect(before).toBe(1);
    expect(after).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Decimal Precision Edge Cases
// ---------------------------------------------------------------------------

describe("Decimal Precision", () => {
  it("handles .toFixed(2) rounding correctly (3333.33 × 15% ≈ 500)", () => {
    // 3333.33 × 15 / 100 = 499.9995 → toFixed(2) → "500.00" → 500
    expect(calcularValorARecolher(3333.33, 15)).toBe(500);
  });

  it("handles very small fractions (0.01 × 15% = 0.00)", () => {
    // 0.01 × 15 / 100 = 0.0015 → toFixed(2) → "0.00" → 0
    expect(calcularValorARecolher(0.01, 15)).toBe(0);
  });

  it("handles negative differences (credit scenario)", () => {
    const diff = calcularDiferenca(500, 1000);
    expect(diff).toBe(-500);
  });
});
