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
  const [vinculo, setVinculo] = useState(ALL); // ALL | "COM" | "SEM"
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
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
            label="Vínculo com acordo"
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
                <TableHead>Órgão</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Exercício</TableHead>
                <TableHead className="text-right">A recolher</TableHead>
                <TableHead className="text-right">Recolhido</TableHead>
                <TableHead className="text-right">Déficit</TableHead>
                <TableHead className="text-right">Inadimpl.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acordo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{l.orgao.sigla}</div>
                    <div className="text-xs text-muted-foreground">{l.orgao.nome}</div>
                  </TableCell>
                  <TableCell>{l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}</TableCell>
                  <TableCell>{l.competencia.mes}</TableCell>
                  <TableCell className="tabular-nums">{l.exercicio.ano}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(l.valorRecolher)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(l.valorRecolhido)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        l.deficit > 0 ? "font-medium text-destructive" : "text-muted-foreground"
                      }
                    >
                      {formatBRL(l.deficit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(l.inadimplencia)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell>
                    {l.acordo ? (
                      <Link
                        href={`/acordos/${l.acordo.id}/editar`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        title="Abrir acordo vinculado"
                      >
                        {l.acordo.numero}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        aria-label="Editar lançamento"
                      >
                        <Link href={`/lancamentos/${l.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(l.id)}
                        disabled={busyId === l.id}
                        aria-label="Excluir lançamento"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
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
