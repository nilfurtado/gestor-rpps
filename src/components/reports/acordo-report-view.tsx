"use client";

import { useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import type { StatusAcordo, TipoDebitoAcordo } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AcordoStatusBadge } from "@/components/acordos/status-badge";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";
import type {
  AcordoRelatorioTipo,
  AcordoReportResult,
} from "@/lib/reports-acordos";

interface Props {
  tipo: AcordoRelatorioTipo;
  report: AcordoReportResult;
  query: string;
}

const TIPO_DEBITO_LABEL: Record<TipoDebitoAcordo, string> = {
  PATRONAL: "Patronal",
  SEGURADO: "Segurado",
  AMBOS: "Ambos",
};

export function AcordoReportView({ tipo, report, query }: Props) {
  const [busy, setBusy] = useState<"pdf" | null>(null);

  const recordCount = countRecords(report);

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const res = await fetch(
        `/api/relatorios/acordos/${tipo}/pdf?${query}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `acordo-${tipo}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF gerado com sucesso.");
    } catch (err) {
      toast.error("Erro ao gerar PDF.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(report.filtros).length === 0 ? (
              <Badge variant="outline">Sem filtros aplicados</Badge>
            ) : (
              Object.entries(report.filtros).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="rounded-md">
                  {k}: <span className="ml-1 font-normal">{v}</span>
                </Badge>
              ))
            )}
            <Badge variant="outline">{recordCount} registro(s)</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={recordCount === 0}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              size="sm"
              onClick={downloadPdf}
              disabled={busy !== null || recordCount === 0}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {recordCount === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Download}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros e tente novamente."
            className="border-0"
          />
        </Card>
      ) : (
        <Preview report={report} />
      )}
    </div>
  );
}

function Preview({ report }: { report: AcordoReportResult }) {
  switch (report.tipo) {
    case "geral":
      return <GeralPreview report={report} />;
    case "parcelas-pagas":
      return <ParcelasPagasPreview report={report} />;
    case "parcelas-em-atraso":
      return <ParcelasAtrasoPreview report={report} />;
    case "extrato":
      return <ExtratoPreview report={report} />;
    case "demonstrativo-orgao":
      return <DemonstrativoPreview report={report} />;
    case "anual":
      return <AnualPreview report={report} />;
  }
}

function countRecords(report: AcordoReportResult): number {
  switch (report.tipo) {
    case "geral":
    case "parcelas-pagas":
    case "parcelas-em-atraso":
    case "anual":
      return report.rows.length;
    case "extrato":
      return 1;
    case "demonstrativo-orgao":
      return report.grupos.reduce((s, g) => s + g.acordos.length, 0);
  }
}

function TotalsBar({
  items,
}: {
  items: { label: string; value: string; tone?: "danger" | "primary" }[];
}) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {it.label}
            </span>
            <span
              className={`tabular-nums font-semibold ${
                it.tone === "danger"
                  ? "text-destructive"
                  : it.tone === "primary"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {it.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Previews por tipo
// ───────────────────────────────────────────────────────────────

function GeralPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "geral" }>;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Órgão</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Consolidado</TableHead>
            <TableHead className="text-right">Pago</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead className="text-center">Parc.</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-semibold">{r.numero}</TableCell>
              <TableCell>
                <div className="font-semibold">{r.orgaoSigla}</div>
                <div className="text-xs text-muted-foreground">{r.orgaoNome}</div>
              </TableCell>
              <TableCell>{TIPO_DEBITO_LABEL[r.tipoDebito]}</TableCell>
              <TableCell className="tabular-nums">
                {formatDate(r.dataAcordo)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorConsolidado)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorPago)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.percentualPago.toFixed(0)}%
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {r.parcelasPagas}/{r.numeroParcelas}
              </TableCell>
              <TableCell>
                <AcordoStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TotalsBar
        items={[
          { label: "Acordos", value: String(report.totais.qtd) },
          { label: "Consolidado", value: formatBRL(report.totais.consolidado) },
          { label: "Pago", value: formatBRL(report.totais.pago) },
          {
            label: "Saldo a pagar",
            value: formatBRL(report.totais.saldo),
            tone: "danger",
          },
        ]}
      />
    </Card>
  );
}

function ParcelasPagasPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "parcelas-pagas" }>;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Órgão</TableHead>
            <TableHead className="text-center">Parc.</TableHead>
            <TableHead className="text-right">Valor parc.</TableHead>
            <TableHead className="text-right">Total pago</TableHead>
            <TableHead className="text-center">Última paga</TableHead>
            <TableHead className="text-right">%</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-semibold">{r.numero}</TableCell>
              <TableCell className="font-semibold">{r.orgaoSigla}</TableCell>
              <TableCell className="text-center tabular-nums">
                {r.parcelasPagas}/{r.numeroParcelas}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorParcela)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorPago)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {r.ultimaParcelaData ? formatDate(r.ultimaParcelaData) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.percentualConsolidado.toFixed(0)}%
              </TableCell>
              <TableCell>
                <AcordoStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TotalsBar
        items={[
          { label: "Acordos", value: String(report.totais.qtdAcordos) },
          {
            label: "Parcelas pagas",
            value: String(report.totais.qtdParcelas),
          },
          { label: "Total pago", value: formatBRL(report.totais.totalPago) },
        ]}
      />
    </Card>
  );
}

function ParcelasAtrasoPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "parcelas-em-atraso" }>;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Órgão</TableHead>
            <TableHead className="text-center">Esperadas</TableHead>
            <TableHead className="text-center">Pagas</TableHead>
            <TableHead className="text-center">Atrasadas</TableHead>
            <TableHead className="text-right">Valor parc.</TableHead>
            <TableHead className="text-right">Valor atrasado</TableHead>
            <TableHead className="text-center">Próx. venc.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-semibold">{r.numero}</TableCell>
              <TableCell className="font-semibold">{r.orgaoSigla}</TableCell>
              <TableCell className="text-center tabular-nums">
                {r.parcelasEsperadas}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {r.parcelasPagas}
              </TableCell>
              <TableCell className="text-center tabular-nums font-semibold text-destructive">
                {r.parcelasAtrasadas}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorParcela)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold text-destructive">
                {formatBRL(r.valorAtrasado)}
              </TableCell>
              <TableCell className="text-center tabular-nums">
                {r.proximoVencimento ? formatDate(r.proximoVencimento) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TotalsBar
        items={[
          {
            label: "Acordos em atraso",
            value: String(report.totais.qtdAcordosAtrasados),
          },
          {
            label: "Parcelas em atraso",
            value: String(report.totais.qtdParcelasAtrasadas),
          },
          {
            label: "Valor total em atraso",
            value: formatBRL(report.totais.totalAtrasado),
            tone: "danger",
          },
        ]}
      />
    </Card>
  );
}

function AnualPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "anual" }>;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Órgão</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Consolidado</TableHead>
            <TableHead className="text-right">Pago</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="font-semibold">{r.numero}</TableCell>
              <TableCell className="font-semibold">{r.orgaoSigla}</TableCell>
              <TableCell>{TIPO_DEBITO_LABEL[r.tipoDebito]}</TableCell>
              <TableCell className="tabular-nums">
                {formatDate(r.dataAcordo)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorConsolidado)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatBRL(r.valorPago)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-destructive">
                {formatBRL(r.saldo)}
              </TableCell>
              <TableCell>
                <AcordoStatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TotalsBar
        items={[
          {
            label: `Acordos em ${report.ano}`,
            value: String(report.totais.qtd),
          },
          { label: "Consolidado", value: formatBRL(report.totais.consolidado) },
          { label: "Pago", value: formatBRL(report.totais.pago) },
          {
            label: "Saldo",
            value: formatBRL(report.totais.saldo),
            tone: "danger",
          },
        ]}
      />
    </Card>
  );
}

function DemonstrativoPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "demonstrativo-orgao" }>;
}) {
  return (
    <div className="space-y-4">
      {report.grupos.map((g) => (
        <Card key={g.orgaoSigla} className="overflow-hidden">
          <CardContent className="flex items-center justify-between border-b border-border bg-primary/5 p-3">
            <div>
              <div className="text-sm font-semibold text-primary">
                {g.orgaoSigla} — {g.orgaoNome}
              </div>
              <div className="text-xs text-muted-foreground">
                {g.subtotais.qtdAcordos} acordo(s)
              </div>
            </div>
          </CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Consolidado</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {g.acordos.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{a.numero}</TableCell>
                  <TableCell>{TIPO_DEBITO_LABEL[a.tipoDebito]}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatDate(a.dataAcordo)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(a.valorConsolidado)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(a.valorPago)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">
                    {formatBRL(a.saldo)}
                  </TableCell>
                  <TableCell>
                    <AcordoStatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-border bg-amber-50/40 px-4 py-2 dark:bg-amber-950/20">
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="tabular-nums font-semibold">
                {formatBRL(g.subtotais.consolidado)}
              </span>
              <span className="tabular-nums font-semibold">
                {formatBRL(g.subtotais.pago)}
              </span>
              <span className="tabular-nums font-semibold text-destructive">
                {formatBRL(g.subtotais.saldo)}
              </span>
            </div>
          </div>
        </Card>
      ))}

      <Card>
        <TotalsBar
          items={[
            { label: "Órgãos", value: String(report.grupos.length) },
            {
              label: "Acordos",
              value: String(report.totaisGerais.qtdAcordos),
            },
            {
              label: "Consolidado",
              value: formatBRL(report.totaisGerais.consolidado),
            },
            {
              label: "Saldo total",
              value: formatBRL(report.totaisGerais.saldo),
              tone: "danger",
            },
          ]}
        />
      </Card>
    </div>
  );
}

function ExtratoPreview({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "extrato" }>;
}) {
  const e = report.extrato;
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5">
        {/* Identificação */}
        <Section title="Dados gerais">
          <KvGrid>
            <Kv label="Termo nº" value={e.numero} highlight />
            <Kv label="Data do acordo" value={formatDate(e.dataAcordo)} />
            <Kv label="Status">
              <AcordoStatusBadge status={e.status} />
            </Kv>
            <Kv label="Tipo de débito" value={TIPO_DEBITO_LABEL[e.tipoDebito]} />
            <Kv
              label="Órgão devedor"
              value={`${e.orgaoSigla} — ${e.orgaoNome}`}
              colSpan={2}
            />
            <Kv
              label="Lei autorizativa"
              value={e.leiAutorizativa ?? "—"}
              colSpan={2}
            />
          </KvGrid>
        </Section>

        {/* Composição financeira */}
        <Section title="Composição financeira">
          <KvGrid>
            <Kv label="Valor original" value={formatBRL(e.valorOriginal)} />
            <Kv label="Atualização" value={formatBRL(e.atualizacaoMonetaria)} />
            <Kv label="Juros" value={formatBRL(e.jurosAcordo)} />
            <Kv label="Multa" value={formatBRL(e.multaAcordo)} />
            <Kv
              label="Consolidado"
              value={formatBRL(e.valorConsolidado)}
              highlight
              valueClass="text-primary"
            />
            <Kv label="Pago" value={formatBRL(e.valorPago)} />
            <Kv
              label="Saldo"
              value={formatBRL(e.saldo)}
              valueClass="text-destructive"
            />
            <Kv label="% Pago" value={formatPercent(e.percentualPago)} />
          </KvGrid>
        </Section>

        {/* Parcelamento */}
        <Section title="Parcelamento">
          <KvGrid>
            <Kv
              label="Parcelas"
              value={`${e.parcelasPagas} / ${e.numeroParcelas}`}
            />
            <Kv
              label="Valor da parcela"
              value={formatBRL(e.valorParcela)}
            />
            <Kv label="Dia de vencimento" value={String(e.diaVencimento)} />
            <Kv
              label="1º vencimento"
              value={formatDate(e.primeiroVencimento)}
            />
          </KvGrid>
        </Section>

        {/* Lançamentos vinculados */}
        <Section title={`Lançamentos vinculados (${e.lancamentos.length})`}>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Déficit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {e.lancamentos.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.competencia}</TableCell>
                    <TableCell className="tabular-nums">{l.ano}</TableCell>
                    <TableCell>
                      {l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {formatBRL(l.deficit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>

        {/* Resumo do cronograma */}
        <Section
          title={`Cronograma de parcelas (${e.cronograma.length})`}
          hint="Detalhe completo (todas as parcelas) disponível no PDF."
        >
          <div className="grid grid-cols-3 gap-2 text-sm">
            <SummaryPill
              label="Pagas"
              value={String(
                e.cronograma.filter((p) => p.situacao === "PAGA").length
              )}
              tone="primary"
            />
            <SummaryPill
              label="Atrasadas"
              value={String(
                e.cronograma.filter((p) => p.situacao === "ATRASADA").length
              )}
              tone="danger"
            />
            <SummaryPill
              label="Pendentes"
              value={String(
                e.cronograma.filter((p) => p.situacao === "PENDENTE").length
              )}
            />
          </div>
        </Section>

        {e.observacoes ? (
          <Section title="Observações">
            <p className="text-sm leading-relaxed text-foreground">
              {e.observacoes}
            </p>
          </Section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        <div className="h-px flex-1 bg-border" />
      </div>
      {hint ? (
        <p className="mb-2 text-xs italic text-muted-foreground">{hint}</p>
      ) : null}
      {children}
    </div>
  );
}

function KvGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {children}
    </div>
  );
}

function Kv({
  label,
  value,
  children,
  highlight,
  colSpan,
  valueClass,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  highlight?: boolean;
  colSpan?: 2 | 3 | 4;
  valueClass?: string;
}) {
  const span =
    colSpan === 2
      ? "sm:col-span-2"
      : colSpan === 3
      ? "sm:col-span-3"
      : colSpan === 4
      ? "sm:col-span-4"
      : "";
  return (
    <div className={`flex flex-col gap-0.5 ${span}`}>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children ? (
        <span className="text-sm">{children}</span>
      ) : (
        <span
          className={`tabular-nums text-sm ${
            highlight ? "font-bold" : "font-medium"
          } ${valueClass ?? "text-foreground"}`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary" | "danger";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
      ? "text-destructive"
      : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-bold tabular-nums ${color}`}>
        {value}
      </div>
    </div>
  );
}
