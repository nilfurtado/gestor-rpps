"use client";

import { useState } from "react";
import { TipoFolha } from "@prisma/client";
import { Edit2 } from "lucide-react";
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
                  <button
                    onClick={() => onEditar(tipo)}
                    className={`font-semibold cursor-pointer hover:opacity-80 transition ${cor.text}`}
                    title="Clique para editar"
                  >
                    {tipo.nome}
                  </button>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  <button
                    onClick={() => onEditar(tipo)}
                    className="cursor-pointer hover:opacity-80 transition"
                    title="Clique para editar"
                  >
                    {tipo.descricao || "-"}
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {tipo.obrigatorio ? "Obrigatória" : "Opcional"}
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
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEditar(tipo)}
                    disabled={loading === tipo.id}
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
