import type {
  FormaGarantia,
  StatusAcordo,
  TipoDebitoAcordo,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type AcordoRelatorioTipo =
  | "geral"
  | "parcelas-pagas"
  | "parcelas-em-atraso"
  | "extrato"
  | "demonstrativo-orgao"
  | "anual";

export const ACORDO_RELATORIO_TITULOS: Record<AcordoRelatorioTipo, string> = {
  geral: "Relatório Geral de Acordos",
  "parcelas-pagas": "Parcelas Pagas",
  "parcelas-em-atraso": "Parcelas em Atraso",
  extrato: "Extrato do Parcelamento",
  "demonstrativo-orgao": "Demonstrativo por Órgão",
  anual: "Relatório Anual de Parcelamentos",
};

export interface AcordoReportFilters {
  acordoId?: number;
  orgaoId?: number;
  status?: StatusAcordo;
  tipoDebito?: TipoDebitoAcordo;
  competenciaId?: number;
  ano?: number;
  dataInicio?: Date;
  dataFim?: Date;
}

function commonWhere(filters: AcordoReportFilters) {
  return {
    ...(filters.orgaoId ? { orgaoId: filters.orgaoId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.tipoDebito ? { tipoDebito: filters.tipoDebito } : {}),
    ...(filters.competenciaId
      ? { lancamentos: { some: { competenciaId: filters.competenciaId } } }
      : {}),
    ...(filters.dataInicio || filters.dataFim
      ? {
          dataAcordo: {
            ...(filters.dataInicio ? { gte: filters.dataInicio } : {}),
            ...(filters.dataFim ? { lte: filters.dataFim } : {}),
          },
        }
      : {}),
  } as const;
}

interface GeralRow {
  numero: string;
  orgaoSigla: string;
  orgaoNome: string;
  tipoDebito: TipoDebitoAcordo;
  dataAcordo: Date;
  qtdLancamentos: number;
  valorConsolidado: number;
  valorPago: number;
  percentualPago: number;
  parcelasPagas: number;
  numeroParcelas: number;
  status: StatusAcordo;
}

interface ParcelasPagasRow {
  numero: string;
  orgaoSigla: string;
  parcelasPagas: number;
  numeroParcelas: number;
  valorPago: number;
  valorParcela: number;
  ultimaParcelaData: Date | null;
  percentualConsolidado: number;
  status: StatusAcordo;
}

interface ParcelasAtrasoRow {
  numero: string;
  orgaoSigla: string;
  parcelasEsperadas: number;
  parcelasPagas: number;
  parcelasAtrasadas: number;
  valorAtrasado: number;
  proximoVencimento: Date | null;
  valorParcela: number;
}

interface ExtratoData {
  numero: string;
  orgaoSigla: string;
  orgaoNome: string;
  tipoDebito: TipoDebitoAcordo;
  dataAcordo: Date;
  status: StatusAcordo;
  leiAutorizativa: string | null;
  formaGarantia: FormaGarantia | null;
  garantiaDetalhes: string | null;
  observacoes: string | null;

  valorOriginal: number;
  atualizacaoMonetaria: number;
  jurosAcordo: number;
  multaAcordo: number;
  valorConsolidado: number;
  valorPago: number;
  saldo: number;
  percentualPago: number;

  numeroParcelas: number;
  parcelasPagas: number;
  valorParcela: number;
  diaVencimento: number;
  primeiroVencimento: Date;

  lancamentos: {
    competencia: string;
    ano: number;
    tipo: "PATRONAL" | "SEGURADO";
    deficit: number;
  }[];

  cronograma: {
    n: number;
    vencimento: Date;
    valor: number;
    situacao: "PAGA" | "PENDENTE" | "ATRASADA";
  }[];
}

interface DemonstrativoOrgaoGrupo {
  orgaoSigla: string;
  orgaoNome: string;
  acordos: {
    numero: string;
    tipoDebito: TipoDebitoAcordo;
    dataAcordo: Date;
    valorConsolidado: number;
    valorPago: number;
    saldo: number;
    status: StatusAcordo;
  }[];
  subtotais: {
    consolidado: number;
    pago: number;
    saldo: number;
    qtdAcordos: number;
  };
}

interface AnualRow {
  numero: string;
  orgaoSigla: string;
  tipoDebito: TipoDebitoAcordo;
  dataAcordo: Date;
  valorConsolidado: number;
  valorPago: number;
  saldo: number;
  status: StatusAcordo;
}

export type AcordoReportResult =
  | {
      tipo: "geral";
      titulo: string;
      filtros: Record<string, string>;
      rows: GeralRow[];
      totais: { consolidado: number; pago: number; saldo: number; qtd: number };
    }
  | {
      tipo: "parcelas-pagas";
      titulo: string;
      filtros: Record<string, string>;
      rows: ParcelasPagasRow[];
      totais: { totalPago: number; qtdParcelas: number; qtdAcordos: number };
    }
  | {
      tipo: "parcelas-em-atraso";
      titulo: string;
      filtros: Record<string, string>;
      rows: ParcelasAtrasoRow[];
      totais: { totalAtrasado: number; qtdAcordosAtrasados: number; qtdParcelasAtrasadas: number };
    }
  | {
      tipo: "extrato";
      titulo: string;
      filtros: Record<string, string>;
      extrato: ExtratoData;
    }
  | {
      tipo: "demonstrativo-orgao";
      titulo: string;
      filtros: Record<string, string>;
      grupos: DemonstrativoOrgaoGrupo[];
      totaisGerais: { consolidado: number; pago: number; saldo: number; qtdAcordos: number };
    }
  | {
      tipo: "anual";
      titulo: string;
      filtros: Record<string, string>;
      ano: number;
      rows: AnualRow[];
      totais: { consolidado: number; pago: number; saldo: number; qtd: number };
    };

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function nthInstallmentDate(first: Date, n: number, day: number): Date {
  // n é 1-indexado
  const d = new Date(first.getFullYear(), first.getMonth() + (n - 1), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ───────────────────────────────────────────────────────────────
// Builder
// ───────────────────────────────────────────────────────────────

export async function buildAcordoReport(
  tipo: AcordoRelatorioTipo,
  filters: AcordoReportFilters
): Promise<AcordoReportResult> {
  const titulo = ACORDO_RELATORIO_TITULOS[tipo];

  switch (tipo) {
    case "geral":
      return buildGeral(titulo, filters);
    case "parcelas-pagas":
      return buildParcelasPagas(titulo, filters);
    case "parcelas-em-atraso":
      return buildParcelasAtraso(titulo, filters);
    case "extrato":
      return buildExtrato(titulo, filters);
    case "demonstrativo-orgao":
      return buildDemonstrativoOrgao(titulo, filters);
    case "anual":
      return buildAnual(titulo, filters);
  }
}

async function buildGeral(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "geral" }>> {
  const acordos = await prisma.acordo.findMany({
    where: commonWhere(filters),
    include: {
      orgao: { select: { sigla: true, nome: true } },
      lancamentos: { select: { id: true } },
    },
    orderBy: [{ dataAcordo: "desc" }, { id: "desc" }],
  });

  const rows: GeralRow[] = acordos.map((a) => {
    const cons = Number(a.valorConsolidado);
    const pag = Number(a.valorPago);
    return {
      numero: a.numero,
      orgaoSigla: a.orgao.sigla,
      orgaoNome: a.orgao.nome,
      tipoDebito: a.tipoDebito,
      dataAcordo: a.dataAcordo,
      qtdLancamentos: a.lancamentos.length,
      valorConsolidado: cons,
      valorPago: pag,
      percentualPago: cons > 0 ? (pag / cons) * 100 : 0,
      parcelasPagas: a.parcelasPagas,
      numeroParcelas: a.numeroParcelas,
      status: a.status,
    };
  });

  const totais = rows.reduce(
    (acc, r) => ({
      consolidado: acc.consolidado + r.valorConsolidado,
      pago: acc.pago + r.valorPago,
      saldo: acc.saldo + (r.valorConsolidado - r.valorPago),
      qtd: acc.qtd + 1,
    }),
    { consolidado: 0, pago: 0, saldo: 0, qtd: 0 }
  );

  return { tipo: "geral", titulo, filtros: buildFiltrosLabel(filters), rows, totais };
}

async function buildParcelasPagas(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "parcelas-pagas" }>> {
  const acordos = await prisma.acordo.findMany({
    where: { ...commonWhere(filters), parcelasPagas: { gt: 0 } },
    include: { orgao: { select: { sigla: true } } },
    orderBy: [{ valorPago: "desc" }],
  });

  const rows: ParcelasPagasRow[] = acordos.map((a) => {
    const cons = Number(a.valorConsolidado);
    const pag = Number(a.valorPago);
    const vp = Number(a.valorParcela);
    const ultima =
      a.parcelasPagas > 0
        ? nthInstallmentDate(a.primeiroVencimento, a.parcelasPagas, a.diaVencimento)
        : null;
    return {
      numero: a.numero,
      orgaoSigla: a.orgao.sigla,
      parcelasPagas: a.parcelasPagas,
      numeroParcelas: a.numeroParcelas,
      valorPago: pag,
      valorParcela: vp,
      ultimaParcelaData: ultima,
      percentualConsolidado: cons > 0 ? (pag / cons) * 100 : 0,
      status: a.status,
    };
  });

  const totais = rows.reduce(
    (acc, r) => ({
      totalPago: acc.totalPago + r.valorPago,
      qtdParcelas: acc.qtdParcelas + r.parcelasPagas,
      qtdAcordos: acc.qtdAcordos + 1,
    }),
    { totalPago: 0, qtdParcelas: 0, qtdAcordos: 0 }
  );

  return {
    tipo: "parcelas-pagas",
    titulo,
    filtros: buildFiltrosLabel(filters),
    rows,
    totais,
  };
}

async function buildParcelasAtraso(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "parcelas-em-atraso" }>> {
  const acordos = await prisma.acordo.findMany({
    where: { ...commonWhere({ ...filters, status: "VIGENTE" }) },
    include: { orgao: { select: { sigla: true } } },
    orderBy: [{ dataAcordo: "asc" }],
  });

  const hoje = startOfDay(new Date());
  const rows: ParcelasAtrasoRow[] = [];

  for (const a of acordos) {
    let parcelasEsperadas = 0;
    for (let n = 1; n <= a.numeroParcelas; n++) {
      const due = nthInstallmentDate(a.primeiroVencimento, n, a.diaVencimento);
      if (startOfDay(due) <= hoje) parcelasEsperadas++;
      else break;
    }
    const parcelasAtrasadas = Math.max(0, parcelasEsperadas - a.parcelasPagas);
    if (parcelasAtrasadas === 0) continue;
    const valorAtrasado = parcelasAtrasadas * Number(a.valorParcela);
    const proxima =
      a.parcelasPagas < a.numeroParcelas
        ? nthInstallmentDate(a.primeiroVencimento, a.parcelasPagas + 1, a.diaVencimento)
        : null;
    rows.push({
      numero: a.numero,
      orgaoSigla: a.orgao.sigla,
      parcelasEsperadas,
      parcelasPagas: a.parcelasPagas,
      parcelasAtrasadas,
      valorAtrasado,
      proximoVencimento: proxima,
      valorParcela: Number(a.valorParcela),
    });
  }

  rows.sort((a, b) => b.valorAtrasado - a.valorAtrasado);

  const totais = rows.reduce(
    (acc, r) => ({
      totalAtrasado: acc.totalAtrasado + r.valorAtrasado,
      qtdAcordosAtrasados: acc.qtdAcordosAtrasados + 1,
      qtdParcelasAtrasadas: acc.qtdParcelasAtrasadas + r.parcelasAtrasadas,
    }),
    { totalAtrasado: 0, qtdAcordosAtrasados: 0, qtdParcelasAtrasadas: 0 }
  );

  return {
    tipo: "parcelas-em-atraso",
    titulo,
    filtros: buildFiltrosLabel(filters),
    rows,
    totais,
  };
}

async function buildExtrato(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "extrato" }>> {
  if (!filters.acordoId) {
    throw new Error("Informe o ID do acordo para gerar o extrato.");
  }

  const a = await prisma.acordo.findUnique({
    where: { id: filters.acordoId },
    include: {
      orgao: { select: { sigla: true, nome: true } },
      lancamentos: {
        include: {
          competencia: { select: { mes: true, ordem: true } },
          exercicio: { select: { ano: true } },
        },
        orderBy: [{ exercicio: { ano: "asc" } }, { competencia: { ordem: "asc" } }],
      },
    },
  });
  if (!a) throw new Error("Acordo não encontrado.");

  const hoje = startOfDay(new Date());
  const cronograma: ExtratoData["cronograma"] = [];
  for (let n = 1; n <= a.numeroParcelas; n++) {
    const venc = nthInstallmentDate(a.primeiroVencimento, n, a.diaVencimento);
    let situacao: "PAGA" | "PENDENTE" | "ATRASADA";
    if (n <= a.parcelasPagas) situacao = "PAGA";
    else if (startOfDay(venc) < hoje) situacao = "ATRASADA";
    else situacao = "PENDENTE";
    cronograma.push({ n, vencimento: venc, valor: Number(a.valorParcela), situacao });
  }

  const cons = Number(a.valorConsolidado);
  const pag = Number(a.valorPago);

  const extrato: ExtratoData = {
    numero: a.numero,
    orgaoSigla: a.orgao.sigla,
    orgaoNome: a.orgao.nome,
    tipoDebito: a.tipoDebito,
    dataAcordo: a.dataAcordo,
    status: a.status,
    leiAutorizativa: a.leiAutorizativa,
    formaGarantia: a.formaGarantia,
    garantiaDetalhes: a.garantiaDetalhes,
    observacoes: a.observacoes,

    valorOriginal: Number(a.valorOriginal),
    atualizacaoMonetaria: Number(a.atualizacaoMonetaria),
    jurosAcordo: Number(a.jurosAcordo),
    multaAcordo: Number(a.multaAcordo),
    valorConsolidado: cons,
    valorPago: pag,
    saldo: cons - pag,
    percentualPago: cons > 0 ? (pag / cons) * 100 : 0,

    numeroParcelas: a.numeroParcelas,
    parcelasPagas: a.parcelasPagas,
    valorParcela: Number(a.valorParcela),
    diaVencimento: a.diaVencimento,
    primeiroVencimento: a.primeiroVencimento,

    lancamentos: a.lancamentos.map((l) => ({
      competencia: l.competencia.mes,
      ano: l.exercicio.ano,
      tipo: l.tipo,
      deficit: Number(l.deficit),
    })),

    cronograma,
  };

  return { tipo: "extrato", titulo, filtros: { Acordo: a.numero }, extrato };
}

async function buildDemonstrativoOrgao(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "demonstrativo-orgao" }>> {
  const acordos = await prisma.acordo.findMany({
    where: commonWhere(filters),
    include: { orgao: { select: { id: true, sigla: true, nome: true } } },
    orderBy: [{ orgao: { sigla: "asc" } }, { dataAcordo: "desc" }],
  });

  const grupos = new Map<number, DemonstrativoOrgaoGrupo>();

  for (const a of acordos) {
    const cons = Number(a.valorConsolidado);
    const pag = Number(a.valorPago);
    const saldo = cons - pag;
    const g = grupos.get(a.orgao.id) ?? {
      orgaoSigla: a.orgao.sigla,
      orgaoNome: a.orgao.nome,
      acordos: [],
      subtotais: { consolidado: 0, pago: 0, saldo: 0, qtdAcordos: 0 },
    };
    g.acordos.push({
      numero: a.numero,
      tipoDebito: a.tipoDebito,
      dataAcordo: a.dataAcordo,
      valorConsolidado: cons,
      valorPago: pag,
      saldo,
      status: a.status,
    });
    g.subtotais.consolidado += cons;
    g.subtotais.pago += pag;
    g.subtotais.saldo += saldo;
    g.subtotais.qtdAcordos += 1;
    grupos.set(a.orgao.id, g);
  }

  const arr = Array.from(grupos.values());
  const totaisGerais = arr.reduce(
    (acc, g) => ({
      consolidado: acc.consolidado + g.subtotais.consolidado,
      pago: acc.pago + g.subtotais.pago,
      saldo: acc.saldo + g.subtotais.saldo,
      qtdAcordos: acc.qtdAcordos + g.subtotais.qtdAcordos,
    }),
    { consolidado: 0, pago: 0, saldo: 0, qtdAcordos: 0 }
  );

  return {
    tipo: "demonstrativo-orgao",
    titulo,
    filtros: buildFiltrosLabel(filters),
    grupos: arr,
    totaisGerais,
  };
}

async function buildAnual(
  titulo: string,
  filters: AcordoReportFilters
): Promise<Extract<AcordoReportResult, { tipo: "anual" }>> {
  const ano = filters.ano ?? new Date().getFullYear();
  const inicio = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);

  const acordos = await prisma.acordo.findMany({
    where: {
      ...commonWhere({ ...filters, dataInicio: undefined, dataFim: undefined, ano: undefined }),
      dataAcordo: { gte: inicio, lt: fim },
    },
    include: { orgao: { select: { sigla: true } } },
    orderBy: [{ dataAcordo: "asc" }],
  });

  const rows: AnualRow[] = acordos.map((a) => {
    const cons = Number(a.valorConsolidado);
    const pag = Number(a.valorPago);
    return {
      numero: a.numero,
      orgaoSigla: a.orgao.sigla,
      tipoDebito: a.tipoDebito,
      dataAcordo: a.dataAcordo,
      valorConsolidado: cons,
      valorPago: pag,
      saldo: cons - pag,
      status: a.status,
    };
  });

  const totais = rows.reduce(
    (acc, r) => ({
      consolidado: acc.consolidado + r.valorConsolidado,
      pago: acc.pago + r.valorPago,
      saldo: acc.saldo + r.saldo,
      qtd: acc.qtd + 1,
    }),
    { consolidado: 0, pago: 0, saldo: 0, qtd: 0 }
  );

  return {
    tipo: "anual",
    titulo,
    filtros: { Ano: String(ano) },
    ano,
    rows,
    totais,
  };
}

function buildFiltrosLabel(filters: AcordoReportFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (filters.ano) out["Ano"] = String(filters.ano);
  if (filters.status) out["Status"] = filters.status;
  if (filters.tipoDebito) {
    out["Tipo de débito"] =
      filters.tipoDebito === "PATRONAL"
        ? "Patronal"
        : filters.tipoDebito === "SEGURADO"
        ? "Segurado"
        : "Ambos";
  }
  if (filters.dataInicio) out["De"] = filters.dataInicio.toLocaleDateString("pt-BR");
  if (filters.dataFim) out["Até"] = filters.dataFim.toLocaleDateString("pt-BR");
  return out;
}
