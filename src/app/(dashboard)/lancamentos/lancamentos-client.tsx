"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { LancamentoStatus, TipoContribuicao } from "@prisma/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/lancamentos/status-badge";
import { formatBRL, formatPercent } from "@/lib/format";

interface LancamentoRow {
  id: number;
  orgao: { id: number; sigla: string; nome: string };
  tipo: TipoContribuicao;
  exercicio: { id: number; ano: number; status: string };
  competencia: { id: number; ordem: number; mes: string };
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  deficit: number;
  inadimplencia: number;
  status: LancamentoStatus;
  parcelado: boolean;
  dataVencimento: string | null;
  acordo: { id: number; numero: string } | null;
}

interface Props {
  lancamentos: LancamentoRow[];
  orgaos: { id: number; sigla: string; nome: string }[];
  exercicios: { id: number; ano: number; status: string }[];
  competencias: { id: number; ordem: number; mes: string }[];
}

const ALL = "__all__";

export function LancamentosClient({ lancamentos, orgaos, exercicios, competencias }: Props) {
  const router = useRouter();
  const [orgaoId, setOrgaoId] = useState(ALL);
  const [exercicioId, setExercicioId] = useState(ALL);
  const [competenciaId, setCompetenciaId] = useState(ALL);
  const [tipo, setTipo] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [vinculo, setVinculo] = useState(ALL);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return lancamentos.filter((l) => {
      if (orgaoId !== ALL && l.orgao.id !== Number(orgaoId)) return false;
      if (exercicioId !== ALL && l.exercicio.id !== Number(exercicioId)) return false;
      if (competenciaId !== ALL && l.competencia.id !== Number(competenciaId)) return false;
      if (tipo !== ALL && l.tipo !== tipo) return false;
      if (status !== ALL && l.status !== status) return false;
      if (vinculo === "COM" && !l.acordo) return false;
      if (vinculo === "SEM" && l.acordo) return false;
      return true;
    });
  }, [lancamentos, orgaoId, exercicioId, competenciaId, tipo, status, vinculo]);

  async function onDelete(id: number) {
    if (!confirm("Excluir este lançamento?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao excluir");
      }
      toast.success("Lançamento excluído.");
      router.refresh();
    } catch (err) {
      toast.error("Não foi possível excluir.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <FilterSelect
            label="Exercício"
            value={exercicioId}
            onChange={setExercicioId}
            options={[
              { value: ALL, label: "Todos" },
              ...exercicios.map((e) => ({ value: String(e.id), label: String(e.ano) })),
            ]}
          />
          <FilterSelect
            label="Órgão"
            value={orgaoId}
            onChange={setOrgaoId}
            options={[
              { value: ALL, label: "Todos" },
              ...orgaos.map((o) => ({ value: String(o.id), label: o.sigla })),
            ]}
          />
          <FilterSelect
            label="Tipo"
            value={tipo}
            onChange={setTipo}
            options={[
              { value: ALL, label: "Todos" },
              { value: "PATRONAL", label: "Patronal" },
              { value: "SEGURADO", label: "Segurado" },
            ]}
          />
          <FilterSelect
            label="Competência"
            value={competenciaId}
            onChange={setCompetenciaId}
            options={[
              { value: ALL, label: "Todas" },
              ...competencias.map((c) => ({ value: String(c.id), label: c.mes })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: ALL, label: "Todos" },
              { value: "PAGO", label: "Pago" },
              { value: "PARCIAL", label: "Parcial" },
              { value: "INADIMPLENTE", label: "Inadimplente" },
              { value: "PARCELADO", label: "Parcelado" },
            ]}
          />
          <FilterSelect
            label="Acordo"
            value={vinculo}
            onChange={setVinculo}
            options={[
              { value: ALL, label: "Todos" },
              { value: "COM", label: "Com acordo" },
              { value: "SEM", label: "Sem acordo" },
            ]}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Receipt}
            title="Nenhum lançamento encontrado"
            description="Ajuste os filtros ou cadastre um novo lançamento."
            className="border-0"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-10 px-3">Órgão</TableHead>
                <TableHead className="h-10 px-3">Período</TableHead>
                <TableHead className="h-10 px-3 text-right">A recolher</TableHead>
                <TableHead className="hidden h-10 px-3 text-right md:table-cell">
                  Recolhido
                </TableHead>
                <TableHead className="h-10 px-3 text-right">Déficit</TableHead>
                <TableHead className="h-10 px-3">Status</TableHead>
                <TableHead className="h-10 px-3 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="px-3 py-2.5">
                    <div className="font-semibold leading-tight text-foreground">
                      {l.orgao.sigla}
                    </div>
                    <div className="text-[11px] leading-tight text-muted-foreground">
                      {l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <div className="leading-tight">{l.competencia.mes}</div>
                    <div className="text-[11px] leading-tight tabular-nums text-muted-foreground">
                      {l.exercicio.ano}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right tabular-nums">
                    {formatBRL(l.valorRecolher)}
                  </TableCell>
                  <TableCell className="hidden px-3 py-2.5 text-right tabular-nums md:table-cell">
                    {formatBRL(l.valorRecolhido)}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right tabular-nums">
                    <div
                      className={
                        l.deficit > 0
                          ? "font-medium leading-tight text-destructive"
                          : "leading-tight text-muted-foreground"
                      }
                    >
                      {formatBRL(l.deficit)}
                    </div>
                    <div className="text-[11px] leading-tight tabular-nums text-muted-foreground">
                      {formatPercent(l.inadimplencia)}
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <StatusBadge status={l.status} />
                    {l.acordo ? (
                      <Link
                        href={`/acordos/${l.acordo.id}/editar`}
                        className="mt-0.5 block text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
                        title="Abrir acordo vinculado"
                      >
                        {l.acordo.numero}
                      </Link>
                    ) : null}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8"
                        aria-label="Editar lançamento"
                      >
                        <Link href={`/lancamentos/${l.id}/editar`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(l.id)}
                        disabled={busyId === l.id}
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
