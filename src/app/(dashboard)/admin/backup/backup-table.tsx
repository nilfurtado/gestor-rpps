"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Backup } from "@/types/backup";
import { useState } from "react";
import { toast } from "sonner";

interface BackupTableProps {
  backups: Backup[];
  onRefresh: () => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BackupTable({
  backups,
  onRefresh,
  onRestore,
  onDelete,
}: BackupTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    if (
      !confirm(
        "Tem certeza? Esta ação vai sobrescrever o banco de dados atual."
      )
    ) {
      return;
    }

    setLoading(id);
    try {
      await onRestore(id);
      toast.success("Backup restaurado com sucesso");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao restaurar backup");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este backup?")) {
      return;
    }

    setLoading(id);
    try {
      await onDelete(id);
      toast.success("Backup deletado");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao deletar backup");
    } finally {
      setLoading(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Arquivo</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum backup encontrado
              </TableCell>
            </TableRow>
          ) : (
            backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>
                  {backup.status === "healthy" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {backup.filename}
                </TableCell>
                <TableCell>{formatBytes(backup.size)}</TableCell>
                <TableCell>
                  {format(backup.createdAt, "dd MMM yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                      onClick={() => handleRestore(backup.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                      onClick={() => handleDelete(backup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
