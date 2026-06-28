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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ModalNovaFolhaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNovoTipo: (tipo: TipoFolha) => void;
}

export function ModalNovaFolha({ open, onOpenChange, onNovoTipo }: ModalNovaFolhaProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatorio, setObrigatorio] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCriar = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tipos-folha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          obrigatorio,
        }),
      });

      if (!res.ok) {
        const erro = await res.json();
        throw new Error(erro.error || "Erro ao criar tipo");
      }

      const novoTipo = await res.json();
      onNovoTipo(novoTipo.data);

      setNome("");
      setDescricao("");
      setObrigatorio(false);
      onOpenChange(false);

      toast.success("Tipo de folha criado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar tipo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="hidden" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Tipo de Folha</DialogTitle>
          <DialogDescription>Criar um novo tipo de folha customizado</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder="ex: Décimo Terceiro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="ex: Folha referente ao 13º salário"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="obrigatorio"
              checked={obrigatorio}
              onCheckedChange={(checked) => setObrigatorio(checked as boolean)}
              disabled={loading}
            />
            <Label htmlFor="obrigatorio" className="font-normal cursor-pointer">
              Tornar obrigatória para novos lançamentos
            </Label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCriar} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Tipo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
