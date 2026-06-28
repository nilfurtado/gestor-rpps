"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";

interface ModalEditarProps {
  tipo: TipoFolha | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo: (tipoAtualizado: TipoFolha) => void;
}


export function ModalEditar({ tipo, open, onOpenChange, onSalvo }: ModalEditarProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatorio, setObrigatorio] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [cor, setCor] = useState("#2563EB");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tipo) {
      setNome(tipo.nome);
      setDescricao(tipo.descricao || "");
      setObrigatorio(tipo.obrigatorio);
      setAtivo(tipo.ativo);
      setCor((tipo as any).cor || "#2563EB");
    }
  }, [tipo, open]);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!tipo) return;

    if (tipo.obrigatorio && !obrigatorio && tipo.obrigatorio) {
      toast.error("Não é possível remover o tipo de obrigatório para este tipo");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tipos-folha/${tipo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          obrigatorio,
          ativo,
          cor,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao salvar");
      }

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

  // Converter cor hex para RGB para prévia
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` : hex;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Folha</DialogTitle>
          <DialogDescription>Atualize as propriedades do tipo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
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

          {/* Descrição */}
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

          {/* Tipo (Obrigatório/Opcional) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Tipo</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setObrigatorio(false)}
                disabled={loading || tipo.obrigatorio}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                  !obrigatorio
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Opcional
              </button>
              <button
                onClick={() => setObrigatorio(true)}
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                  obrigatorio
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Obrigatória
              </button>
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Cor</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                disabled={loading}
                className="h-9 w-16 cursor-pointer"
              />
              <Input
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#2563EB"
                disabled={loading}
                className="h-9 flex-1 text-sm"
              />
            </div>
            <div className="p-3 rounded-md border" style={{ backgroundColor: hexToRgb(cor) + "20", borderColor: cor }}>
              <div className="text-sm font-semibold" style={{ color: cor }}>
                {nome || "Prévia"}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Status</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setAtivo(false)}
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                  !ativo
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Inativa
              </button>
              <button
                onClick={() => setAtivo(true)}
                disabled={loading}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                  ativo
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Ativa
              </button>
            </div>
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
