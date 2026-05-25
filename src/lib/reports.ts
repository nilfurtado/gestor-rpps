import type { LancamentoStatus, TipoContribuicao } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RelatorioTipo =
  | "mensal"
  | "anual"
  | "orgao"
  | "patronal"
  | "segurado"
  | "inadimplencia";

export interface ReportFilters {
  exercicioId?: number;
  competenciaId?: number;
  orgaoId?: number;
  tipo?: TipoContribuicao;
  status?: LancamentoStatus;
}

export interface ReportRow {
  orgaoSigla: string;
  orgaoNome: string;
  tipo: TipoContribuicao;
  competencia: string;
  competenciaOrdem: number;
  ano: number;
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  deficit: number;
  inadimplencia: number;
  status: LancamentoStatus;
}

export interface ReportResult {
  titulo: string;
  subtitulo: string;
  filtros: Record<string, string>;
  rows: ReportRow[];
  totais: {
    valorRecolher: number;
    valorRecolhido: number;
    deficit: number;
    inadimplenciaMedia: number;
  };
}

export const RELATORIO_TITULOS: Record<RelatorioTipo, string> = {
  mensal: "Relatório Mensal",
  anual: "Relatório Anual",
  orgao: "Relatório por Órgão",
  patronal: "Relatório Patronal",
  segurado: "Relatório Segurado",
  inadimplencia: "Relatório de Inadimplência / RPPS",
};

function applyDefaultsByTipo(tipo: RelatorioTipo, filters: ReportFilters): ReportFilters {
  switch (tipo) {
    case "patronal":
      return { ...filters, tipo: "PATRONAL" };
    case "segurado":
      return { ...filters, tipo: "SEGURADO" };
    case "inadimplencia":
      return { ...filters, status: filters.status ?? "INADIMPLENTE" };
    default:
      return filters;
  }
}

export async function buildReport(
  tipo: RelatorioTipo,
  rawFilters: ReportFilters
): Promise<ReportResult> {
  const filters = applyDefaultsByTipo(tipo, rawFilters);

  const lancamentos = await prisma.folhaPrevidenciaria.findMany({
    where: {
      ...(filters.exercicioId ? { exercicioId: filters.exercicioId } : {}),
      ...(filters.competenciaId ? { competenciaId: filters.competenciaId } : {}),
      ...(filters.orgaoId ? { orgaoId: filters.orgaoId } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
    include: {
      orgao: { select: { sigla: true, nome: true } },
      exercicio: { select: { ano: true } },
      competencia: { select: { ordem: true, mes: true } },
    },
    orderBy: [
      { exercicio: { ano: "desc" } },
      { orgao: { sigla: "asc" } },
      { competencia: { ordem: "asc" } },
    ],
  });

  const rows: ReportRow[] = lancamentos.map((l) => ({
    orgaoSigla: l.orgao.sigla,
    orgaoNome: l.orgao.nome,
    tipo: l.tipo,
    competencia: l.competencia.mes,
    competenciaOrdem: l.competencia.ordem,
    ano: l.exercicio.ano,
    aliquota: Number(l.aliquota),
    valorRecolher: Number(l.valorRecolher),
    valorRecolhido: Number(l.valorRecolhido),
    deficit: Number(l.deficit),
    inadimplencia: Number(l.inadimplencia),
    status: l.status,
  }));

  const totRec = rows.reduce((s, r) => s + r.valorRecolher, 0);
  const totRecdo = rows.reduce((s, r) => s + r.valorRecolhido, 0);
  const totDef = rows.reduce((s, r) => s + r.deficit, 0);
  const totais = {
    valorRecolher: totRec,
    valorRecolhido: totRecdo,
    deficit: totDef,
    inadimplenciaMedia: totRec > 0 ? Number(((totDef / totRec) * 100).toFixed(2)) : 0,
  };

  const filtrosLabel: Record<string, string> = {};
  if (filters.exercicioId) {
    const ex = await prisma.exercicio.findUnique({ where: { id: filters.exercicioId } });
    if (ex) filtrosLabel["Exercício"] = String(ex.ano);
  }
  if (filters.competenciaId) {
    const c = await prisma.competencia.findUnique({ where: { id: filters.competenciaId } });
    if (c) filtrosLabel["Competência"] = c.mes;
  }
  if (filters.orgaoId) {
    const o = await prisma.orgao.findUnique({ where: { id: filters.orgaoId } });
    if (o) filtrosLabel["Órgão"] = `${o.sigla} — ${o.nome}`;
  }
  if (filters.tipo) {
    filtrosLabel["Tipo"] = filters.tipo === "PATRONAL" ? "Patronal" : "Segurado";
  }
  if (filters.status) {
    filtrosLabel["Status"] = filters.status;
  }

  return {
    titulo: RELATORIO_TITULOS[tipo],
    subtitulo: "Divisão de Arrecadação · Santana Previdência",
    filtros: filtrosLabel,
    rows,
    totais,
  };
}
