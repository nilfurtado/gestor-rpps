import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { calcularLancamento } from "@/lib/calc/lancamento";
import {
  calcularValorARecolher,
  calcularDiferenca,
  calcularFolhaTotal,
  calcularTotalARecolher,
  calcularTotalRecolhido,
  calcularDeficitTotal,
} from "@/lib/tipo-folha-service";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface FolhaInput {
  tipoFolhaId: number;
  valor: number;
  valorRecolhido: number;
}

export interface CreateLancamentoInput {
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
  // Campos legados mantidos para compatibilidade
  aliquota?: number;
  valorRecolher?: number;
  valorRecolhido?: number;
  quantidadeServidores?: number | null;
  folhaBase?: number | null;
  folhaSuplementar?: number | null;
  multas?: number | null;
  juros?: number | null;
  acrescimo?: number | null;
  acrescimo_tipo?: "ACRESCIMO" | "DIFERENCA" | "QUITADO";
  parcelado?: boolean;
  dataVencimento?: Date | null;
  observacoes?: string | null;
  justificativaDiferenca?: string | null;
  diferenca_aprovada?: boolean;
  dataAprovacao?: Date | null;
  // Folhas dinâmicas
  folhas?: FolhaInput[];
}

export interface UpdateLancamentoInput {
  // Todos campos opcionais para PATCH parcial
  aliquota?: number;
  valorRecolher?: number;
  valorRecolhido?: number;
  quantidadeServidores?: number | null;
  folhaBase?: number | null;
  folhaSuplementar?: number | null;
  multas?: number | null;
  juros?: number | null;
  acrescimo?: number;
  acrescimo_tipo?: "ACRESCIMO" | "DIFERENCA" | "QUITADO";
  parcelado?: boolean;
  dataVencimento?: Date | null;
  observacoes?: string | null;
  justificativaDiferenca?: string | null;
  diferenca_aprovada?: boolean;
  dataAprovacao?: Date | null;
  // Folhas dinâmicas (substituição completa se fornecidas)
  folhas?: FolhaInput[];
}

// ---------------------------------------------------------------------------
// createLancamento
// ---------------------------------------------------------------------------

export async function createLancamento(
  input: CreateLancamentoInput,
  usuarioId: number
) {
  const folhasInput = input.folhas ?? [];

  // 1. Validar folhas: se enviadas, deve conter pelo menos uma folha obrigatória (Base)
  if (folhasInput.length > 0) {
    const tipoFolhaIds = folhasInput.map((f) => f.tipoFolhaId);
    const tiposFolha = await prisma.tipoFolha.findMany({
      where: { id: { in: tipoFolhaIds } },
    });

    // Verificar que todos os tipoFolhaId informados existem
    for (const f of folhasInput) {
      const tipo = tiposFolha.find((t) => t.id === f.tipoFolhaId);
      if (!tipo) {
        throw new Error(`TipoFolha com id ${f.tipoFolhaId} não encontrado.`);
      }
    }

    // Verificar que ao menos uma folha obrigatória (Base) está presente
    const temObrigatoria = tiposFolha.some((t) => t.obrigatorio);
    if (!temObrigatoria) {
      throw new Error(
        "Folha Base é obrigatória. Inclua pelo menos uma folha do tipo obrigatório."
      );
    }
  }

  // 2. Determinar alíquota do lançamento
  const aliquota = input.tipo === "PATRONAL" ? 15 : 10;

  // 3. Calcular valores por folha
  const folhasComCalculos = folhasInput.map((f) => {
    const valorARecolher = calcularValorARecolher(f.valor, aliquota);
    const diferenca = calcularDiferenca(valorARecolher, f.valorRecolhido);
    return {
      tipoFolhaId: f.tipoFolhaId,
      valor: f.valor,
      aliquota,
      valorARecolher,
      valorRecolhido: f.valorRecolhido,
      diferenca,
    };
  });

  // 4. Calcular totalizadores
  const folhaTotal = calcularFolhaTotal(folhasComCalculos);
  const totalARecolher = calcularTotalARecolher(folhasComCalculos);
  const totalRecolhido = calcularTotalRecolhido(folhasComCalculos);
  const deficitTotal = calcularDeficitTotal(folhasComCalculos);

  // 5. Campos para o registro legado (compatibilidade com campos existentes)
  //    Usar totalizadores calculados quando folhas dinâmicas forem fornecidas
  const valorRecolher =
    folhasComCalculos.length > 0 ? totalARecolher : (input.valorRecolher ?? 0);
  const valorRecolhido =
    folhasComCalculos.length > 0 ? totalRecolhido : (input.valorRecolhido ?? 0);

  const calc = calcularLancamento({
    valorRecolher,
    valorRecolhido,
    multas: input.multas ?? 0,
    juros: input.juros ?? 0,
    acrescimo: input.acrescimo ?? 0,
    parcelado: input.parcelado ?? false,
    diferenca_aprovada: input.diferenca_aprovada ?? false,
  });

  // 6. Criar lançamento com folhas associadas em transação
  const lancamento = await prisma.$transaction(async (tx) => {
    const created = await tx.folhaPrevidenciaria.create({
      data: {
        orgaoId: input.orgaoId,
        tipo: input.tipo,
        exercicioId: input.exercicioId,
        competenciaId: input.competenciaId,
        aliquota: input.aliquota ?? aliquota,
        valorRecolher,
        valorRecolherCalculado: totalARecolher,
        valorRecolhido,
        quantidadeServidores: input.quantidadeServidores ?? null,
        folhaBase: input.folhaBase ?? null,
        folhaSuplementar: input.folhaSuplementar ?? 0,
        multas: input.multas ?? null,
        juros: input.juros ?? null,
        acrescimo: input.acrescimo ?? 0,
        acrescimo_tipo: input.acrescimo_tipo ?? "QUITADO",
        parcelado: input.parcelado ?? false,
        dataVencimento: input.dataVencimento ?? null,
        observacoes: input.observacoes ?? null,
        justificativaDiferenca: input.justificativaDiferenca ?? null,
        diferenca_aprovada: input.diferenca_aprovada ?? false,
        dataAprovacao: input.dataAprovacao ?? null,
        responsavelId: usuarioId,
        deficit: calc.deficit,
        inadimplencia: calc.inadimplencia,
        percentualPago: calc.percentualPago,
        superavit: calc.superavit,
        encargosTotal: calc.encargosTotal,
        valorTotalDevido: calc.valorTotalDevido,
        valorLiquidoArrecadado: calc.valorLiquidoArrecadado,
        status: calc.status,
        // Totalizadores de folhas dinâmicas
        folhaTotal: folhasComCalculos.length > 0 ? folhaTotal : (input.folhaBase ?? 0),
        totalARecolher,
        totalRecolhido,
        deficitTotal,
        // Folhas dinâmicas associadas
        ...(folhasComCalculos.length > 0 && {
          folhas: {
            create: folhasComCalculos,
          },
        }),
      },
      include: {
        orgao: true,
        exercicio: true,
        competencia: true,
        folhas: { include: { tipoFolha: true } },
      },
    });

    return created;
  });

  // 7. Registrar auditoria
  await recordAudit({
    entityType: "FolhaPrevidenciaria",
    entityId: lancamento.id,
    action: "CREATE",
    after: lancamento,
    userId: usuarioId,
  });

  return lancamento;
}

// ---------------------------------------------------------------------------
// updateLancamento
// ---------------------------------------------------------------------------

export async function updateLancamento(
  id: number,
  input: UpdateLancamentoInput,
  usuarioId: number
) {
  // Buscar estado atual
  const before = await prisma.folhaPrevidenciaria.findUnique({
    where: { id },
    include: { exercicio: true, folhas: true },
  });

  if (!before) {
    throw new Error(`Lançamento com id ${id} não encontrado.`);
  }

  if (before.exercicio.status === "ENCERRADO") {
    throw new Error(
      `Exercício ${before.exercicio.ano} está encerrado. Edição bloqueada.`
    );
  }

  const folhasInput = input.folhas;

  let folhasComCalculos: Array<{
    tipoFolhaId: number;
    valor: number;
    aliquota: number;
    valorARecolher: number;
    valorRecolhido: number;
    diferenca: number;
  }> = [];

  let folhaTotal: number | undefined;
  let totalARecolher: number | undefined;
  let totalRecolhido: number | undefined;
  let deficitTotal: number | undefined;

  // Se folhas foram fornecidas, reprocessar
  if (folhasInput && folhasInput.length > 0) {
    const tipoFolhaIds = folhasInput.map((f) => f.tipoFolhaId);
    const tiposFolha = await prisma.tipoFolha.findMany({
      where: { id: { in: tipoFolhaIds } },
    });

    // Validar que todos os tipoFolhaId existem
    for (const f of folhasInput) {
      const tipo = tiposFolha.find((t) => t.id === f.tipoFolhaId);
      if (!tipo) {
        throw new Error(`TipoFolha com id ${f.tipoFolhaId} não encontrado.`);
      }
    }

    // Verificar folha obrigatória
    const temObrigatoria = tiposFolha.some((t) => t.obrigatorio);
    if (!temObrigatoria) {
      throw new Error(
        "Folha Base é obrigatória. Inclua pelo menos uma folha do tipo obrigatório."
      );
    }

    // Determinar alíquota
    const tipoLancamento = before.tipo;
    const aliquota = tipoLancamento === "PATRONAL" ? 15 : 10;

    folhasComCalculos = folhasInput.map((f) => {
      const valorARecolher = calcularValorARecolher(f.valor, aliquota);
      const diferenca = calcularDiferenca(valorARecolher, f.valorRecolhido);
      return {
        tipoFolhaId: f.tipoFolhaId,
        valor: f.valor,
        aliquota,
        valorARecolher,
        valorRecolhido: f.valorRecolhido,
        diferenca,
      };
    });

    folhaTotal = calcularFolhaTotal(folhasComCalculos);
    totalARecolher = calcularTotalARecolher(folhasComCalculos);
    totalRecolhido = calcularTotalRecolhido(folhasComCalculos);
    deficitTotal = calcularDeficitTotal(folhasComCalculos);
  }

  // Montar dados para update
  const dataToUpdate: Record<string, unknown> = {};

  if (input.aliquota !== undefined) dataToUpdate.aliquota = input.aliquota;
  if (input.quantidadeServidores !== undefined)
    dataToUpdate.quantidadeServidores = input.quantidadeServidores;
  if (input.folhaBase !== undefined) dataToUpdate.folhaBase = input.folhaBase;
  if (input.folhaSuplementar !== undefined)
    dataToUpdate.folhaSuplementar = input.folhaSuplementar ?? 0;
  if (input.multas !== undefined) dataToUpdate.multas = input.multas;
  if (input.juros !== undefined) dataToUpdate.juros = input.juros;
  if (input.acrescimo !== undefined) dataToUpdate.acrescimo = input.acrescimo;
  if (input.acrescimo_tipo !== undefined)
    dataToUpdate.acrescimo_tipo = input.acrescimo_tipo;
  if (input.parcelado !== undefined) dataToUpdate.parcelado = input.parcelado;
  if (input.dataVencimento !== undefined)
    dataToUpdate.dataVencimento = input.dataVencimento;
  if (input.observacoes !== undefined)
    dataToUpdate.observacoes = input.observacoes;
  if (input.justificativaDiferenca !== undefined)
    dataToUpdate.justificativaDiferenca = input.justificativaDiferenca;
  if (input.diferenca_aprovada !== undefined)
    dataToUpdate.diferenca_aprovada = input.diferenca_aprovada;
  if (input.dataAprovacao !== undefined)
    dataToUpdate.dataAprovacao = input.dataAprovacao;

  // Se folhas dinâmicas foram recalculadas, usar totalizadores
  if (folhasInput && folhasInput.length > 0) {
    dataToUpdate.valorRecolher = totalARecolher;
    dataToUpdate.valorRecolherCalculado = totalARecolher;
    dataToUpdate.valorRecolhido = totalRecolhido;
    dataToUpdate.folhaTotal = folhaTotal;
    dataToUpdate.totalARecolher = totalARecolher;
    dataToUpdate.totalRecolhido = totalRecolhido;
    dataToUpdate.deficitTotal = deficitTotal;
  } else {
    // Atualizar campos legados se fornecidos
    if (input.valorRecolher !== undefined)
      dataToUpdate.valorRecolher = input.valorRecolher;
    if (input.valorRecolhido !== undefined)
      dataToUpdate.valorRecolhido = input.valorRecolhido;
  }

  // Recalcular status/deficit se valores relevantes mudaram
  const isAprovado =
    (input.diferenca_aprovada ?? Boolean(before.diferenca_aprovada));

  if (isAprovado) {
    dataToUpdate.status = "PAGO";
    dataToUpdate.deficit = 0;
    dataToUpdate.inadimplencia = 0;
  } else {
    const vRecolher = Number(dataToUpdate.valorRecolher ?? before.valorRecolher);
    const vRecolhido = Number(
      dataToUpdate.valorRecolhido ?? before.valorRecolhido
    );
    const calc = calcularLancamento({
      valorRecolher: vRecolher,
      valorRecolhido: vRecolhido,
      multas: Number(input.multas ?? before.multas ?? 0),
      juros: Number(input.juros ?? before.juros ?? 0),
      acrescimo: Number(input.acrescimo ?? before.acrescimo ?? 0),
      parcelado: Boolean(input.parcelado ?? before.parcelado),
      diferenca_aprovada: Boolean(
        input.diferenca_aprovada ?? before.diferenca_aprovada
      ),
    });
    dataToUpdate.deficit = calc.deficit;
    dataToUpdate.inadimplencia = calc.inadimplencia;
    dataToUpdate.percentualPago = calc.percentualPago;
    dataToUpdate.superavit = calc.superavit;
    dataToUpdate.encargosTotal = calc.encargosTotal;
    dataToUpdate.valorTotalDevido = calc.valorTotalDevido;
    dataToUpdate.valorLiquidoArrecadado = calc.valorLiquidoArrecadado;
    dataToUpdate.status = calc.status;
  }

  // Executar em transação para garantir atomicidade
  const updated = await prisma.$transaction(async (tx) => {
    // Se folhas dinâmicas foram fornecidas, substituir (deleteMany + createMany)
    if (folhasInput && folhasInput.length > 0) {
      await tx.lancamentoFolha.deleteMany({ where: { lancamentoId: id } });
      await tx.lancamentoFolha.createMany({
        data: folhasComCalculos.map((f) => ({ ...f, lancamentoId: id })),
      });
    }

    return tx.folhaPrevidenciaria.update({
      where: { id },
      data: dataToUpdate,
      include: {
        orgao: true,
        exercicio: true,
        competencia: true,
        folhas: { include: { tipoFolha: true } },
      },
    });
  });

  // Registrar auditoria
  await recordAudit({
    entityType: "FolhaPrevidenciaria",
    entityId: id,
    action: "UPDATE",
    before,
    after: updated,
    userId: usuarioId,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// getLancamento
// ---------------------------------------------------------------------------

export async function getLancamento(id: number) {
  return prisma.folhaPrevidenciaria.findUnique({
    where: { id },
    include: {
      orgao: true,
      exercicio: true,
      competencia: true,
      folhas: { include: { tipoFolha: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// listLancamentos
// ---------------------------------------------------------------------------

export async function listLancamentos(filters?: {
  orgaoId?: number;
  exercicioId?: number;
  competenciaId?: number;
  tipo?: "PATRONAL" | "SEGURADO";
}) {
  return prisma.folhaPrevidenciaria.findMany({
    where: {
      ...(filters?.orgaoId ? { orgaoId: filters.orgaoId } : {}),
      ...(filters?.exercicioId ? { exercicioId: filters.exercicioId } : {}),
      ...(filters?.competenciaId
        ? { competenciaId: filters.competenciaId }
        : {}),
      ...(filters?.tipo ? { tipo: filters.tipo } : {}),
    },
    include: {
      orgao: true,
      exercicio: true,
      competencia: true,
      folhas: { include: { tipoFolha: true } },
    },
    orderBy: [{ exercicioId: "desc" }, { competenciaId: "desc" }],
  });
}

// ---------------------------------------------------------------------------
// deleteLancamento
// ---------------------------------------------------------------------------

export async function deleteLancamento(id: number, usuarioId: number) {
  const before = await prisma.folhaPrevidenciaria.findUnique({
    where: { id },
    include: { exercicio: true },
  });

  if (!before) {
    throw new Error(`Lançamento com id ${id} não encontrado.`);
  }

  if (before.exercicio.status === "ENCERRADO") {
    throw new Error(
      `Exercício ${before.exercicio.ano} está encerrado. Exclusão bloqueada.`
    );
  }

  await prisma.folhaPrevidenciaria.delete({ where: { id } });

  await recordAudit({
    entityType: "FolhaPrevidenciaria",
    entityId: id,
    action: "DELETE",
    before,
    userId: usuarioId,
  });

  return { ok: true };
}
