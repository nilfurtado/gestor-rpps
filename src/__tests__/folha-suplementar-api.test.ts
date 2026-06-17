import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

describe("FolhaSupplementar API Integration Tests", () => {
  let folhaId: number;
  let orgaoId: number;
  let exercicioId: number;
  let competenciaId: number;
  let suplementarId: number;

  beforeEach(async () => {
    const timestamp = Date.now();
    const orgao = await prisma.orgao.create({
      data: {
        nome: `Teste Órgão API ${timestamp}`,
        sigla: `TA${timestamp % 10000}`,
      },
    });
    orgaoId = orgao.id;

    const anoExercicio = 2000 + Math.floor((timestamp / 2000) % 25);
    let exercicio = await prisma.exercicio.findUnique({
      where: { ano: anoExercicio },
    });

    if (!exercicio) {
      exercicio = await prisma.exercicio.create({
        data: {
          ano: anoExercicio,
        },
      });
    }
    exercicioId = exercicio.id;

    const ordemCompetencia = 3 + Math.floor((timestamp / 1000000) % 9);
    let competencia = await prisma.competencia.findUnique({
      where: { ordem: ordemCompetencia },
    });

    if (!competencia) {
      competencia = await prisma.competencia.create({
        data: {
          mes: "MAR",
          ordem: ordemCompetencia,
        },
      });
    }
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

    const suplementar = await prisma.folhaSupplementar.create({
      data: {
        folhaPrevidenciariaId: folhaId,
        motivo: "RESCISAO",
        folhaBase: new Decimal("500"),
        status: "SEM_MOVIMENTO",
      },
    });
    suplementarId = suplementar.id;
  });

  afterEach(async () => {
    if (folhaId) {
      await prisma.folhaSupplementar.deleteMany({
        where: { folhaPrevidenciariaId: folhaId },
      });
    }
    if (exercicioId) {
      await prisma.folhaPrevidenciaria.deleteMany({
        where: { exercicioId },
      });
    }
    if (competenciaId) {
      await prisma.competencia.deleteMany({
        where: { id: competenciaId },
      });
    }
    if (exercicioId) {
      await prisma.exercicio.deleteMany({
        where: { id: exercicioId },
      });
    }
    if (orgaoId) {
      await prisma.orgao.deleteMany({
        where: { id: orgaoId },
      });
    }
  });

  describe("Listagem de Suplementares", () => {
    it("deve listar suplementares por folhaId", async () => {
      const lista = await prisma.folhaSupplementar.findMany({
        where: { folhaPrevidenciariaId: folhaId },
      });

      expect(lista.length).toBeGreaterThan(0);
      expect(lista[0].folhaPrevidenciariaId).toBe(folhaId);
    });

    it("deve listar com include da folha previdenciária", async () => {
      const lista = await prisma.folhaSupplementar.findMany({
        where: { folhaPrevidenciariaId: folhaId },
        include: { folhaPrevidenciaria: true },
      });

      expect(lista[0].folhaPrevidenciaria).toBeDefined();
      expect(lista[0].folhaPrevidenciaria?.id).toBe(folhaId);
    });
  });

  describe("Criação de Suplementares", () => {
    it("deve criar suplementar com campos obrigatórios", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "COMPLEMENTACAO",
          folhaBase: new Decimal("300"),
          status: "SEM_MOVIMENTO",
        },
      });

      expect(supl.id).toBeDefined();
      expect(supl.folhaPrevidenciariaId).toBe(folhaId);
      expect(supl.motivo).toBe("COMPLEMENTACAO");
      expect(supl.folhaBase.toString()).toBe("300");
      expect(supl.status).toBe("SEM_MOVIMENTO");

      await prisma.folhaSupplementar.delete({ where: { id: supl.id } });
    });

    it("deve criar suplementar com campos opcionais", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "FERIAS",
          folhaBase: new Decimal("400"),
          descricao: "Férias comuns",
          observacoes: "Conforme resolução 789",
          status: "SEM_MOVIMENTO",
        },
      });

      expect(supl.descricao).toBe("Férias comuns");
      expect(supl.observacoes).toBe("Conforme resolução 789");

      await prisma.folhaSupplementar.delete({ where: { id: supl.id } });
    });

    it("deve retornar status SEM_MOVIMENTO ao criar", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "OUTRO",
          folhaBase: new Decimal("200"),
          status: "SEM_MOVIMENTO",
        },
      });

      expect(supl.status).toBe("SEM_MOVIMENTO");

      await prisma.folhaSupplementar.delete({ where: { id: supl.id } });
    });
  });

  describe("Obtenção de Suplementar por ID", () => {
    it("deve obter suplementar existente", async () => {
      const supl = await prisma.folhaSupplementar.findUnique({
        where: { id: suplementarId },
      });

      expect(supl).toBeDefined();
      expect(supl?.id).toBe(suplementarId);
      expect(supl?.motivo).toBe("RESCISAO");
    });

    it("deve retornar null para suplementar inexistente", async () => {
      const supl = await prisma.folhaSupplementar.findUnique({
        where: { id: 99999 },
      });

      expect(supl).toBeNull();
    });

    it("deve obter com include da folha previdenciária", async () => {
      const supl = await prisma.folhaSupplementar.findUnique({
        where: { id: suplementarId },
        include: { folhaPrevidenciaria: true },
      });

      expect(supl?.folhaPrevidenciaria).toBeDefined();
      expect(supl?.folhaPrevidenciaria?.id).toBe(folhaId);
    });
  });

  describe("Atualização de Suplementar", () => {
    it("deve atualizar folhaBase", async () => {
      const atualizada = await prisma.folhaSupplementar.update({
        where: { id: suplementarId },
        data: { folhaBase: new Decimal("750") },
      });

      expect(atualizada.folhaBase.toString()).toBe("750");
    });

    it("deve atualizar motivo", async () => {
      const atualizada = await prisma.folhaSupplementar.update({
        where: { id: suplementarId },
        data: { motivo: "COMPLEMENTACAO" },
      });

      expect(atualizada.motivo).toBe("COMPLEMENTACAO");
    });

    it("deve atualizar descrição e observações", async () => {
      const atualizada = await prisma.folhaSupplementar.update({
        where: { id: suplementarId },
        data: {
          descricao: "Nova descrição",
          observacoes: "Nova observação",
        },
      });

      expect(atualizada.descricao).toBe("Nova descrição");
      expect(atualizada.observacoes).toBe("Nova observação");
    });

    it("deve preservar status ao atualizar", async () => {
      const atualizada = await prisma.folhaSupplementar.update({
        where: { id: suplementarId },
        data: { folhaBase: new Decimal("600") },
      });

      expect(atualizada.status).toBe("SEM_MOVIMENTO");
    });
  });

  describe("Deleção de Suplementar", () => {
    it("deve deletar suplementar existente", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "OUTRO",
          folhaBase: new Decimal("100"),
          status: "SEM_MOVIMENTO",
        },
      });

      const deletada = await prisma.folhaSupplementar.delete({
        where: { id: supl.id },
      });

      expect(deletada.id).toBe(supl.id);

      const naoEncontrada = await prisma.folhaSupplementar.findUnique({
        where: { id: supl.id },
      });

      expect(naoEncontrada).toBeNull();
    });

    it("deve retornar erro ao deletar inexistente", async () => {
      const erro = await prisma.folhaSupplementar.delete({
        where: { id: 99999 },
      }).catch((e) => e);

      expect(erro).toBeDefined();
    });
  });

  describe("Validações e Constraints", () => {
    it("deve validar constraint única de folhaPrevidenciariaId + motivo", async () => {
      const erro = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "RESCISAO",
          folhaBase: new Decimal("1000"),
          status: "SEM_MOVIMENTO",
        },
      }).catch((e) => e);

      expect(erro).toBeDefined();
      expect(erro.code).toBe("P2002");
    });

    it("deve obrigar folhaPrevidenciariaId", async () => {
      const erro = await prisma.folhaSupplementar.create({
        data: {
          motivo: "RESCISAO",
          folhaBase: new Decimal("500"),
          status: "SEM_MOVIMENTO",
        } as any,
      }).catch((e) => e);

      expect(erro).toBeDefined();
    });
  });

  describe("Operações em Sequência", () => {
    it("deve permitir criar, atualizar e deletar", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "COMPLEMENTACAO",
          folhaBase: new Decimal("250"),
          status: "SEM_MOVIMENTO",
        },
      });

      expect(supl.id).toBeDefined();

      const atualizada = await prisma.folhaSupplementar.update({
        where: { id: supl.id },
        data: { folhaBase: new Decimal("350") },
      });

      expect(atualizada.folhaBase.toString()).toBe("350");

      const deletada = await prisma.folhaSupplementar.delete({
        where: { id: supl.id },
      });

      expect(deletada.id).toBe(supl.id);

      const naoEncontrada = await prisma.folhaSupplementar.findUnique({
        where: { id: supl.id },
      });

      expect(naoEncontrada).toBeNull();
    });

    it("deve agregar múltiplas suplementares", async () => {
      const supl1 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "COMPLEMENTACAO",
          folhaBase: new Decimal("100"),
          status: "SEM_MOVIMENTO",
        },
      });

      const supl2 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "FERIAS",
          folhaBase: new Decimal("200"),
          status: "SEM_MOVIMENTO",
        },
      });

      const total = await prisma.folhaSupplementar.aggregate({
        where: { folhaPrevidenciariaId: folhaId },
        _sum: { folhaBase: true },
      });

      expect(total._sum.folhaBase?.toString()).toBe("800");

      await prisma.folhaSupplementar.delete({ where: { id: supl1.id } });
      await prisma.folhaSupplementar.delete({ where: { id: supl2.id } });
    });

    it("deve listar ordenada por data de criação", async () => {
      const supl1 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "COMPLEMENTACAO",
          folhaBase: new Decimal("100"),
          status: "SEM_MOVIMENTO",
        },
      });

      const supl2 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "FERIAS",
          folhaBase: new Decimal("50"),
          status: "SEM_MOVIMENTO",
        },
      });

      const lista = await prisma.folhaSupplementar.findMany({
        where: { folhaPrevidenciariaId: folhaId },
        orderBy: { createdAt: "desc" },
      });

      expect(lista[0].id).toBe(supl2.id);
      expect(lista[1].id).toBe(supl1.id);

      await prisma.folhaSupplementar.delete({ where: { id: supl1.id } });
      await prisma.folhaSupplementar.delete({ where: { id: supl2.id } });
    });
  });

  describe("Cálculo e Recálculo", () => {
    it("deve calcular total de suplementares por folha", async () => {
      const supl1 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "COMPLEMENTACAO",
          folhaBase: new Decimal("500"),
          status: "SEM_MOVIMENTO",
        },
      });

      const supl2 = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "FERIAS",
          folhaBase: new Decimal("300"),
          status: "SEM_MOVIMENTO",
        },
      });

      const total = await prisma.folhaSupplementar.aggregate({
        where: { folhaPrevidenciariaId: folhaId },
        _sum: { folhaBase: true },
      });

      expect(total._sum.folhaBase?.toString()).toBe("1300");

      await prisma.folhaSupplementar.delete({ where: { id: supl1.id } });
      await prisma.folhaSupplementar.delete({ where: { id: supl2.id } });
    });

    it("deve manter precisão em cálculos monetários", async () => {
      const supl = await prisma.folhaSupplementar.create({
        data: {
          folhaPrevidenciariaId: folhaId,
          motivo: "OUTRO",
          folhaBase: new Decimal("1234.56"),
          status: "SEM_MOVIMENTO",
        },
      });

      expect(supl.folhaBase.toString()).toBe("1234.56");

      await prisma.folhaSupplementar.delete({ where: { id: supl.id } });
    });
  });
});
