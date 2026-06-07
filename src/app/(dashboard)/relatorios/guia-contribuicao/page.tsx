"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function GuiaContribuicaoPage() {
  const [pending, start] = useTransition();

  // Dados comuns (ambas abas)
  const [orgaoId, setOrgaoId] = useState("");
  const [exercicioId, setExercicioId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");

  // Aba PATRONAL
  const [patronalDataVencimento, setPatronalDataVencimento] = useState("");
  const [patronalBaseCálculo, setPatronalBaseCálculo] = useState("");
  const [patronalContribuicao, setPatronalContribuicao] = useState("");

  // Aba SEGURADO
  const [seguradoDataVencimento, setSeguradoDataVencimento] = useState("");
  const [seguradoBaseCálculo, setSeguradoBaseCálculo] = useState("");
  const [seguradoContribuicao, setSeguradoContribuicao] = useState("");

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

  const handleGerar = (tipo: "PATRONAL" | "SEGURADO") => {
    const dataVencimento = tipo === "PATRONAL" ? patronalDataVencimento : seguradoDataVencimento;
    const baseCálculo = tipo === "PATRONAL" ? patronalBaseCálculo : seguradoBaseCálculo;
    const contribuicao = tipo === "PATRONAL" ? patronalContribuicao : seguradoContribuicao;

    if (!orgaoId || !exercicioId || !competenciaId || !dataVencimento || !baseCálculo || !contribuicao) {
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
          contribuicaoPatronal: tipo === "PATRONAL" ? contribuicao : "0",
          contribuicaoSegurado: tipo === "SEGURADO" ? contribuicao : "0",
        });

        const response = await fetch(
          `/api/relatorios/guia-contribuicao?${params}`,
          { method: "GET" }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao gerar relatório");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `guia-${tipo.toLowerCase()}-${orgaoId}-${competenciaId}.pdf`;
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

  const camposSeleção = (
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
    </div>
  );

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Guia de Contribuição Previdenciária</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere guias de recolhimento separadas para Patronal e Segurado
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
            {/* Campos comuns no topo */}
            <div className="space-y-4">
              <h3 className="font-semibold">Dados Gerais</h3>
              {camposSeleção}
            </div>

            {/* Abas para Patronal e Segurado */}
            <Tabs defaultValue="patronal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="patronal">Patronal</TabsTrigger>
                <TabsTrigger value="segurado">Segurado</TabsTrigger>
              </TabsList>

              {/* ABA PATRONAL */}
              <TabsContent value="patronal" className="space-y-4 mt-4">
                <h3 className="font-semibold">Dados da Contribuição Patronal</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Data de Vencimento */}
                  <div className="space-y-2">
                    <Label htmlFor="patronalDataVencimento">Data de Vencimento *</Label>
                    <Input
                      id="patronalDataVencimento"
                      type="date"
                      value={patronalDataVencimento}
                      onChange={(e) => setPatronalDataVencimento(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Base de Cálculo */}
                  <div className="space-y-2">
                    <Label htmlFor="patronalBaseCálculo">Base de Cálculo (R$) *</Label>
                    <CurrencyInput
                      id="patronalBaseCálculo"
                      value={patronalBaseCálculo}
                      onChange={(e) => setPatronalBaseCálculo(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Contribuição */}
                  <div className="space-y-2">
                    <Label htmlFor="patronalContribuicao">Contribuição Patronal (R$) *</Label>
                    <CurrencyInput
                      id="patronalContribuicao"
                      value={patronalContribuicao}
                      onChange={(e) => setPatronalContribuicao(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleGerar("PATRONAL")}
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
                      Gerar Guia Patronal
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* ABA SEGURADO */}
              <TabsContent value="segurado" className="space-y-4 mt-4">
                <h3 className="font-semibold">Dados da Contribuição Segurado</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Data de Vencimento */}
                  <div className="space-y-2">
                    <Label htmlFor="seguradoDataVencimento">Data de Vencimento *</Label>
                    <Input
                      id="seguradoDataVencimento"
                      type="date"
                      value={seguradoDataVencimento}
                      onChange={(e) => setSeguradoDataVencimento(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Base de Cálculo */}
                  <div className="space-y-2">
                    <Label htmlFor="seguradoBaseCálculo">Base de Cálculo (R$) *</Label>
                    <CurrencyInput
                      id="seguradoBaseCálculo"
                      value={seguradoBaseCálculo}
                      onChange={(e) => setSeguradoBaseCálculo(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Contribuição */}
                  <div className="space-y-2">
                    <Label htmlFor="seguradoContribuicao">Contribuição Segurado (R$) *</Label>
                    <CurrencyInput
                      id="seguradoContribuicao"
                      value={seguradoContribuicao}
                      onChange={(e) => setSeguradoContribuicao(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleGerar("SEGURADO")}
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
                      Gerar Guia Segurado
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>ℹ️ Dica:</strong> Use as abas para gerar guias separadas de Patronal e Segurado.
          Cada uma pode ter valores diferentes de Base de Cálculo e Contribuição.
        </p>
      </div>
    </main>
  );
}
