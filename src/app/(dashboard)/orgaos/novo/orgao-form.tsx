"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CnpjInput } from "@/components/ui/cnpj-input";
import { CepInput } from "@/components/ui/cep-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OrgaoInitial {
  id: number;
  sigla: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cor: string | null;
  status: "ATIVO" | "INATIVO";
}

interface Props {
  initial?: OrgaoInitial;
}

export function OrgaoForm({ initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(initial);

  const [sigla, setSigla] = useState(initial?.sigla ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [razaoSocial, setRazaoSocial] = useState(initial?.razaoSocial ?? "");
  const [cnpj, setCnpj] = useState(initial?.cnpj ?? "");
  const [cep, setCep] = useState(initial?.cep ?? "");
  const [endereco, setEndereco] = useState(initial?.endereco ?? "");
  const [numero, setNumero] = useState(initial?.numero ?? "");
  const [complemento, setComplemento] = useState(initial?.complemento ?? "");
  const [bairro, setBairro] = useState(initial?.bairro ?? "");
  const [cidade, setCidade] = useState(initial?.cidade ?? "");
  const [estado, setEstado] = useState(initial?.estado ?? "");
  const [cor, setCor] = useState(initial?.cor ?? "");
  const [status, setStatus] = useState<"ATIVO" | "INATIVO">(initial?.status ?? "ATIVO");
  const [buscandoCep, setBuscandoCep] = useState(false);

  async function buscarCep() {
    if (!cep) {
      toast.error("Informe o CEP");
      return;
    }

    setBuscandoCep(true);
    try {
      const res = await fetch(`/api/cep?cep=${cep}`);
      if (!res.ok) {
        throw new Error("CEP não encontrado");
      }
      const data = await res.json();
      setEndereco(data.logradouro);
      setBairro(data.bairro);
      setCidade(data.localidade);
      setEstado(data.uf);
      toast.success("Endereço preenchido automaticamente");
    } catch (err) {
      toast.error("CEP não encontrado");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sigla || !nome) {
      toast.error("Preencha sigla e nome");
      return;
    }

    start(async () => {
      try {
        const payload = {
          sigla,
          nome,
          razaoSocial: razaoSocial || null,
          cnpj: cnpj || null,
          cep: cep || null,
          endereco: endereco || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          estado: estado || null,
          cor: cor || null,
          status,
        };

        const url = isEdit ? `/api/orgaos/${initial!.id}` : "/api/orgaos";
        const method = isEdit ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Falha ao salvar");
        }

        toast.success(isEdit ? "Órgão atualizado" : "Órgão cadastrado");
        router.push("/orgaos");
        router.refresh();
      } catch (err) {
        toast.error("Erro ao salvar", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Linha 1: Sigla, Ente Municipal e Razão Social */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Sigla *</Label>
          <Input
            value={sigla}
            onChange={(e) => setSigla(e.target.value.toUpperCase())}
            placeholder="PMTA"
            maxLength={20}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium">Ente Municipal *</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Prefeitura Municipal..."
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-3">
          <Label className="text-xs font-medium">Razão Social</Label>
          <Input
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Denominação oficial da entidade"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 2: CNPJ, CEP e Botão Buscar */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium">CNPJ</Label>
          <CnpjInput
            value={cnpj}
            onChange={(e) => setCnpj(e.currentTarget.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">CEP</Label>
          <div className="flex gap-1">
            <CepInput
              value={cep}
              onChange={(e) => setCep(e.currentTarget.value)}
              className="h-8 flex-1 text-sm"
            />
            <Button
              type="button"
              onClick={buscarCep}
              disabled={buscandoCep || !cep}
              variant="outline"
              size="sm"
              className="h-8 px-2"
            >
              {buscandoCep ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium">Logradouro</Label>
          <Input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Avenida Principal"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 3: Número, Complemento, Bairro */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Nº</Label>
          <Input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="123"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Compl.</Label>
          <Input
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Apt 101"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs font-medium">Bairro</Label>
          <Input
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            placeholder="Centro"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 4: Cidade e Estado */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-3">
          <Label className="text-xs font-medium">Cidade</Label>
          <Input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="São Paulo"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">UF</Label>
          <Input
            value={estado}
            onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="SP"
            maxLength={2}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Linha 5: Cor e Status */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium">Cor</Label>
          <div className="flex gap-1">
            <Input
              type="color"
              value={cor || "#2563EB"}
              onChange={(e) => setCor(e.target.value)}
              className="h-8 w-12 cursor-pointer"
            />
            <Input
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              placeholder="#2563EB"
              className="h-8 flex-1 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "ATIVO" | "INATIVO")}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="INATIVO">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
          size="sm"
          className="h-8"
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} size="sm" className="h-8">
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isEdit ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}
