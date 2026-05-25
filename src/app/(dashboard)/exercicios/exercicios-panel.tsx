"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Lock,
  LockOpen,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ExercicioRow {
  id: number;
  ano: number;
  status: "ABERTO" | "ENCERRADO";
  lancamentosCount: number;
}

interface Props {
  exercicios: ExercicioRow[];
}

export function ExerciciosPanel({ exercicios: inicial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [ano, setAno] = useState("");
  const [status, setStatus] = useState<"ABERTO" | "ENCERRADO">("ABERTO");
  const [busyId, setBusyId] = useState<number | null>(null);

  function abrirModal() {
    setAno(String(new Date().getFullYear()));
    setStatus("ABERTO");
    setModalOpen(true);
  }

  async function salvar() {
    const anoNum = Number(ano);
    if (!ano || isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
      toast.error("Informe um ano válido entre 2000 e 2100.");
      return;
    }
    start(async () => {
      const res = await fetch("/api/exercicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano: anoNum, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao cadastrar exercício.");
        return;
      }
      toast.success(`Exercício ${anoNum} cadastrado com sucesso.`);
      setModalOpen(false);
      router.refresh();
    });
  }

  async function alternarStatus(e: ExercicioRow) {
    const novoStatus = e.status === "ABERTO" ? "ENCERRADO" : "ABERTO";
    const acao = novoStatus === "ENCERRADO" ? "encerrar" : "reabrir";
    if (!confirm(`Deseja ${acao} o exercício ${e.ano}?`)) return;

    setBusyId(e.id);
    try {
      const res = await fetch(`/api/exercicios/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao alterar status.");
        return;
      }
      toast.success(
        novoStatus === "ENCERRADO"
          ? `Exercício ${e.ano} encerrado.`
          : `Exercício ${e.ano} reaberto.`
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function excluir(e: ExercicioRow) {
    if (e.lancamentosCount > 0) {
      toast.error(
        `Não é possível excluir: exercício ${e.ano} possui ${e.lancamentosCount} lançamento(s).`
      );
      return;
    }
    if (!confirm(`Excluir o exercício ${e.ano}? Esta ação não pode ser desfeita.`)) return;

    setBusyId(e.id);
    try {
      const res = await fetch(`/api/exercicios/${e.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao excluir.");
        return;
      }
      toast.success(`Exercício ${e.ano} excluído.`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const abertos = inicial.filter((e) => e.status === "ABERTO").length;
  const encerrados = inicial.filter((e) => e.status === "ENCERRADO").length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Anos de Exercício</CardTitle>
            <CardDescription>
              {abertos} aberto{abertos !== 1 ? "s" : ""} · {encerrados} encerrado{encerrados !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button onClick={abrirModal} size="sm">
            <Plus className="h-4 w-4" />
            Novo exercício
          </Button>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Ano</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="text-right">Lançamentos</TableHead>
                <TableHead className="w-36 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inicial.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Nenhum exercício cadastrado. Clique em "Novo exercício" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                inicial.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-muted-foreground" aria-hidden />
                        <span className="font-semibold tabular-nums text-foreground">
                          {e.ano}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={e.status === "ABERTO" ? "default" : "secondary"}
                        className={
                          e.status === "ABERTO"
                            ? "bg-success/15 text-success border-success/30"
                            : ""
                        }
                      >
                        {e.status === "ABERTO" ? (
                          <LockOpen className="mr-1 h-3 w-3" aria-hidden />
                        ) : (
                          <Lock className="mr-1 h-3 w-3" aria-hidden />
                        )}
                        {e.status === "ABERTO" ? "Aberto" : "Encerrado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {e.lancamentosCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => alternarStatus(e)}
                          disabled={busyId === e.id}
                          title={
                            e.status === "ABERTO"
                              ? "Encerrar exercício"
                              : "Reabrir exercício"
                          }
                          className="h-8 px-2 text-xs"
                        >
                          {busyId === e.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : e.status === "ABERTO" ? (
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <LockOpen className="h-3.5 w-3.5" aria-hidden />
                          )}
                          <span className="ml-1">
                            {e.status === "ABERTO" ? "Encerrar" : "Reabrir"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => excluir(e)}
                          disabled={busyId === e.id || e.lancamentosCount > 0}
                          title={
                            e.lancamentosCount > 0
                              ? `Há ${e.lancamentosCount} lançamento(s) — não pode excluir`
                              : "Excluir exercício"
                          }
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de cadastro */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) setModalOpen(false); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" aria-hidden />
              Novo Exercício
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ex-ano">Ano *</Label>
              <Input
                id="ex-ano"
                type="number"
                min={2000}
                max={2100}
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                placeholder="Ex.: 2026"
                className="tabular-nums"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-status">Status inicial</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "ABERTO" | "ENCERRADO")}
              >
                <SelectTrigger id="ex-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTO">
                    <span className="flex items-center gap-2">
                      <LockOpen className="h-4 w-4 text-success" aria-hidden />
                      Aberto
                    </span>
                  </SelectItem>
                  <SelectItem value="ENCERRADO">
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" aria-hidden />
                      Encerrado
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
