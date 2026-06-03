"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput, currencyToNumber, formatCurrency } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/lancamentos/status-badge";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { formatBRL, formatPercent } from "@/lib/format";

export interface LancamentoInitial {
  id: number;
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  quantidadeServidores: number | null;
  folhaBase: number | null;
  multas: number | null;
  juros: number | null;
  parcelado: boolean;
  dataVencimento: string | null;
  observacoes: string | null;
}

export interface LancamentoKey {
  id: number;
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
}

interface Props {
  orgaos: { id: number; sigla: string; nome: string }[];
  exercicios: { id: number; ano: number }[];
  competencias: { id: number; ordem: number; mes: string }[];
  initial?: LancamentoInitial;
  existingKeys?: LancamentoKey[];
}

export function LancamentoForm({
  orgaos,
  exercicios,
  competencias,
  initial,
  existingKeys = [],
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(initial);

  const [orgaoId, setOrgaoId] = useState<string>(initial ? String(initial.orgaoId) : "");
  const [tipo, setTipo] = useState<"PATRONAL" | "SEGURADO">(initial?.tipo ?? "PATRONAL");
  const [exercicioId, setExercicioId] = useState<string>(
    initial ? String(initial.exercicioId) : exercicios[0] ? String(exercicios[0].id) : ""
  );
  const [competenciaId, setCompetenciaId] = useState<string>(
    initial ? String(initial.competenciaId) : ""
  );
  const [aliquota, setAliquota] = useState<string>(initial ? String(initial.aliquota) : "");
  const [valorRecolher, setValorRecolher] = useState<string>(
    initial ? String(initial.valorRecolher) : ""
  );
  const [valorRecolhido, setValorRecolhido] = useState<string>(
    initial ? String(initial.valorRecolhido) : ""
  );
  const [quantidadeServidores, setQuantidadeServidores] = useState<string>(
    initial?.quantidadeServidores != null ? String(initial.quantidadeServidores) : ""
  );
  const [folhaBase, setFolhaBase] = useState<string>(
    initial?.folhaBase != null ? String(initial.folhaBase) : ""
  );
  const [multas, setMultas] = useState<string>(
    initial?.multas != null ? String(initial.multas) : ""
  );
  const [juros, setJuros] = useState<string>(
    initial?.juros != null ? String(initial.juros) : ""
  );
  const [parcelado, setParcelado] = useState(initial?.parcelado ?? false);
  const [dataVencimento, setDataVencimento] = useState<string>(
    initial?.dataVencimento
      ? initial.dataVencimento.slice(0, 10)
      : new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState<string>(initial?.observacoes ?? "");

  // Cálculo automático de Valor a Recolher = Folha Base × Alíquota ÷ 100
  const valorRecolherCalculado = useMemo(() => {
    const folha = currencyToNumber(folhaBase);
    const aliq = Number(aliquota) || 0;

    // Se ambos estão preenchidos, calcula
    if (folha > 0 && aliq > 0) {
      return Number(((folha * aliq) / 100).toFixed(2));
    }

    // Senão, retorna 0
    return 0;
  }, [folhaBase, aliquota]);

  const preview = useMemo(() => {
    return calcularLancamento({
      valorRecolher: valorRecolherCalculado,
      valorRecolhido: currencyToNumber(valorRecolhido),
      multas: currencyToNumber(multas),
      juros: currencyToNumber(juros),
      parcelado,
    });
  }, [valorRecolherCalculado, valorRecolhido, multas, juros, parcelado]);

  const duplicateConflict = useMemo(() => {
    if (isEdit) return null;
    if (!orgaoId || !exercicioId || !competenciaId) return null;
    const oId = Number(orgaoId);
    const eId = Number(exercicioId);
    const cId = Number(competenciaId);
    const match = existingKeys.find(
      (k) =>
        k.orgaoId === oId &&
        k.tipo === tipo &&
        k.exercicioId === eId &&
        k.competenciaId === cId
    );
    return match ?? null;
  }, [isEdit, orgaoId, tipo, exercicioId, competenciaId, existingKeys]);

  const conflictLabel = useMemo(() => {
    if (!duplicateConflict) return null;
    const org = orgaos.find((o) => o.id === duplicateConflict.orgaoId);
    const exe = exercicios.find((e) => e.id === duplicateConflict.exercicioId);
    const cmp = competencias.find((c) => c.id === duplicateConflict.competenciaId);
    return `${org?.sigla ?? "?"} · ${cmp?.mes ?? "?"} · ${exe?.ano ?? "?"} · ${duplicateConflict.tipo === "PATRONAL" ? "Patronal" : "Segurado"}`;
  }, [duplicateConflict, orgaos, exercicios, competencias]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgaoId || !exercicioId || !competenciaId) {
      toast.error("Preencha órgão, exercício e competência.");
      return;
    }
    if (duplicateConflict) {
      toast.error("Já existe um lançamento com essa combinação.", {
        description: "Edite o lançamento existente em vez de criar um novo.",
      });
      return;
    }
    start(async () => {
      try {
        const payload = {
          orgaoId: Number(orgaoId),
          tipo,
          exercicioId: Number(exercicioId),
          competenciaId: Number(competenciaId),
          aliquota: Number(aliquota || 0),
          valorRecolher: currencyToNumber(valorRecolher),
          valorRecolhido: currencyToNumber(valorRecolhido),
          quantidadeServidores: quantidadeServidores ? Number(quantidadeServidores) : null,
          folhaBase: folhaBase ? currencyToNumber(folhaBase) : null,
          multas: multas ? currencyToNumber(multas) : null,
          juros: juros ? currencyToNumber(juros) : null,
          parcelado,
          dataVencimento: dataVencimento || null,
          observacoes: observacoes || null,
        };
        const url = isEdit ? `/api/lancamentos/${initial!.id}` : "/api/lancamentos";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Falha ao salvar");
        }
        toast.success(isEdit ? "Lançamento atualizado." : "Lançamento registrado.");
        router.push("/lancamentos");
        router.refresh();
      } catch (err) {
        toast.error("Erro ao salvar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── IDENTIFICAÇÃO ─────────────────────────────────────────── */}
      <section aria-labelledby="sec-ident">
        <SectionTitle id="sec-ident">Identificação</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Ente municipal *">
            <Select value={orgaoId} onValueChange={setOrgaoId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {orgaos.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo *">
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as "PATRONAL" | "SEGURADO")}
              disabled={isEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PATRONAL">Patronal</SelectItem>
                <SelectItem value="SEGURADO">Segurado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Exercício *">
            <Select value={exercicioId} onValueChange={setExercicioId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {exercicios.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Competência *">
            <Select value={competenciaId} onValueChange={setCompetenciaId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {competencias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {isEdit ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Para mudar órgão, tipo, exercício ou competência, exclua este lançamento e crie um novo
            — esses campos compõem a identidade única do registro.
          </p>
        ) : null}
        {duplicateConflict ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">
                Já existe um lançamento com essa combinação.
              </p>
              <p className="text-destructive/90">
                {conflictLabel}. Edite o registro existente em vez de criar um novo.
              </p>
              <a
                href={`/lancamentos/${duplicateConflict.id}/editar`}
                className="inline-block font-semibold underline-offset-2 hover:underline"
              >
                Abrir lançamento existente →
              </a>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── VALORES ───────────────────────────────────────────────── */}
      <section aria-labelledby="sec-val">
        <SectionTitle id="sec-val">Valores</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Folha base (R$) *">
            <CurrencyInput
              value={folhaBase}
              onChange={(e) => setFolhaBase(e.target.value)}
              className="h-9 tabular-nums"
              required
            />
          </Field>
          <Field label="Alíquota (%) *">
            <Input
              type="number" step="0.01" min="0" max="100" required
              value={aliquota}
              onChange={(e) => setAliquota(e.target.value)}
              placeholder="14"
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Recolhido (R$) *">
            <CurrencyInput
              value={valorRecolhido}
              onChange={(e) => setValorRecolhido(e.target.value)}
              className="h-9 tabular-nums"
              required
            />
          </Field>
          <Field label="Data do repasse">
            <Input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="h-9"
            />
          </Field>
          <Field label="Qtd. servidores">
            <Input
              type="number" min="0"
              value={quantidadeServidores}
              onChange={(e) => setQuantidadeServidores(e.target.value)}
              placeholder="450"
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Multas (R$)">
            <CurrencyInput
              value={multas}
              onChange={(e) => setMultas(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Juros (R$)">
            <CurrencyInput
              value={juros}
              onChange={(e) => setJuros(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
        </div>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={parcelado}
            onChange={(e) => setParcelado(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span>Débito parcelado / negociado com o RPPS</span>
        </label>
      </section>

      {/* ── PREVIEW DE LANÇAMENTOS ─────────────────────── */}
      <section aria-labelledby="sec-prev">
        <SectionTitle id="sec-prev">Preview</SectionTitle>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-2">
          {/* Ente */}
          <CalcPill label="Ente" tone="default">
            <span className="text-xs sm:text-sm">{orgaos.find((o) => o.id === Number(orgaoId))?.sigla ?? "-"}</span>
          </CalcPill>

          {/* Competência */}
          <CalcPill label="Competência" tone="default">
            <span className="text-xs sm:text-sm">{competencias.find((c) => c.id === Number(competenciaId))?.mes ?? "-"}</span>
          </CalcPill>

          {/* A Recolher */}
          <CalcPill label="A Recolher" tone="default">
            <span className="text-xs sm:text-sm">{formatBRL(valorRecolherCalculado)}</span>
          </CalcPill>

          {/* Recolhido */}
          <CalcPill label="Recolhido" tone={currencyToNumber(valorRecolhido) > 0 ? "success" : "default"}>
            <span className="text-xs sm:text-sm">{formatBRL(currencyToNumber(valorRecolhido))}</span>
          </CalcPill>

          {/* Déficit */}
          <CalcPill label="Déficit" tone={preview.deficit > 0 ? "danger" : "default"}>
            <span className="text-xs sm:text-sm">{formatBRL(preview.deficit)}</span>
          </CalcPill>

          {/* Inadimplência */}
          <CalcPill label="Inadimplência" tone={preview.inadimplencia > 0 ? "danger" : "default"}>
            <span className="text-xs sm:text-sm">{formatPercent(preview.inadimplencia)}</span>
          </CalcPill>

          {/* Status */}
          <CalcPill label="Status" tone="default">
            <StatusBadge status={preview.status} />
          </CalcPill>
        </div>
      </section>

      {/* ── FOOTER STICKY ─────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-2 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
          className="h-9"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending || Boolean(duplicateConflict)}
          className="h-9"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Salvar alterações" : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
    >
      {children}
    </h2>
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

function CalcPill({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "default" | "danger" | "success" | "warning";
  children: React.ReactNode;
}) {
  const toneClasses = {
    default: "text-foreground",
    danger: "text-destructive",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="flex-shrink-0 rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {label}
      </div>
      <div className={`mt-0.5 truncate text-xs sm:text-sm font-semibold tabular-nums ${toneClasses[tone]}`}>
        {children}
      </div>
    </div>
  );
}
