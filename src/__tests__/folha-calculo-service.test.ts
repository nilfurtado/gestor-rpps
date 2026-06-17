import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as calcService from "@/lib/folha-calculo-service";
import * as suplService from "@/lib/folha-suplementar-service";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

describe("Folha Cálculo Service", () => {
  let folhaId: number;
  let orgaoId: number;
  let exercicioId: number;
  let competenciaId: number;

  beforeEach(async () => {
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 900000) + 100000;
    const orgao = await prisma.orgao.create({
      data: {
        nome: `Teste Órgão Calc ${timestamp}-${rand}`,
        sigla: `C${rand % 100000}`.slice(0, 5),
      },
    });
    orgaoId = orgao.id;

    // Use upsert to avoid race conditions between concurrent test files
    const anoExercicio = 2100 + (rand % 200);
    const exercicio = await prisma.exercicio.upsert({
      where: { ano: anoExercicio },
      update: {},
      create: { ano: anoExercicio },
    });
    exercicioId = exercicio.id;

    // Use upsert to avoid race conditions between concurrent test files
    const ordemComp = 300 + (rand % 500);
    const competencia = await prisma.competencia.upsert({
      where: { ordem: ordemComp },
      update: {},
      create: { mes: "FEV", ordem: ordemComp },
    });
    competenciaId = competencia.id;

    const folha = await prisma.folhaPrevidenciaria.create({
      data: {
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        aliquota: new Decimal("20"),
        valorRecolher: new Decimal("1000"),
        valorRecolhido: new Decimal("0"),
        deficit: new Decimal("1000"),
        inadimplencia: new Decimal("0"),
        folhaBase: new Decimal("5000"),
        status: "SEM_MOVIMENTO",
      },
    });
    folhaId = folha.id;
  });

  afterEach(async () => {
    await prisma.folhaSupplementar.deleteMany({
      where: { folhaPrevidenciariaId: folhaId },
    });
    await prisma.folhaPrevidenciaria.deleteMany({
      where: { exercicioId },
    });
    await prisma.competencia.deleteMany({
      where: { id: competenciaId },
    });
    await prisma.exercicio.deleteMany({
      where: { id: exercicioId },
    });
    await prisma.orgao.deleteMany({
      where: { id: orgaoId },
    });
  });

  it("deve calcular folhaTotal = folhaBase + suplementar", async () => {
    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    expect(calculo.folhaBase.toString()).toBe("5000");
    expect(calculo.folhaSuplementar.toString()).toBe("1000");
    expect(calculo.folhaTotal.toString()).toBe("6000");
  });

  it("deve calcular folhaTotal sem suplementar", async () => {
    const calculo = await calcService.calcularFolhaTotal(folhaId);

    expect(calculo.folhaBase.toString()).toBe("5000");
    expect(calculo.folhaSuplementar.toString()).toBe("0");
    expect(calculo.folhaTotal.toString()).toBe("5000");
  });

  it("deve calcular valorRecolherCalculado = folhaTotal * aliquota / 100", async () => {
    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    const esperado = new Decimal("6000").times(new Decimal("20")).dividedBy(new Decimal("100"));
    expect(calculo.valorRecolherCalculado.toString()).toBe(esperado.toString());
  });

  it("deve calcular valor com aliquota diferente", async () => {
    await prisma.folhaPrevidenciaria.update({
      where: { id: folhaId },
      data: {
        aliquota: new Decimal("15"),
      },
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    const esperado = new Decimal("5000").times(new Decimal("15")).dividedBy(new Decimal("100"));
    expect(calculo.valorRecolherCalculado.toString()).toBe(esperado.toString());
  });

  it("deve recalcular folha após atualizar suplementar", async () => {
    const supl = await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    const calculoAntes = await calcService.calcularFolhaTotal(folhaId);
    expect(calculoAntes.folhaTotal.toString()).toBe("6000");

    await suplService.updateFolhaSuplementer(supl.id, {
      folhaBase: new Decimal("2000"),
    });

    await calcService.recalcularFolha(folhaId);

    const folha = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: folhaId },
    });

    const esperado = new Decimal("7000").times(new Decimal("20")).dividedBy(new Decimal("100"));
    expect(folha?.valorRecolherCalculado?.toString()).toBe(esperado.toString());
  });

  it("deve recalcular folha após adicionar nova suplementar", async () => {
    const calculoAntes = await calcService.calcularFolhaTotal(folhaId);
    const valorAntes = calculoAntes.valorRecolherCalculado;

    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    await calcService.recalcularFolha(folhaId);

    const folha = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: folhaId },
    });

    const esperado = new Decimal("6000").times(new Decimal("20")).dividedBy(new Decimal("100"));
    expect(folha?.valorRecolherCalculado?.toString()).toBe(esperado.toString());
    expect(new Decimal(folha?.valorRecolherCalculado || 0).toNumber()).toBeGreaterThan(
      valorAntes.toNumber()
    );
  });

  it("deve recalcular folha após deletar suplementar", async () => {
    const supl = await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    await suplService.deleteFolhaSuplementer(supl.id);

    await calcService.recalcularFolha(folhaId);

    const folha = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: folhaId },
    });

    const esperado = new Decimal("5000").times(new Decimal("20")).dividedBy(new Decimal("100"));
    expect(folha?.valorRecolherCalculado?.toString()).toBe(esperado.toString());
  });

  it("deve calcular com múltiplas suplementares", async () => {
    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "COMPLEMENTACAO",
      folhaBase: new Decimal("500"),
    });

    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "FERIAS",
      folhaBase: new Decimal("500"),
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    expect(calculo.folhaBase.toString()).toBe("5000");
    expect(calculo.folhaSuplementar.toString()).toBe("2000");
    expect(calculo.folhaTotal.toString()).toBe("7000");

    const esperado = new Decimal("7000").times(new Decimal("20")).dividedBy(new Decimal("100"));
    expect(calculo.valorRecolherCalculado.toString()).toBe(esperado.toString());
  });

  it("deve lançar erro quando folha não existe", async () => {
    const erro = await calcService.calcularFolhaTotal(99999).catch((e) => e);
    expect(erro).toBeDefined();
    expect(erro.message).toBe("Folha não encontrada");
  });

  it("deve atualizar valorRecolherCalculado na tabela", async () => {
    const folhaAntes = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: folhaId },
    });

    await suplService.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("1000"),
    });

    await calcService.recalcularFolha(folhaId);

    const folhaDepois = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: folhaId },
    });

    const valorAntesNum = new Decimal(folhaAntes?.valorRecolherCalculado || 0).toNumber();
    const valorDepoisdNum = new Decimal(folhaDepois?.valorRecolherCalculado || 0).toNumber();
    expect(valorDepoisdNum).toBeGreaterThan(valorAntesNum);
  });

  it("deve manter precisão com valores decimais grandes", async () => {
    await prisma.folhaPrevidenciaria.update({
      where: { id: folhaId },
      data: {
        folhaBase: new Decimal("123456.78"),
        aliquota: new Decimal("20.5"),
      },
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    const esperado = new Decimal("123456.78")
      .times(new Decimal("20.5"))
      .dividedBy(new Decimal("100"));
    expect(calculo.valorRecolherCalculado.toString()).toBe(esperado.toString());
  });

  it("deve calcular com aliquota zero", async () => {
    await prisma.folhaPrevidenciaria.update({
      where: { id: folhaId },
      data: {
        aliquota: new Decimal("0"),
      },
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    expect(calculo.valorRecolherCalculado.toString()).toBe("0");
  });

  it("deve calcular com folha base zero", async () => {
    await prisma.folhaPrevidenciaria.update({
      where: { id: folhaId },
      data: {
        folhaBase: new Decimal("0"),
      },
    });

    const calculo = await calcService.calcularFolhaTotal(folhaId);

    expect(calculo.folhaBase.toString()).toBe("0");
    expect(calculo.folhaTotal.toString()).toBe("0");
    expect(calculo.valorRecolherCalculado.toString()).toBe("0");
  });
});
