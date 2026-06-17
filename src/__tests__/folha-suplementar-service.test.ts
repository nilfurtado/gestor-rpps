import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db";
import * as service from "@/lib/folha-suplementar-service";
import { Decimal } from "@prisma/client/runtime/library";

describe("FolhaSupplementar Service", () => {
  let folhaId: number;
  let orgaoId: number;
  let exercicioId: number;
  let competenciaId: number;

  beforeEach(async () => {
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 900000) + 100000;
    const orgao = await prisma.orgao.create({
      data: {
        nome: `Teste Órgão ${timestamp}-${rand}`,
        sigla: `S${rand % 100000}`.slice(0, 5),
      },
    });
    orgaoId = orgao.id;

    // Use upsert to avoid race conditions between concurrent test files
    const anoExercicio = 2300 + (rand % 200);
    const exercicio = await prisma.exercicio.upsert({
      where: { ano: anoExercicio },
      update: {},
      create: { ano: anoExercicio },
    });
    exercicioId = exercicio.id;

    // Use upsert to avoid race conditions between concurrent test files
    const ordemComp = 800 + (rand % 500);
    const competencia = await prisma.competencia.upsert({
      where: { ordem: ordemComp },
      update: {},
      create: { mes: "JAN", ordem: ordemComp },
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

  it("deve criar suplementar com status SEM_MOVIMENTO", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    expect(supl.status).toBe("SEM_MOVIMENTO");
    expect(supl.folhaBase.toString()).toBe("500");
    expect(supl.motivo).toBe("RESCISAO");
    expect(supl.folhaPrevidenciariaId).toBe(folhaId);
  });

  it("deve criar suplementar com descrição e observações", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "COMPLEMENTACAO",
      folhaBase: new Decimal("750"),
      descricao: "Complementação de contribuição",
      observacoes: "Conforme resolução 123",
    });

    expect(supl.descricao).toBe("Complementação de contribuição");
    expect(supl.observacoes).toBe("Conforme resolução 123");
    expect(supl.folhaBase.toString()).toBe("750");
  });

  it("deve listar suplementares por folha", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "FERIAS",
      folhaBase: new Decimal("300"),
    });

    const list = await service.listFolhaSuplementer(folhaId);
    expect(list).toHaveLength(2);
    expect(list[0].motivo).toBe("FERIAS");
    expect(list[1].motivo).toBe("RESCISAO");
  });

  it("deve listar todas as suplementares sem filtro", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const list = await service.listFolhaSuplementer();
    expect(list.length).toBeGreaterThan(0);
  });

  it("deve obter suplementar por ID", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const obtida = await service.getFolhaSuplementer(supl.id);
    expect(obtida).not.toBeNull();
    expect(obtida?.id).toBe(supl.id);
    expect(obtida?.motivo).toBe("RESCISAO");
    expect(obtida?.folhaPrevidenciariaId).toBe(folhaId);
  });

  it("deve retornar null quando suplementar não existe", async () => {
    const obtida = await service.getFolhaSuplementer(99999);
    expect(obtida).toBeNull();
  });

  it("deve atualizar folhaBase da suplementar", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const atualizada = await service.updateFolhaSuplementer(supl.id, {
      folhaBase: new Decimal("750"),
    });

    expect(atualizada.folhaBase.toString()).toBe("750");
  });

  it("deve atualizar motivo da suplementar", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const atualizada = await service.updateFolhaSuplementer(supl.id, {
      motivo: "COMPLEMENTACAO",
    });

    expect(atualizada.motivo).toBe("COMPLEMENTACAO");
  });

  it("deve atualizar descrição e observações", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
      descricao: "Descricao antiga",
      observacoes: "Obs antiga",
    });

    const atualizada = await service.updateFolhaSuplementer(supl.id, {
      descricao: "Descrição nova",
      observacoes: "Obs nova",
    });

    expect(atualizada.descricao).toBe("Descrição nova");
    expect(atualizada.observacoes).toBe("Obs nova");
  });

  it("deve deletar suplementar", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    await service.deleteFolhaSuplementer(supl.id);

    const deletada = await service.getFolhaSuplementer(supl.id);
    expect(deletada).toBeNull();
  });

  it("deve calcular total suplementar de uma folha com um item", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const total = await service.getTotalSuplementerFolha(folhaId);
    expect(total.toString()).toBe("500");
  });

  it("deve calcular total suplementar com múltiplos itens", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "COMPLEMENTACAO",
      folhaBase: new Decimal("300"),
    });

    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "FERIAS",
      folhaBase: new Decimal("200"),
    });

    const total = await service.getTotalSuplementerFolha(folhaId);
    expect(total.toString()).toBe("1000");
  });

  it("deve retornar zero quando não há suplementares", async () => {
    const total = await service.getTotalSuplementerFolha(folhaId);
    expect(total.toString()).toBe("0");
  });

  it("deve listar suplementares de uma folha específica via getFolhasSuplementerByFolhaId", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "COMPLEMENTACAO",
      folhaBase: new Decimal("300"),
    });

    const list = await service.getFolhasSuplementerByFolhaId(folhaId);
    expect(list).toHaveLength(2);
    expect(list[0].folhaPrevidenciariaId).toBe(folhaId);
    expect(list[1].folhaPrevidenciariaId).toBe(folhaId);
  });

  it("deve incluir dados da folha previdenciária quando listar", async () => {
    await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const list = await service.listFolhaSuplementer(folhaId);
    expect(list[0].folhaPrevidenciaria).toBeDefined();
    expect(list[0].folhaPrevidenciaria?.id).toBe(folhaId);
  });

  it("deve incluir dados da folha previdenciária ao obter por ID", async () => {
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: new Decimal("500"),
    });

    const obtida = await service.getFolhaSuplementer(supl.id);
    expect(obtida?.folhaPrevidenciaria).toBeDefined();
    expect(obtida?.folhaPrevidenciaria?.id).toBe(folhaId);
  });

  it("deve preservar valores decimais com precisão", async () => {
    const valor = new Decimal("1234.56");
    const supl = await service.createFolhaSuplementer({
      folhaPrevidenciariaId: folhaId,
      motivo: "RESCISAO",
      folhaBase: valor,
    });

    expect(supl.folhaBase.toString()).toBe(valor.toString());
  });
});
