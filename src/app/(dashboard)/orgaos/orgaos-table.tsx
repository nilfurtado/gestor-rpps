"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { OrgaoDialog } from "./orgao-dialog";

export interface OrgaoRow {
  id: number;
  sigla: string;
  nome: string;
  cor: string | null;
  status: "ATIVO" | "INATIVO";
  lancamentosCount: number;
}

const DEFAULT_COR = "#0F5132";

export function OrgaosTable({ orgaos }: { orgaos: OrgaoRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleStatus(o: OrgaoRow) {
    setBusyId(o.id);
    try {
      const next = o.status === "ATIVO" ? "INATIVO" : "ATIVO";
      const res = await fetch(`/api/orgaos/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao atualizar");
      }
      toast.success(`Órgão ${o.sigla} ${next === "ATIVO" ? "ativado" : "inativado"}.`);
      router.refresh();
    } catch (err) {
      toast.error("Não foi possível alterar o status.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(o: OrgaoRow) {
    if (!confirm(`Excluir o órgão ${o.sigla}? Esta ação não pode ser desfeita.`)) return;
    setBusyId(o.id);
    try {
      const res = await fetch(`/api/orgaos/${o.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha ao excluir");
      }
      toast.success(`Órgão ${o.sigla} excluído.`);
      router.refresh();
    } catch (err) {
      toast.error("Exclusão bloqueada.", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  if (orgaos.length === 0) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={Building2}
          title="Nenhum órgão cadastrado"
          description="Clique em 'Novo órgão' para iniciar o cadastro dos entes municipais."
          className="border-0"
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sigla</TableHead>
            <TableHead>Denominação</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="text-center">Lançamentos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgaos.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-semibold text-foreground">{o.sigla}</TableCell>
              <TableCell className="text-foreground">{o.nome}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-5 w-5 shrink-0 rounded border border-border shadow-sm"
                    style={{ backgroundColor: o.cor ?? DEFAULT_COR }}
                    aria-hidden
                  />
                  <code className="font-mono text-xs text-muted-foreground">
                    {o.cor ?? DEFAULT_COR}
                  </code>
                </div>
              </TableCell>
              <TableCell className="text-center tabular-nums">{o.lancamentosCount}</TableCell>
              <TableCell>
                {o.status === "ATIVO" ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <OrgaoDialog
                    orgao={o}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleStatus(o)}
                    disabled={busyId === o.id}
                    aria-label={o.status === "ATIVO" ? "Inativar" : "Ativar"}
                  >
                    {o.status === "ATIVO" ? (
                      <PowerOff className="h-4 w-4" />
                    ) : (
                      <Power className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(o)}
                    disabled={busyId === o.id || o.lancamentosCount > 0}
                    aria-label="Excluir"
                    title={
                      o.lancamentosCount > 0
                        ? "Não é possível excluir: há lançamentos vinculados"
                        : "Excluir"
                    }
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
  );
}
