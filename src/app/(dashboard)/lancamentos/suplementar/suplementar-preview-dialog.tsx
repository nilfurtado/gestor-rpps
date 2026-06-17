"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBRL, formatDate } from "@/lib/format";
import { MOTIVOS_SUPLEMENTO, type MotivosSuplemento } from "@/types/folha-suplementar";

interface SupplementarRow {
  id: number;
  folhaPrevidenciariaId: number;
  motivo: MotivosSuplemento;
  descricao?: string | null;
  folhaBase: number;
  status: string;
  observacoes?: string | null;
  createdAt: string;
}

interface Props {
  suplementar: SupplementarRow;
  onEdit: (suplementar: SupplementarRow) => void;
  onDelete: (id: number) => Promise<void>;
  deletingId: number | null;
}

export function SupplementarPreviewDialog({ suplementar, onEdit, onDelete, deletingId }: Props) {
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    if (!confirm("Excluir esta folha suplementar?")) return;
    await onDelete(suplementar.id);
    setOpen(false);
  }

  function handleEdit() {
    setOpen(false);
    onEdit(suplementar);
  }

  const statusLabels: Record<string, string> = {
    PAGO: "Pago",
    PARCIAL: "Parcial",
    INADIMPLENTE: "Inadimplente",
    PARCELADO: "Parcelado",
    SEM_MOVIMENTO: "Sem Movimento",
    RECOLHIMENTO_A_MAIOR: "Recolhimento a Maior",
    LANCADO: "Lançado",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Visualizar suplementar"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Folha Suplementar</DialogTitle>
          <DialogDescription>Detalhes do registro</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PreviewItem label="Motivo">
              <span className="font-semibold">{MOTIVOS_SUPLEMENTO[suplementar.motivo]}</span>
            </PreviewItem>

            <PreviewItem label="Valor (Folha Base)">
              <span className="font-semibold tabular-nums">{formatBRL(suplementar.folhaBase)}</span>
            </PreviewItem>

            <PreviewItem label="Status">
              <span className="font-semibold">{statusLabels[suplementar.status] ?? suplementar.status}</span>
            </PreviewItem>

            <PreviewItem label="Data de Criação">
              <span className="font-semibold">{formatDate(suplementar.createdAt)}</span>
            </PreviewItem>

            {suplementar.descricao ? (
              <PreviewItem label="Descrição">
                <span>{suplementar.descricao}</span>
              </PreviewItem>
            ) : null}

            {suplementar.observacoes ? (
              <PreviewItem label="Observações">
                <span>{suplementar.observacoes}</span>
              </PreviewItem>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deletingId === suplementar.id}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
