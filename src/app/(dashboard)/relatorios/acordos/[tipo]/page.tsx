import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { StatusAcordo, TipoDebitoAcordo } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import {
  AcordoReportFilters,
  type AcordoFilterDefs,
} from "@/components/reports/acordo-report-filters";
import { AcordoReportView } from "@/components/reports/acordo-report-view";
import {
  ACORDO_RELATORIO_TITULOS,
  buildAcordoReport,
  type AcordoRelatorioTipo,
  type AcordoReportFilters as AcordoFilterValues,
} from "@/lib/reports-acordos";

export const dynamic = "force-dynamic";

const VALID: AcordoRelatorioTipo[] = [
  "geral",
  "parcelas-pagas",
  "parcelas-em-atraso",
  "extrato",
  "demonstrativo-orgao",
  "anual",
];

const DEFS: Record<AcordoRelatorioTipo, AcordoFilterDefs> = {
  geral: {
    showOrgao: true,
    showCompetencia: true,
    showStatus: true,
    showTipoDebito: true,
    showPeriodo: true,
  },
  "parcelas-pagas": {
    showOrgao: true,
    showTipoDebito: true,
    showStatus: true,
  },
  "parcelas-em-atraso": {
    showOrgao: true,
    showTipoDebito: true,
    showCompetencia: true,
  },
  extrato: {
    showAcordo: true,
    requiredAcordo: true,
  },
  "demonstrativo-orgao": {
    showOrgao: true,
    showStatus: true,
    showTipoDebito: true,
  },
  anual: {
    showAno: true,
    requiredAno: true,
    showOrgao: true,
    showTipoDebito: true,
  },
};

const DESCRIPTIONS: Record<AcordoRelatorioTipo, string> = {
  geral: "Lista completa de acordos com totais consolidado e pago.",
  "parcelas-pagas": "Acordos com parcelas quitadas e valor total pago.",
  "parcelas-em-atraso":
    "Acordos vigentes com parcelas vencidas até a data atual.",
  extrato:
    "Detalhe de um acordo: composição, lançamentos vinculados e cronograma.",
  "demonstrativo-orgao": "Acordos agrupados por órgão devedor com subtotais.",
  anual: "Acordos firmados em um exercício específico.",
};

interface PageProps {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tipo } = await params;
  if (!VALID.includes(tipo as AcordoRelatorioTipo))
    return { title: "Relatório de Acordos — Santana Previdência" };
  return {
    title: `${ACORDO_RELATORIO_TITULOS[tipo as AcordoRelatorioTipo]} — Santana Previdência`,
  };
}

export default async function RelatorioAcordoPage({
  params,
  searchParams,
}: PageProps) {
  const { tipo } = await params;
  const sp = await searchParams;

  if (!VALID.includes(tipo as AcordoRelatorioTipo)) notFound();
  const t = tipo as AcordoRelatorioTipo;

  const [orgaos, competencias, anosRaw, acordosRaw] = await Promise.all([
    prisma.orgao.findMany({
      orderBy: { sigla: "asc" },
      select: { id: true, sigla: true, nome: true },
    }),
    prisma.competencia.findMany({
      orderBy: { ordem: "asc" },
      select: { id: true, ordem: true, mes: true },
    }),
    prisma.acordo.findMany({
      select: { dataAcordo: true },
      orderBy: { dataAcordo: "desc" },
    }),
    prisma.acordo.findMany({
      select: { id: true, numero: true, orgao: { select: { sigla: true } } },
      orderBy: [{ dataAcordo: "desc" }, { id: "desc" }],
    }),
  ]);

  const anos = Array.from(
    new Set(anosRaw.map((a) => a.dataAcordo.getFullYear()))
  ).sort((a, b) => b - a);

  const acordosOptions = acordosRaw.map((a) => ({
    id: a.id,
    label: `${a.numero} — ${a.orgao.sigla}`,
  }));

  // Verifica se filtros obrigatórios foram informados
  const def = DEFS[t];
  const missingRequired =
    (def.requiredAcordo && !sp.acordoId) ||
    (def.requiredAno && !sp.ano);

  const filters: AcordoFilterValues = {
    acordoId: sp.acordoId ? Number(sp.acordoId) : undefined,
    orgaoId: sp.orgaoId ? Number(sp.orgaoId) : undefined,
    competenciaId: sp.competenciaId ? Number(sp.competenciaId) : undefined,
    ano: sp.ano ? Number(sp.ano) : undefined,
    status: (sp.status as StatusAcordo | undefined) || undefined,
    tipoDebito: (sp.tipoDebito as TipoDebitoAcordo | undefined) || undefined,
    dataInicio: sp.dataInicio ? new Date(sp.dataInicio) : undefined,
    dataFim: sp.dataFim ? new Date(sp.dataFim) : undefined,
  };

  let report;
  if (!missingRequired) {
    try {
      report = await buildAcordoReport(t, filters);
    } catch {
      report = null;
    }
  }

  const query = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => !!v) as [string, string][]
  ).toString();

  return (
    <>
      <PageHeader
        title={ACORDO_RELATORIO_TITULOS[t]}
        description={DESCRIPTIONS[t]}
        actions={
          <Button variant="outline" asChild>
            <Link href="/relatorios/acordos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        <AcordoReportFilters
          defs={DEFS[t]}
          orgaos={orgaos}
          competencias={competencias}
          anos={anos}
          acordos={acordosOptions}
        />

        {missingRequired ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {def.requiredAcordo
                ? "Selecione o acordo para gerar o extrato."
                : "Selecione o ano para gerar o relatório anual."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use os filtros acima e clique em <strong>Aplicar filtros</strong>.
            </p>
          </div>
        ) : report ? (
          <AcordoReportView tipo={t} report={report} query={query} />
        ) : (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-center">
            <p className="text-sm font-medium text-destructive">
              Não foi possível carregar o relatório com os filtros informados.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
