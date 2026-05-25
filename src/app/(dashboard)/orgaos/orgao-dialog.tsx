"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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

const DEFAULT_COR = "#0F5132";
const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface OrgaoDialogProps {
  trigger: React.ReactNode;
  orgao?: {
    id: number;
    sigla: string;
    nome: string;
    cor: string | null;
    status: "ATIVO" | "INATIVO";
  };
}

export function OrgaoDialog({ trigger, orgao }: OrgaoDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sigla, setSigla] = useState(orgao?.sigla ?? "");
  const [nome, setNome] = useState(orgao?.nome ?? "");
  const [cor, setCor] = useState(orgao?.cor ?? DEFAULT_COR);
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">(orgao?.status ?? "ATIVO");
  const [pending, start] = useTransition();
  const editing = !!orgao;

  function reset() {
    if (!orgao) {
      setSigla("");
      setNome("");
      setCor(DEFAULT_COR);
      setStatus("ATIVO");
    }
  }

  function handleHexInputChange(value: string) {
    // Garante prefixo # e normaliza letra maiúscula
    let v = value.trim();
    if (v && !v.startsWith("#")) v = "#" + v;
    setCor(v.toUpperCase().slice(0, 7));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!HEX_REGEX.test(cor)) {
      toast.error("Cor inválida.", {
        description: "Use o formato HEX completo, ex.: #2563EB",
      });
      return;
    }
    start(async () => {
      try {
        const payload = { sigla, nome, cor, status };
        const url = editing ? `/api/orgaos/${orgao!.id}` : "/api/orgaos";
        const method = editing ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Falha ao salvar");
        }
        toast.success(editing ? "Órgão atualizado." : "Órgão cadastrado.");
        setOpen(false);
        reset();
        router.refresh();
      } catch (err) {
        toast.error("Erro ao salvar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  const hexValido = HEX_REGEX.test(cor);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar órgão" : "Novo órgão"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados do ente municipal."
              : "Cadastre um novo ente municipal vinculado ao RPPS."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="sigla">Sigla *</Label>
              <Input
                id="sigla"
                required
                maxLength={20}
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                placeholder="Ex.: SEMSA"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Denominação *</Label>
              <Input
                id="nome"
                required
                maxLength={150}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Secretaria Municipal de Saúde"
              />
            </div>
          </div>

          {/* ── Cor + Status ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cor-hex">Cor de identificação</Label>
              <div className="flex items-center gap-2">
                {/* Swatch grande de preview */}
                <div
                  className="h-10 w-10 shrink-0 rounded-md border border-border shadow-sm"
                  style={{ backgroundColor: hexValido ? cor : "transparent" }}
                  aria-hidden
                />
                {/* Color picker nativo */}
                <input
                  type="color"
                  aria-label="Selecionar cor"
                  value={hexValido ? cor : DEFAULT_COR}
                  onChange={(e) => setCor(e.target.value.toUpperCase())}
                  className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-background p-1"
                />
                {/* Campo HEX texto */}
                <Input
                  id="cor-hex"
                  value={cor}
                  onChange={(e) => handleHexInputChange(e.target.value)}
                  placeholder="#0F5132"
                  maxLength={7}
                  className="font-mono uppercase"
                  aria-invalid={!hexValido}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Esta cor identificará o órgão nos gráficos do dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "ATIVO" | "INATIVO")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending || !hexValido}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? "Salvar alterações" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
