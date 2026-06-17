"use client";

import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/lancamentos/status-badge";
import { formatBRL, formatPercent } from "@/lib/format";
import { calcularLancamento } from "@/lib/calc/lancamento";

interface LancamentoPreviewProps {
  lancamento: {
    id: number;
    orgao: { sigla: string; nome: string; cor?: string | null };
    competencia: { mes: string };
    exercicio: { ano: number };
    tipo: string;
    valorRecolher: number;
    valorRecolhido: number;
    multas?: number;
    juros?: number;
    status: string;
    parcelado: boolean;
  };
}

export function LancamentoPreviewDialog({ lancamento: l }: LancamentoPreviewProps) {
  const [open, setOpen] = useState(false);

  const preview = useMemo(() => {
    return calcularLancamento({
      valorRecolher: l.valorRecolher,
      valorRecolhido: l.valorRecolhido,
      multas: l.multas ?? 0,
      juros: l.juros ?? 0,
      parcelado: l.parcelado,
    });
  }, [l]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Visualizar lançamento"
          title="Visualizar indicadores"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Preview de Lançamento</DialogTitle>
          <DialogDescription>Resumo dos dados do lançamento</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 -mt-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: l.orgao.cor || "#0F5132" }}
          />
          <span className="font-semibold text-sm">{l.orgao.sigla}</span>
          <span className="text-xs text-muted-foreground">({l.orgao.nome})</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm">{l.competencia.mes}/{l.exercicio.ano}</span>
        </div>

        {/* ── PREVIEW ─────────────────────────────────── */}
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Ente */}
            <PreviewItem label="Ente">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: l.orgao.cor || "#0F5132" }}
                />
                <div className="flex-1">
                  <div className="font-semibold">{l.orgao.sigla}</div>
                  <div className="text-xs text-muted-foreground">{l.orgao.nome}</div>
                </div>
              </div>
            </PreviewItem>

            {/* Competência */}
            <PreviewItem label="Competência">
              <div className="font-semibold">
                {l.competencia.mes}/{l.exercicio.ano}
              </div>
            </PreviewItem>

            {/* A Recolher */}
            <PreviewItem label="A Recolher">
              <div className="font-semibold tabular-nums">{formatBRL(l.valorRecolher)}</div>
            </PreviewItem>

            {/* Recolhido */}
            <PreviewItem label="Recolhido">
              <div
                className={`font-semibold tabular-nums ${
                  l.valorRecolhido > 0 ? "text-success" : ""
                }`}
              >
                {formatBRL(l.valorRecolhido)}
              </div>
            </PreviewItem>

            {/* Déficit */}
            <PreviewItem label="Déficit">
              <div
                className={`font-semibold tabular-nums ${
                  preview.deficit > 0 ? "text-destructive" : ""
                }`}
              >
                {formatBRL(preview.deficit)}
              </div>
            </PreviewItem>

            {/* Inadimplência */}
            <PreviewItem label="Inadimplência">
              <div
                className={`font-semibold tabular-nums ${
                  preview.inadimplencia > 0 ? "text-destructive" : ""
                }`}
              >
                {formatPercent(preview.inadimplencia)}
              </div>
            </PreviewItem>

            {/* Status */}
            <PreviewItem label="Status">
              <StatusBadge status={l.status as any} />
            </PreviewItem>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div>{children}</div>
    </div>
  );
}
