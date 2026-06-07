"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Loader2, FileText } from "lucide-react";
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { RealtimeBadge } from "@/components/reports/realtime-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GuiaContribuicaoPage() {
  const [pending, start] = useTransition();

  // Dados comuns
  const [orgaoId, setOrgaoId] = useState("");
  const [exercicioId, setExercicioId] = useState("");
  const [competenciaId, setCompetenciaId] = useState("");
  const [tipo, setTipo] = useState<"PATRONAL" | "SEGURADO" | "AMBAS">("PATRONAL");

  // Campos Patronal
  const [patronalDataVencimento, setPatronalDataVencimento] = useState("");
  const [patronalBaseCálculo, setPatronalBaseCálculo] = useState("");
  const [patronalContribuicao, setPatronalContribuicao] = useState("");

  // Campos Segurado
  const [seguradoDataVencimento, setSeguradoDataVencimento] = useState("");
  const [seguradoBaseCálculo, setSeguradoBaseCálculo] = useState("");
  const [seguradoContribuicao, setSeguradoContribuicao] = useState("");

  const [orgaos, setOrgaos] = useState<any[]>([]);
  const [exercicios, setExercicios] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Monitorar atualizações em tempo real
  useRealtimeUpdates(
    useCallback((update) => {
      if (update.type === "lancamento" || update.type === "acordo") {
        toast.info("Dados atualizados", {
          description: "Os dados podem ter sido alterados.",
        });
      }
    }, [])
  );

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
    // Validar dados comuns
    if (!orgaoId || !exercicioId || !competenciaId) {
      toast.error("Preencha Ente, Exercício e Competência");
      return;
    }

    // Validar campos conforme tipo
    if ((tipo === "PATRONAL" || tipo === "AMBAS") && (!patronalDataVencimento || !patronalBaseCálculo || !patronalContribuicao)) {
      toast.error("Preencha todos os campos de Patronal");
      return;
    }

    if ((tipo === "SEGURADO" || tipo === "AMBAS") && (!seguradoDataVencimento || !seguradoBaseCálculo || !seguradoContribuicao)) {
      toast.error("Preencha todos os campos de Segurado");
      return;
    }

    start(async () => {
      try {
        const params = new URLSearchParams({
          orgaoId,
          exercicioId,
          competenciaId,
          tipo,
          patronalDataVencimento,
          patronalBaseCálculo,
          patronalContribuicao,
          seguradoDataVencimento,
          seguradoBaseCálculo,
          seguradoContribuicao,
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

  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Guia de Contribuição Previdenciária</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gere guias em um único PDF (Patronal, Segurado ou ambas)
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
            {/* SEÇÃO 1: Dados Gerais */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold border-b pb-2">Dados Gerais</h3>
                <RealtimeBadge />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Órgão */}
                <div className="space-y-2">
                  <Label htmlFor="orgao">Ente Municipal *</Label>
                  <Select value={orgaoId} onValueChange={setOrgaoId}>
                    <SelectTrigger id="orgao" className="h-9 text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgaos.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.sigla}
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
                      <SelectValue placeholder="Selecione" />
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
                      <SelectValue placeholder="Selecione" />
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
            </div>

            {/* SEÇÃO 2: Tipo de Guia */}
            <div className="space-y-4">
              <h3 className="font-semibold border-b pb-2">Tipo de Guia</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="PATRONAL"
                    checked={tipo === "PATRONAL"}
                    onChange={(e) => setTipo(e.target.value as "PATRONAL" | "SEGURADO" | "AMBAS")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Apenas Patronal</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="SEGURADO"
                    checked={tipo === "SEGURADO"}
                    onChange={(e) => setTipo(e.target.value as "PATRONAL" | "SEGURADO" | "AMBAS")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Apenas Segurado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="AMBAS"
                    checked={tipo === "AMBAS"}
                    onChange={(e) => setTipo(e.target.value as "PATRONAL" | "SEGURADO" | "AMBAS")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Patronal + Segurado</span>
                </label>
              </div>
            </div>

            {/* SEÇÃO 3: Dados Patronal (se selecionado) */}
            {(tipo === "PATRONAL" || tipo === "AMBAS") && (
              <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h3 className="font-semibold">Contribuição Patronal</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="patronalContribuicao">Contribuição (R$) *</Label>
                    <CurrencyInput
                      id="patronalContribuicao"
                      value={patronalContribuicao}
                      onChange={(e) => setPatronalContribuicao(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 4: Dados Segurado (se selecionado) */}
            {(tipo === "SEGURADO" || tipo === "AMBAS") && (
              <div className="space-y-4 p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
                <h3 className="font-semibold">Contribuição Segurado</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="seguradoContribuicao">Contribuição (R$) *</Label>
                    <CurrencyInput
                      id="seguradoContribuicao"
                      value={seguradoContribuicao}
                      onChange={(e) => setSeguradoContribuicao(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* BOTÃO GERAR */}
            <Button
              onClick={handleGerar}
              disabled={pending || !orgaoId || !exercicioId || !competenciaId}
              className="w-full gap-2"
              size="lg"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Gerar Guia em PDF
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          <strong>ℹ️ Dica:</strong> Selecione qual tipo de guia deseja gerar. Se escolher "Patronal + Segurado",
          ambas serão geradas em um único PDF.
        </p>
      </div>
    </main>
  );
}
