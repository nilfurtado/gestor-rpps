"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { StatusAcordo, TipoDebitoAcordo } from "@prisma/client";
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
import { AcordoStatusBadge } from "@/components/acordos/status-badge";
import { formatBRL, formatDate } from "@/lib/format";

interface AcordoRow {
  id: number;
  numero: string;
  orgao: { id: number; sigla: string; nome: string };
  tipoDebito: TipoDebitoAcordo;
  dataAcordo: string;
  valorConsolidado: number;
  valorPago: number;
  numeroParcelas: number;
  parcelasPagas: number;
  status: StatusAcordo;
  lancamentoCount: number;
}

interface Props {
  acordos: AcordoRow[];
  orgaos: { id: number; sigla: string; nome: string }[];
}

const ALL = "__all__";

export function AcordosClient({ acordos, orgaos }: Props) {
  const router = useRouter();
  const [orgaoId, setOrgaoId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [tipoDebito, setTipoDebito] = useState(ALL);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return acordos.filter((a) => {
      if (orgaoId !== ALL && a.orgao.id !== Number(orgaoId)) return false;
      if (status !== ALL && a.status !== status) return false;
      if (tipoDebito !== ALL && a.tipoDebito !== tipoDebito) return false;
      return true;
    });
  }, [acordos, orgaoId, status, tipoDebito]);

  async function onDelete(id: number) {
    if (
      !confirm(
        "Excluir este acordo? Os lançamentos vinculados voltarão ao status anterior (Pago/Parcial/Inadimplente)."
      )
    )
      return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/acordos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao excluir");
      }
      toast.success("Acordo excluído.");
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            label="Tipo de débito"
            value={tipoDebito}
            onChange={setTipoDebito}
            options={[
              { value: ALL, label: "Todos" },
              { value: "PATRONAL", label: "Patronal" },
              { value: "SEGURADO", label: "Segurado" },
              { value: "AMBOS", label: "Ambos" },
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: ALL, label: "Todos" },
              { value: "VIGENTE", label: "Vigente" },
              { value: "QUITADO", label: "Quitado" },
              { value: "RESCINDIDO", label: "Rescindido" },
              { value: "SUSPENSO", label: "Suspenso" },
            ]}
          />
        </div>
      </Card>

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
              <TableHead className="text-right">Parcelas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => {
              const pct =
                a.valorConsolidado > 0
                  ? Math.round((a.valorPago / a.valorConsolidado) * 100)
                  : 0;
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-semibold">{a.numero}</TableCell>
                  <TableCell>
                    <div className="font-semibold text-foreground">{a.orgao.sigla}</div>
                    <div className="text-xs text-muted-foreground">{a.orgao.nome}</div>
                  </TableCell>
                  <TableCell>
                    {a.tipoDebito === "PATRONAL"
                      ? "Patronal"
                      : a.tipoDebito === "SEGURADO"
                      ? "Segurado"
                      : "Ambos"}
                  </TableCell>
                  <TableCell className="tabular-nums">{formatDate(a.dataAcordo)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(a.valorConsolidado)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <div>{formatBRL(a.valorPago)}</div>
                    <div className="text-xs text-muted-foreground">{pct}%</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.parcelasPagas} / {a.numeroParcelas}
                  </TableCell>
                  <TableCell>
                    <AcordoStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label="Editar acordo">
                        <Link href={`/acordos/${a.id}/editar`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(a.id)}
                        disabled={busyId === a.id}
                        aria-label="Excluir acordo"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
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
