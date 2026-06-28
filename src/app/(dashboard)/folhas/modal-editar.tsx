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
import { getTipoFolhaColor } from "@/lib/tipo-folha-colors";

interface ModalEditarProps {
  tipo: TipoFolha | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo: (tipoAtualizado: TipoFolha) => void;
}

const CORES_DISPONIVEIS = [
  { classe: "text-red-600", label: "Vermelho", bg: "bg-red-100 dark:bg-red-900/30" },
  { classe: "text-orange-600", label: "Laranja", bg: "bg-orange-100 dark:bg-orange-900/30" },
  { classe: "text-yellow-600", label: "Amarelo", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
  { classe: "text-green-600", label: "Verde", bg: "bg-green-100 dark:bg-green-900/30" },
  { classe: "text-blue-600", label: "Azul", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { classe: "text-purple-600", label: "Roxo", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { classe: "text-pink-600", label: "Rosa", bg: "bg-pink-100 dark:bg-pink-900/30" },
  { classe: "text-slate-600", label: "Cinza", bg: "bg-slate-100 dark:bg-slate-900/30" },
];

export function ModalEditar({ tipo, open, onOpenChange, onSalvo }: ModalEditarProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatorio, setObrigatorio] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [cor, setCor] = useState("text-blue-600");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tipo) {
      setNome(tipo.nome);
      setDescricao(tipo.descricao || "");
      setObrigatorio(tipo.obrigatorio);
      setAtivo(tipo.ativo);
      setCor((tipo as any).cor || "text-blue-600");
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

  const corAtual = getTipoFolhaColor(tipo.nome);

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
            <div className="grid grid-cols-4 gap-2">
              {CORES_DISPONIVEIS.map((opcao) => (
                <button
                  key={opcao.classe}
                  onClick={() => setCor(opcao.classe)}
                  disabled={loading}
                  className={`px-2 py-2 rounded-md text-xs font-medium transition border-2 ${
                    cor === opcao.classe
                      ? `border-current ${opcao.classe}`
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={opcao.label}
                >
                  <div className={`h-4 rounded ${opcao.classe}`} />
                </button>
              ))}
            </div>
            <div className={`p-3 rounded-md border ${cor} ${
              CORES_DISPONIVEIS.find(c => c.classe === cor)?.bg || "bg-blue-100"
            }`}>
              <div className={`text-sm font-semibold ${cor}`}>{nome || "Prévia"}</div>
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
