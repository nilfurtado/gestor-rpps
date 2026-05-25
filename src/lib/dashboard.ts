import { prisma } from "@/lib/db";

export const DEFAULT_ORGAO_COLOR = "#0F5132";

export interface DashboardKpis {
  totalArrecadado: number;
  totalEmAtraso: number;
  deficitAnual: number;
  inadimplenciaMedia: number;
  exercicioAno: number | null;
}

export interface DashboardData {
  kpis: DashboardKpis;
  arrecadacaoMensal: { mes: string; ordem: number; arrecadado: number; previsto: number }[];
  patronalVsSegurado: { mes: string; ordem: number; patronal: number; segurado: number }[];
  inadimplenciaPorOrgao: { sigla: string; cor: string; inadimplencia: number }[];
  deficitAcumulado: { mes: string; ordem: number; acumulado: number }[];
  topInadimplentes: {
    sigla: string;
    nome: string;
    cor: string;
    inadimplencia: number;
    deficit: number;
  }[];
  proximosVencimentos: {
    id: number;
    orgaoSigla: string;
    tipo: string;
    competencia: string;
    valor: number;
    vencimento: string;
  }[];
}

export async function getDashboardData(exercicioAno?: number): Promise<DashboardData> {
  const anoAtual = new Date().getFullYear();
  const exercicio = exercicioAno
    ? await prisma.exercicio.findUnique({ where: { ano: exercicioAno } })
    : await prisma.exercicio.findFirst({
        where: { ano: { lte: anoAtual } },
        orderBy: { ano: "desc" },
      });

  if (!exercicio) {
    return {
      kpis: {
        totalArrecadado: 0,
        totalEmAtraso: 0,
        deficitAnual: 0,
        inadimplenciaMedia: 0,
        exercicioAno: null,
      },
      arrecadacaoMensal: [],
      patronalVsSegurado: [],
      inadimplenciaPorOrgao: [],
      deficitAcumulado: [],
      topInadimplentes: [],
      proximosVencimentos: [],
    };
  }

  const lancamentos = await prisma.folhaPrevidenciaria.findMany({
    where: { exercicioId: exercicio.id },
    include: {
      orgao: { select: { sigla: true, nome: true, cor: true } },
      competencia: { select: { ordem: true, mes: true } },
    },
  });

  const totalArrecadado = lancamentos.reduce((acc, l) => acc + Number(l.valorRecolhido), 0);
  const totalEmAtraso = lancamentos
    .filter((l) => l.status === "PARCIAL" || l.status === "INADIMPLENTE")
    .reduce((acc, l) => acc + Number(l.deficit), 0);
  const deficitAnual = lancamentos.reduce((acc, l) => acc + Number(l.deficit), 0);

  const totalRecolher = lancamentos.reduce((acc, l) => acc + Number(l.valorRecolher), 0);
  const inadimplenciaMedia =
    totalRecolher > 0
      ? Number(((deficitAnual / totalRecolher) * 100).toFixed(2))
      : 0;

  // por competência
  const competencias = await prisma.competencia.findMany({ orderBy: { ordem: "asc" } });
  const arrecadacaoMensal = competencias.map((c) => {
    const ls = lancamentos.filter((l) => l.competencia.ordem === c.ordem);
    return {
      mes: c.mes,
      ordem: c.ordem,
      arrecadado: ls.reduce((s, l) => s + Number(l.valorRecolhido), 0),
      previsto: ls.reduce((s, l) => s + Number(l.valorRecolher), 0),
    };
  });

  const patronalVsSegurado = competencias.map((c) => {
    const ls = lancamentos.filter((l) => l.competencia.ordem === c.ordem);
    return {
      mes: c.mes,
      ordem: c.ordem,
      patronal: ls
        .filter((l) => l.tipo === "PATRONAL")
        .reduce((s, l) => s + Number(l.valorRecolhido), 0),
      segurado: ls
        .filter((l) => l.tipo === "SEGURADO")
        .reduce((s, l) => s + Number(l.valorRecolhido), 0),
    };
  });

  // déficit acumulado
  let acc = 0;
  const deficitAcumulado = competencias.map((c) => {
    const ls = lancamentos.filter((l) => l.competencia.ordem === c.ordem);
    acc += ls.reduce((s, l) => s + Number(l.deficit), 0);
    return { mes: c.mes, ordem: c.ordem, acumulado: acc };
  });

  // inadimplência por órgão
  const byOrgao = new Map<string, { rec: number; def: number; nome: string; cor: string }>();
  for (const l of lancamentos) {
    const k = l.orgao.sigla;
    const cur =
      byOrgao.get(k) ?? {
        rec: 0,
        def: 0,
        nome: l.orgao.nome,
        cor: l.orgao.cor ?? DEFAULT_ORGAO_COLOR,
      };
    cur.rec += Number(l.valorRecolher);
    cur.def += Number(l.deficit);
    byOrgao.set(k, cur);
  }
  const inadimplenciaPorOrgao = Array.from(byOrgao.entries())
    .map(([sigla, v]) => ({
      sigla,
      cor: v.cor,
      inadimplencia: v.rec > 0 ? Number(((v.def / v.rec) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.inadimplencia - a.inadimplencia);

  const topInadimplentes = Array.from(byOrgao.entries())
    .map(([sigla, v]) => ({
      sigla,
      nome: v.nome,
      cor: v.cor,
      inadimplencia: v.rec > 0 ? Number(((v.def / v.rec) * 100).toFixed(2)) : 0,
      deficit: v.def,
    }))
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 5);

  // próximos vencimentos (futuro com status não pago)
  const now = new Date();
  const proximosVencimentos = lancamentos
    .filter(
      (l) =>
        l.dataVencimento &&
        l.dataVencimento >= now &&
        (l.status === "INADIMPLENTE" || l.status === "PARCIAL")
    )
    .sort((a, b) => (a.dataVencimento!.getTime() - b.dataVencimento!.getTime()))
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      orgaoSigla: l.orgao.sigla,
      tipo: l.tipo === "PATRONAL" ? "Patronal" : "Segurado",
      competencia: l.competencia.mes,
      valor: Number(l.deficit),
      vencimento: l.dataVencimento!.toISOString(),
    }));

  return {
    kpis: {
      totalArrecadado,
      totalEmAtraso,
      deficitAnual,
      inadimplenciaMedia,
      exercicioAno: exercicio.ano,
    },
    arrecadacaoMensal,
    patronalVsSegurado,
    inadimplenciaPorOrgao,
    deficitAcumulado,
    topInadimplentes,
    proximosVencimentos,
  };
}
