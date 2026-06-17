"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BackupTable } from "./backup-table";
import { LogsViewer } from "./logs-viewer";
import { SuggestionsCard } from "./suggestions-card";
import { BackupDescriptionDialog } from "./backup-description-dialog";
import { Plus, RotateCw } from "lucide-react";
import type { Backup } from "@/types/backup";
import { analyzeSystemState, generateAutoDescription } from "@/lib/system-analysis-service";

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [stats, setStats] = useState({ total: 0, errors: 0, warnings: 0, info: 0 });
  const [suggestedDescription, setSuggestedDescription] = useState("");

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      toast.error("Erro ao carregar backups");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/backup/logs");
      const data = await res.json();
      setStats(data.stats || { total: 0, errors: 0, warnings: 0, info: 0 });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const state = await analyzeSystemState();
      const suggested = generateAutoDescription(state);
      setSuggestedDescription(suggested);
      setShowDescriptionDialog(true);
    } catch (error) {
      console.error("Erro ao analisar sistema:", error);
      setShowDescriptionDialog(true); // Abrir modal mesmo com erro
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmBackup = async (description: string) => {
    setCreating(true);
    setShowDescriptionDialog(false);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (res.ok) {
        toast.success("Backup criado com sucesso!");
        await fetchBackups();
      } else {
        toast.error("Erro ao criar backup");
      }
    } catch (error) {
      toast.error("Erro ao criar backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/backup/${id}/restore`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao restaurar");
      toast.success("Backup restaurado com sucesso!");
      await fetchBackups();
    } catch (error) {
      toast.error("Erro ao restaurar backup");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/backup/${id}/delete`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      toast.success("Backup deletado com sucesso!");
      await fetchBackups();
    } catch (error) {
      toast.error("Erro ao deletar backup");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup & Logs</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie backups do banco de dados e visualize logs do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Backups</div>
          <div className="text-2xl font-bold">{backups.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Erros</div>
          <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Avisos</div>
          <div className="text-2xl font-bold text-yellow-500">
            {stats.warnings}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Logs</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
      </div>

      {/* Sugestões */}
      <SuggestionsCard
        backupCount={backups.length}
        logErrors={stats.errors}
        logWarnings={stats.warnings}
      />

      {/* Backups Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Backups</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBackups()}
              disabled={loading}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleCreateBackup}
              disabled={creating}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Backup
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando backups...
          </div>
        ) : (
          <BackupTable
            backups={backups}
            onRefresh={fetchBackups}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Logs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Logs do Sistema</h2>
        <LogsViewer />
      </div>

      <BackupDescriptionDialog
        isOpen={showDescriptionDialog}
        onConfirm={handleConfirmBackup}
        onCancel={() => setShowDescriptionDialog(false)}
        suggestedDescription={suggestedDescription}
      />
    </div>
  );
}
