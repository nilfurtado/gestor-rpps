"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TipoFolha } from "@prisma/client";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalEditarProps {
  tipo: TipoFolha | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo: (tipoAtualizado: TipoFolha) => void;
}

export function ModalEditar({ tipo, open, onOpenChange, onSalvo }: ModalEditarProps) {
  const [nome, setNome] = useState(tipo?.nome || "");
  const [descricao, setDescricao] = useState(tipo?.descricao || "");
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!tipo) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tipos-folha/${tipo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      const atualizado = await res.json();
      onSalvo(atualizado);
      onOpenChange(false);
      toast.success("Tipo atualizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  if (!tipo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Tipo de Folha</DialogTitle>
          <DialogDescription>Atualize o nome e descrição do tipo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome *</Label>
            <Input
              id="edit-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Input
              id="edit-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={loading}
              placeholder="Descrição opcional"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
