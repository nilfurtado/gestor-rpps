"use client";

import { useState } from "react";
import { TipoFolha } from "@prisma/client";
import { toast } from "sonner";
import { Trash2, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTipoFolhaColor } from "@/lib/tipo-folha-colors";
import { EmptyState } from "@/components/empty-state";

interface TipoFolhaComCount extends TipoFolha {
  lancamentosCount: number;
}

interface FolhasTableProps {
  dados: TipoFolhaComCount[];
  onTiposAtualizados: (tipos: TipoFolhaComCount[]) => void;
  allTipos: TipoFolhaComCount[];
  onEditar: (tipo: TipoFolha) => void;
}

export function FolhasTable({ dados, onTiposAtualizados, allTipos, onEditar }: FolhasTableProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoFolhaComCount | null>(null);

  const handleDesativar = async (id: number, ativo: boolean) => {
    if (ativo && !confirm("Desativar este tipo de folha?")) return;
    if (!ativo && !confirm("Reativar este tipo de folha?")) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/tipos-folha/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");

      const atualizado = await res.json();
      const novostipos = allTipos.map((t) => (t.id === id ? atualizado : t));
      onTiposAtualizados(novostipos);

      toast.success(!ativo ? "Tipo reativado!" : "Tipo desativado!");
    } catch {
      toast.error("Erro ao atualizar tipo");
    } finally {
      setLoading(null);
    }
  };

  const handleDeletar = async (id: number, customizado: boolean) => {
    if (!customizado) {
      toast.error("Não é possível deletar tipos built-in");
      return;
    }

    if (!confirm("Deletar este tipo permanentemente?")) return;

    setLoading(id);
    try {
      const res = await fetch(`/api/tipos-folha/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar");

      const novosTipos = allTipos.filter((t) => t.id !== id);
      onTiposAtualizados(novosTipos);

      toast.success("Tipo deletado com sucesso!");
    } catch {
      toast.error("Erro ao deletar tipo");
    } finally {
      setLoading(null);
    }
  };

  if (dados.length === 0) {
    return <EmptyState icon={Edit2} title="Nenhum tipo encontrado" description="Tente ajustar os filtros" />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Ordem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Descrição</TableHead>
            <TableHead className="w-20 text-center">Tipo</TableHead>
            <TableHead className="hidden sm:table-cell w-24 text-center">Origem</TableHead>
            <TableHead className="w-16 text-center">Status</TableHead>
            <TableHead className="hidden lg:table-cell text-right">Uso</TableHead>
            <TableHead className="w-20 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((tipo) => {
            const cor = getTipoFolhaColor(tipo.nome);
            return (
              <TableRow key={tipo.id}>
                <TableCell className="font-mono text-sm">{tipo.ordem}</TableCell>
                <TableCell>
                  <div className={`font-semibold ${cor.text}`}>{tipo.nome}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {tipo.descricao || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {tipo.obrigatorio ? "Obrigatória" : "Opcional"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  <Badge variant={tipo.customizado ? "default" : "secondary"} className="text-xs">
                    {tipo.customizado ? "🟢 Custom" : "🔵 Built-in"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={tipo.ativo ? "default" : "destructive"} className="text-xs">
                    {tipo.ativo ? "✅ Ativa" : "❌ Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right text-sm text-muted-foreground">
                  {tipo.lancamentosCount} lançamentos
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEditar(tipo)}
                      disabled={loading === tipo.id}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDesativar(tipo.id, tipo.ativo)}
                      disabled={loading === tipo.id}
                      title={tipo.ativo ? "Desativar" : "Reativar"}
                    >
                      {tipo.ativo ? "✓" : "⊘"}
                    </Button>
                    {tipo.customizado && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeletar(tipo.id, tipo.customizado)}
                        disabled={loading === tipo.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
