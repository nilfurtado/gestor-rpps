"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, FileStack } from "lucide-react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
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
import { formatBRL, formatDate } from "@/lib/format";
import { MOTIVOS_SUPLEMENTO, type MotivosSuplemento } from "@/types/folha-suplementar";
import { SupplementarPreviewDialog } from "./suplementar-preview-dialog";

export interface SupplementarRow {
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
  suplementares: SupplementarRow[];
  onEdit: (suplementar: SupplementarRow) => void;
  onRefresh: () => void;
}

const ALL = "__all__";

const STATUS_LABELS: Record<string, string> = {
  PAGO: "Pago",
  PARCIAL: "Parcial",
  INADIMPLENTE: "Inadimplente",
  PARCELADO: "Parcelado",
  SEM_MOVIMENTO: "Sem Movimento",
  RECOLHIMENTO_A_MAIOR: "Recolhimento a Maior",
  LANCADO: "Lançado",
};

export function SupplementarTable({ suplementares, onEdit, onRefresh }: Props) {
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [motivoFilter, setMotivoFilter] = useState(ALL);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return suplementares.filter((s) => {
      if (statusFilter !== ALL && s.status !== statusFilter) return false;
      if (motivoFilter !== ALL && s.motivo !== motivoFilter) return false;
      return true;
    });
  }, [suplementares, statusFilter, motivoFilter]);

  async function onDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/folha-suplementar/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao excluir");
      }
      toast.success("Suplementar excluída.");
      onRefresh();
    } catch (err) {
      toast.error("Não foi possível excluir.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useMemo<ColumnDef<SupplementarRow>[]>(
    () => [
      {
        accessorKey: "motivo",
        header: "Motivo",
        cell: ({ row }) => (
          <span className="font-medium text-sm">
            {MOTIVOS_SUPLEMENTO[row.original.motivo]}
          </span>
        ),
      },
      {
        accessorKey: "descricao",
        header: "Descrição",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.descricao ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "folhaBase",
        header: () => <span className="text-right block">Valor</span>,
        cell: ({ row }) => (
          <span className="text-right block tabular-nums font-semibold">
            {formatBRL(row.original.folhaBase)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="text-sm">
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="text-right block">Ações</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <SupplementarPreviewDialog
              suplementar={row.original}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingId={deletingId}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(row.original)}
              aria-label="Editar suplementar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (confirm("Excluir esta folha suplementar?")) onDelete(row.original.id);
              }}
              disabled={deletingId === row.original.id}
              aria-label="Excluir suplementar"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, deletingId]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: ALL, label: "Todos" },
              { value: "LANCADO", label: "Lançado" },
              { value: "PAGO", label: "Pago" },
              { value: "PARCIAL", label: "Parcial" },
              { value: "INADIMPLENTE", label: "Inadimplente" },
              { value: "SEM_MOVIMENTO", label: "Sem Movimento" },
            ]}
          />
          <FilterSelect
            label="Motivo"
            value={motivoFilter}
            onChange={setMotivoFilter}
            options={[
              { value: ALL, label: "Todos" },
              ...Object.entries(MOTIVOS_SUPLEMENTO).map(([k, v]) => ({ value: k, label: v })),
            ]}
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={FileStack}
            title="Nenhuma suplementar encontrada"
            description="Ajuste os filtros ou cadastre uma nova folha suplementar."
            className="border-0"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className="h-10 px-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
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
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
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
