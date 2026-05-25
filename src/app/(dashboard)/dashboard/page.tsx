import {
  AlertOctagon,
  AlertTriangle,
  CalendarClock,
  PiggyBank,
  Percent,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getDashboardData } from "@/lib/dashboard";
import { ensureExercicioAtual } from "@/lib/exercicios";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ArrecadacaoMensalChart,
  PatronalSeguradoChart,
  InadimplenciaOrgaoChart,
  DeficitAcumuladoChart,
} from "@/components/dashboard/charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";

export const metadata = { title: "Dashboard — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await ensureExercicioAtual();
  const d = await getDashboardData();

  return (
    <>
      <PageHeader
        title="Dashboard gerencial"
        description={
          d.kpis.exercicioAno
            ? `Indicadores consolidados do exercício ${d.kpis.exercicioAno}.`
            : "Nenhum exercício cadastrado."
        }
      />

      <section
        aria-label="Indicadores principais"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Total Arrecadado"
          value={formatBRL(d.kpis.totalArrecadado)}
          icon={PiggyBank}
          tone="success"
        />
        <KpiCard
          label="Total em Atraso"
          value={formatBRL(d.kpis.totalEmAtraso)}
          icon={AlertTriangle}
          tone="warning"
        />
        <KpiCard
          label="Déficit Anual"
          value={formatBRL(d.kpis.deficitAnual)}
          icon={TrendingDown}
          tone="danger"
        />
        <KpiCard
          label="% Médio Inadimplência"
          value={formatPercent(d.kpis.inadimplenciaMedia)}
          icon={Percent}
          tone={
            d.kpis.inadimplenciaMedia >= 30
              ? "danger"
              : d.kpis.inadimplenciaMedia >= 10
              ? "warning"
              : "success"
          }
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Arrecadação mensal</CardTitle>
            <CardDescription>Previsto vs. arrecadado por competência</CardDescription>
          </CardHeader>
          <CardContent>
            {d.arrecadacaoMensal.some((m) => m.previsto > 0 || m.arrecadado > 0) ? (
              <ArrecadacaoMensalChart data={d.arrecadacaoMensal} />
            ) : (
              <EmptyState icon={TrendingUp} title="Sem dados no exercício" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patronal vs. Segurado</CardTitle>
            <CardDescription>Distribuição da arrecadação por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            {d.patronalVsSegurado.some((m) => m.patronal > 0 || m.segurado > 0) ? (
              <PatronalSeguradoChart data={d.patronalVsSegurado} />
            ) : (
              <EmptyState icon={TrendingUp} title="Sem dados no exercício" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inadimplência por órgão</CardTitle>
            <CardDescription>Percentual relativo ao previsto</CardDescription>
          </CardHeader>
          <CardContent>
            {d.inadimplenciaPorOrgao.length > 0 ? (
              <InadimplenciaOrgaoChart data={d.inadimplenciaPorOrgao} />
            ) : (
              <EmptyState icon={AlertOctagon} title="Sem dados de inadimplência" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Déficit acumulado no exercício</CardTitle>
            <CardDescription>Saldo de inadimplência ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            {d.deficitAcumulado.some((m) => m.acumulado > 0) ? (
              <DeficitAcumuladoChart data={d.deficitAcumulado} />
            ) : (
              <EmptyState icon={TrendingDown} title="Sem déficit registrado" />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 órgãos por déficit</CardTitle>
            <CardDescription>Maior valor em atraso no exercício</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {d.topInadimplentes.length === 0 ? (
              <EmptyState icon={AlertOctagon} title="Nenhum órgão com déficit" className="rounded-none border-0" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Órgão</TableHead>
                    <TableHead className="text-right">Déficit</TableHead>
                    <TableHead className="text-right">Inadimpl.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.topInadimplentes.map((o) => (
                    <TableRow key={o.sigla}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-sm border border-border shadow-sm"
                            style={{ backgroundColor: o.cor }}
                            aria-hidden
                          />
                          <div>
                            <div className="font-semibold">{o.sigla}</div>
                            <div className="text-xs text-muted-foreground">{o.nome}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {formatBRL(o.deficit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(o.inadimplencia)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
            <CardDescription>Lançamentos com débito e data de vencimento futura</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {d.proximosVencimentos.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nenhum vencimento próximo"
                description="Adicione data de vencimento aos lançamentos para acompanhar prazos."
                className="rounded-none border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Órgão</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.proximosVencimentos.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="font-semibold">{v.orgaoSigla}</div>
                        <div className="text-xs text-muted-foreground">{v.tipo}</div>
                      </TableCell>
                      <TableCell>{v.competencia}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(v.vencimento)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(v.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
