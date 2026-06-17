"use client";

import { useState, useTransition } from "react";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOTIVOS_SUPLEMENTO, type MotivosSuplemento } from "@/types/folha-suplementar";

interface FolhaOption {
  id: number;
  label: string;
}

interface SupplementarInitial {
  id: number;
  folhaPrevidenciariaId: number;
  motivo: MotivosSuplemento;
  descricao?: string | null;
  folhaBase: number;
  observacoes?: string | null;
}

interface Props {
  folhas: FolhaOption[];
  initial?: SupplementarInitial;
  defaultFolhaId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplementarForm({ folhas, initial, defaultFolhaId, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initial);
  const [pending, start] = useTransition();

  const [folhaId, setFolhaId] = useState<string>(
    initial
      ? String(initial.folhaPrevidenciariaId)
      : defaultFolhaId
        ? String(defaultFolhaId)
        : folhas[0]
          ? String(folhas[0].id)
          : ""
  );
  const [motivo, setMotivo] = useState<MotivosSuplemento>(initial?.motivo ?? "OUTRO");
  const [descricao, setDescricao] = useState<string>(initial?.descricao ?? "");
  const [folhaBase, setFolhaBase] = useState<string>(
    initial?.folhaBase != null ? String(initial.folhaBase) : ""
  );
  const [observacoes, setObservacoes] = useState<string>(initial?.observacoes ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!folhaId) {
      toast.error("Selecione a folha previdenciária.");
      return;
    }

    const folhaBaseNum = Number(folhaBase);
    if (!folhaBase || isNaN(folhaBaseNum) || folhaBaseNum <= 0) {
      toast.error("Informe um valor de folha base maior que zero.");
      return;
    }

    start(async () => {
      try {
        const payload = {
          folhaPrevidenciariaId: Number(folhaId),
          motivo,
          descricao: descricao || undefined,
          folhaBase: folhaBaseNum,
          observacoes: observacoes || undefined,
        };

        const url = isEdit
          ? `/api/admin/folha-suplementar/${initial!.id}`
          : "/api/admin/folha-suplementar";
        const method = isEdit ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Falha ao salvar");
        }

        toast.success(isEdit ? "Suplementar atualizada." : "Suplementar registrada.");
        onSuccess();
      } catch (err) {
        toast.error("Erro ao salvar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Folha Previdenciária *">
          <Select value={folhaId} onValueChange={setFolhaId} disabled={isEdit || pending}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {folhas.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Motivo *">
          <Select
            value={motivo}
            onValueChange={(v) => setMotivo(v as MotivosSuplemento)}
            disabled={pending}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MOTIVOS_SUPLEMENTO) as MotivosSuplemento[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {MOTIVOS_SUPLEMENTO[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Valor da Folha Base (R$) *">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={folhaBase}
            onChange={(e) => setFolhaBase(e.target.value)}
            placeholder="0,00"
            className="h-9 tabular-nums"
            disabled={pending}
          />
        </Field>

        <Field label="Descrição">
          <Input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição opcional"
            className="h-9"
            disabled={pending}
          />
        </Field>
      </div>

      <Field label="Observações">
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações adicionais..."
          rows={3}
          disabled={pending}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
          className="h-9"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} className="h-9">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Salvar alterações" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
