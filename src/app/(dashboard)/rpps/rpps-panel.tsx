"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, RefreshCw, Building2, User2, Phone, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoCropper } from "./logo-cropper";

interface RppsData {
  id: number;
  nomeInstituto: string | null;
  nomeResponsavel: string | null;
  cnpj: string | null;
  enderecoCompleto: string | null;
  telefone: string | null;
  email: string | null;
  nomeDepartamento: string | null;
  responsavelDepartamento: string | null;
  logoPath: string | null;
}

interface Props {
  dados: RppsData | null;
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </Label>
      {children}
    </div>
  );
}

export function RppsPanel({ dados }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [nomeInstituto,           setNomeInstituto]           = useState(dados?.nomeInstituto ?? "");
  const [nomeResponsavel,         setNomeResponsavel]         = useState(dados?.nomeResponsavel ?? "");
  const [cnpj,                    setCnpj]                    = useState(dados?.cnpj ?? "");
  const [enderecoCompleto,        setEnderecoCompleto]        = useState(dados?.enderecoCompleto ?? "");
  const [telefone,                setTelefone]                = useState(dados?.telefone ?? "");
  const [email,                   setEmail]                   = useState(dados?.email ?? "");
  const [nomeDepartamento,        setNomeDepartamento]        = useState(dados?.nomeDepartamento ?? "");
  const [responsavelDepartamento, setResponsavelDepartamento] = useState(dados?.responsavelDepartamento ?? "");
  const [logoPath,                setLogoPath]                = useState<string | null>(dados?.logoPath ?? null);

  function handleSalvar() {
    start(async () => {
      const payload = {
        nomeInstituto:           nomeInstituto   || undefined,
        nomeResponsavel:         nomeResponsavel  || undefined,
        cnpj:                    cnpj             || undefined,
        enderecoCompleto:        enderecoCompleto || undefined,
        telefone:                telefone         || undefined,
        email:                   email            || undefined,
        nomeDepartamento:        nomeDepartamento || undefined,
        responsavelDepartamento: responsavelDepartamento || undefined,
      };

      const res = await fetch("/api/rpps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Erro ao salvar as informações.");
        return;
      }
      toast.success("Informações do RPPS salvas com sucesso.");
      router.refresh();
    });
  }

  function handleAtualizar() {
    router.refresh();
    toast.info("Dados atualizados.");
  }

  return (
    <div className="space-y-6">
      {/* ── Identificação do Instituto ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
            Identificação do Instituto
          </CardTitle>
          <CardDescription>Razão social e CNPJ do instituto de previdência.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="nomeInstituto" label="Nome do Instituto RPPS">
              <Input
                id="nomeInstituto"
                value={nomeInstituto}
                onChange={(e) => setNomeInstituto(e.target.value)}
                placeholder="Ex.: Instituto de Previdência de Santana"
                maxLength={200}
              />
            </Field>
          </div>
          <Field id="cnpj" label="CNPJ">
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Responsáveis ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User2 className="h-4 w-4 text-primary" aria-hidden />
            Responsáveis
          </CardTitle>
          <CardDescription>Gestores e departamento responsável pelo RPPS.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="nomeResponsavel" label="Responsável pelo RPPS">
            <Input
              id="nomeResponsavel"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Nome completo"
              maxLength={200}
            />
          </Field>
          <Field id="nomeDepartamento" label="Nome do Departamento">
            <Input
              id="nomeDepartamento"
              value={nomeDepartamento}
              onChange={(e) => setNomeDepartamento(e.target.value)}
              placeholder="Ex.: Divisão de Arrecadação"
              maxLength={200}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="responsavelDepartamento" label="Responsável pelo Departamento">
              <Input
                id="responsavelDepartamento"
                value={responsavelDepartamento}
                onChange={(e) => setResponsavelDepartamento(e.target.value)}
                placeholder="Nome completo"
                maxLength={200}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Contato e Endereço ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-primary" aria-hidden />
            Contato e Endereço
          </CardTitle>
          <CardDescription>Informações de contato e localização do instituto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="email" label="E-mail institucional">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@sanprev.ap.gov.br"
              maxLength={200}
            />
          </Field>
          <Field id="telefone" label="Telefone">
            <Input
              id="telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(96) 3281-0000"
              maxLength={30}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="enderecoCompleto" label="Endereço completo">
              <Input
                id="enderecoCompleto"
                value={enderecoCompleto}
                onChange={(e) => setEnderecoCompleto(e.target.value)}
                placeholder="Rua, número, bairro, cidade — AP, CEP 00000-000"
                maxLength={500}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Logomarca ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" aria-hidden />
            Logomarca Institucional
          </CardTitle>
          <CardDescription>
            A logo será utilizada nos relatórios PDF e na página de acesso ao sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoCropper
            currentLogoPath={logoPath}
            onLogoSaved={(p) => setLogoPath(p)}
          />
        </CardContent>
      </Card>

      {/* ── Ações ─────────────────────────────────────────────────── */}
      <Separator />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleAtualizar}
          disabled={pending}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Atualizar Dados
        </Button>
        <Button
          type="button"
          onClick={handleSalvar}
          disabled={pending}
          className="gap-2"
        >
          <Save className="h-4 w-4" aria-hidden />
          {pending ? "Salvando…" : "Salvar Informações"}
        </Button>
      </div>
    </div>
  );
}
