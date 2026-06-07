"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";

export default function GuiaContribuicaoPage() {
  const [pending, start] = useTransition();
  const [orgaoId, setOrgaoId] = useState("");
  const [exercicioId, setExercicioId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [tipo, setTipo] = useState<"PATRONAL" | "SEGURADO" | "AMBOS">(
    "PATRONAL"
  );

  // Novos campos manuais
  const [dataVencimento, setDataVencimento] = useState("");
  const [baseCálculo, setBaseCálculo] = useState("");
  const [contribuicaoSegurado, setContribuicaoSegurado] = useState("");

  const [orgaos, setOrgaos] = useState<any[]>([]);
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        const [orgaosRes, exerciciosRes, competenciasRes] = await Promise.all([
          fetch("/api/orgaos?limit=100"),
          fetch("/api/exercicios"),
          fetch("/api/competencias"),
        ]);

        const orgaosData = await orgaosRes.json();
        const exerciciosData = await exerciciosRes.json();
        const competenciasData = await competenciasRes.json();

        setOrgaos(orgaosData || []);
        setExercicios(exerciciosData || []);
        setCompetencias(competenciasData || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados dos filtros");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleGerar = () => {
    if (
      !orgaoId ||
      !exercicioId ||
      !competenciaId ||
      !dataVencimento ||
      !baseCálculo ||
      !contribuicaoSegurado
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    start(async () => {
      try {
        const params = new URLSearchParams({
          orgaoId,
          exercicioId,
          competenciaId,
          tipo,
          dataVencimento,
          baseCálculo,
          contribuicaoSegurado,
        });

        const response = await fetch(
          `/api/relatorios/guia-contribuicao?${params}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao gerar relatório");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `guia-contribuicao-${orgaoId}-${competenciaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Guia gerada com sucesso!");
      } catch (err) {
        toast.error("Erro ao gerar guia", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  };

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Guia de Contribuição Previdenciária</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere a guia de recolhimento para um órgão e competência específicos
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Carregando filtros...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Órgão */}
          <div className="space-y-2">
            <Label htmlFor="orgao">Ente Municipal *</Label>
            <Select value={orgaoId} onValueChange={setOrgaoId}>
              <SelectTrigger id="orgao" className="h-9 text-sm">
                <SelectValue placeholder="Selecione o órgão" />
              </SelectTrigger>
              <SelectContent>
                {orgaos.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.sigla} - {o.nome.substring(0, 40)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exercício */}
          <div className="space-y-2">
            <Label htmlFor="exercicio">Exercício *</Label>
            <Select value={exercicioId} onValueChange={setExercicioId}>
              <SelectTrigger id="exercicio" className="h-9 text-sm">
                <SelectValue placeholder="Selecione o exercício" />
              </SelectTrigger>
              <SelectContent>
                {exercicios.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Competência */}
          <div className="space-y-2">
            <Label htmlFor="competencia">Competência *</Label>
            <Select value={competenciaId} onValueChange={setCompetenciaId}>
              <SelectTrigger id="competencia" className="h-9 text-sm">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {competencias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Contribuição *</Label>
            <Select
              value={tipo}
              onValueChange={(v) =>
                setTipo(v as "PATRONAL" | "SEGURADO" | "AMBOS")
              }
            >
              <SelectTrigger id="tipo" className="h-9 text-sm">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PATRONAL">Patronal</SelectItem>
                <SelectItem value="SEGURADO">Segurado</SelectItem>
                <SelectItem value="AMBOS">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
            <Input
              id="dataVencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Base de Cálculo */}
          <div className="space-y-2">
            <Label htmlFor="baseCálculo">Base de Cálculo (R$) *</Label>
            <CurrencyInput
              id="baseCálculo"
              value={baseCálculo}
              onChange={(e) => setBaseCálculo(e.target.value)}
              placeholder="0,00"
              className="h-9 text-sm"
            />
          </div>

          {/* Contribuição Segurado */}
          <div className="space-y-2">
            <Label htmlFor="contribuicaoSegurado">Contribuição Segurado (R$) *</Label>
            <CurrencyInput
              id="contribuicaoSegurado"
              value={contribuicaoSegurado}
              onChange={(e) => setContribuicaoSegurado(e.target.value)}
              placeholder="0,00"
              className="h-9 text-sm"
            />
          </div>
        </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGerar}
                disabled={pending || !orgaoId || !exercicioId || !competenciaId}
                className="gap-2"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Gerar Guia PDF
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>ℹ️ Dica:</strong> A guia mostrará os dados da contribuição
          para o órgão, competência e tipo selecionado, com os dados de
          depósito do Instituto RPPS.
        </p>
      </div>
    </main>
  );
}
