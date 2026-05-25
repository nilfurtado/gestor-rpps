import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ReportFilters, type FilterDefs } from "@/components/reports/report-filters";
import { ReportView } from "@/components/reports/report-view";
import { buildReport, RELATORIO_TITULOS, type RelatorioTipo } from "@/lib/reports";

export const dynamic = "force-dynamic";

const VALID_TIPOS: RelatorioTipo[] = [
  "mensal",
  "anual",
  "orgao",
  "patronal",
  "segurado",
  "inadimplencia",
];

const DEFS: Record<RelatorioTipo, FilterDefs> = {
  mensal: { showExercicio: true, showCompetencia: true, showOrgao: true },
  anual: { showExercicio: true, showTipo: true },
  orgao: { showOrgao: true, showExercicio: true },
  patronal: { showExercicio: true, showOrgao: true },
  segurado: { showExercicio: true, showOrgao: true },
  inadimplencia: { showExercicio: true, showStatus: true },
};

const DESCRIPTIONS: Record<RelatorioTipo, string> = {
  mensal: "Arrecadação consolidada por competência.",
  anual: "Consolidado do exercício por tipo de contribuição.",
  orgao: "Desempenho individual do ente municipal.",
  patronal: "Contribuições patronais por período.",
  segurado: "Contribuições dos servidores por período.",
  inadimplencia: "Ranking e consolidado de inadimplência RPPS.",
};

interface PageProps {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tipo } = await params;
  if (!VALID_TIPOS.includes(tipo as RelatorioTipo)) return { title: "Relatório — Santana Previdência" };
  return { title: `${RELATORIO_TITULOS[tipo as RelatorioTipo]} — Santana Previdência` };
}

export default async function RelatorioPage({ params, searchParams }: PageProps) {
  const { tipo } = await params;
  const sp = await searchParams;

  if (!VALID_TIPOS.includes(tipo as RelatorioTipo)) notFound();
  const t = tipo as RelatorioTipo;

  const [orgaos, exercicios, competencias] = await Promise.all([
    prisma.orgao.findMany({ orderBy: { sigla: "asc" }, select: { id: true, sigla: true, nome: true } }),
    prisma.exercicio.findMany({ orderBy: { ano: "desc" }, select: { id: true, ano: true } }),
    prisma.competencia.findMany({ orderBy: { ordem: "asc" }, select: { id: true, ordem: true, mes: true } }),
  ]);

  const filters = {
    exercicioId: sp.exercicioId ? Number(sp.exercicioId) : undefined,
    competenciaId: sp.competenciaId ? Number(sp.competenciaId) : undefined,
    orgaoId: sp.orgaoId ? Number(sp.orgaoId) : undefined,
    tipo: (sp.tipo as "PATRONAL" | "SEGURADO" | undefined) || undefined,
    status: (sp.status as "PAGO" | "PARCIAL" | "INADIMPLENTE" | "PARCELADO" | undefined) || undefined,
  };

  const report = await buildReport(t, filters);

  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => !!v) as [string, string][]
  ).toString();

  return (
    <>
      <PageHeader
        title={RELATORIO_TITULOS[t]}
        description={DESCRIPTIONS[t]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/relatorios">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <ReportFilters
          defs={DEFS[t]}
          orgaos={orgaos}
          exercicios={exercicios}
          competencias={competencias}
        />
        <ReportView tipo={t} report={report} query={query} />
      </div>
    </>
  );
}
