"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import type { RelatorioTipo } from "@/lib/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/lancamentos/status-badge";
import { formatBRL, formatPercent } from "@/lib/format";
import type { ReportResult } from "@/lib/reports";

interface Props {
  tipo: RelatorioTipo;
  report: ReportResult;
  query: string;
}

export function ReportView({ tipo, report, query }: Props) {
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);

  async function download(format: "pdf" | "xlsx") {
    setBusy(format);
    try {
      const res = await fetch(`/api/relatorios/${tipo}/${format}?${query}`);
      if (!res.ok) throw new Error("Falha ao gerar arquivo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tipo}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} gerado com sucesso.`);
    } catch (err) {
      toast.error("Erro ao exportar.", {
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
            <Badge variant="outline">{report.rows.length} registro(s)</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              disabled={report.rows.length === 0}
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => download("xlsx")}
              disabled={busy !== null || report.rows.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
            <Button
              size="sm"
              onClick={() => download("pdf")}
              disabled={busy !== null || report.rows.length === 0}
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {report.rows.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Download}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros e tente novamente."
            className="border-0"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Órgão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Alíq.</TableHead>
                <TableHead className="text-right">A recolher</TableHead>
                <TableHead className="text-right">Recolhido</TableHead>
                <TableHead className="text-right">Déficit</TableHead>
                <TableHead className="text-right">Inadimpl.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-semibold">{r.orgaoSigla}</div>
                    <div className="text-xs text-muted-foreground">{r.orgaoNome}</div>
                  </TableCell>
                  <TableCell>{r.tipo === "PATRONAL" ? "Patronal" : "Segurado"}</TableCell>
                  <TableCell>
                    {r.competencia}/{r.ano}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(r.aliquota)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(r.valorRecolher)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(r.valorRecolhido)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">
                    {formatBRL(r.deficit)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(r.inadimplencia)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Total label="Total a recolher" value={formatBRL(report.totais.valorRecolher)} />
              <Total label="Total recolhido" value={formatBRL(report.totais.valorRecolhido)} />
              <Total
                label="Total déficit"
                value={formatBRL(report.totais.deficit)}
                tone="danger"
              />
              <Total
                label="Inadimplência média"
                value={formatPercent(report.totais.inadimplenciaMedia)}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Total({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums font-semibold ${
          tone === "danger" ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
