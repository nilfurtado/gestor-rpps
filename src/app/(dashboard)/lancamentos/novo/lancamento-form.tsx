"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { currencyToNumber, formatCurrency } from "@/lib/format-currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/lancamentos/status-badge";
import { JustificativaDiferenca } from "@/components/formulario/justificativa-diferenca";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { calcularAcrescimoAuto } from "@/lib/calc/acrescimo-auto";
import { formatBRL, formatPercent } from "@/lib/format";
import {
  calcularValorARecolher,
  calcularDiferenca,
  calcularFolhaTotal,
  calcularTotalARecolher,
  calcularTotalRecolhido,
  calcularDeficitTotal,
} from "@/lib/tipo-folha-service";
import type { TipoFolhaRow } from "@/types/lancamento";

export interface LancamentoInitial {
  id: number;
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  quantidadeServidores: number | null;
  folhaBase: number | null;
  folhaSuplementar: number | null;
  multas: number | null;
  juros: number | null;
  acrescimo: number | null;
  parcelado: boolean;
  dataVencimento: string | null;
  observacoes: string | null;
  justificativaDiferenca?: string | null;
  diferenca_aprovada?: boolean;
  dataAprovacao?: string | null;
}

export interface LancamentoKey {
  id: number;
  orgaoId: number;
  tipo: "PATRONAL" | "SEGURADO";
  exercicioId: number;
  competenciaId: number;
}

interface Props {
  orgaos: { id: number; sigla: string; nome: string }[];
  exercicios: { id: number; ano: number }[];
  competencias: { id: number; ordem: number; mes: string }[];
  initial?: LancamentoInitial;
  existingKeys?: LancamentoKey[];
}

export function LancamentoForm({
  orgaos,
  exercicios,
  competencias,
  initial,
  existingKeys = [],
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(initial);

  const [orgaoId, setOrgaoId] = useState<string>(initial ? String(initial.orgaoId) : "");
  const [tipo, setTipo] = useState<"PATRONAL" | "SEGURADO">(initial?.tipo ?? "PATRONAL");
  const [exercicioId, setExercicioId] = useState<string>(
    initial ? String(initial.exercicioId) : exercicios[0] ? String(exercicios[0].id) : ""
  );
  const [competenciaId, setCompetenciaId] = useState<string>(
    initial ? String(initial.competenciaId) : ""
  );
  const [aliquota, setAliquota] = useState<string>(initial ? String(initial.aliquota) : "");
  const [valorRecolher, setValorRecolher] = useState<string>(
    initial ? String(initial.valorRecolher) : ""
  );
  const [valorRecolhido, setValorRecolhido] = useState<string>(
    initial ? formatCurrency(Number(initial.valorRecolhido)) : ""
  );
  const [quantidadeServidores, setQuantidadeServidores] = useState<string>(
    initial?.quantidadeServidores != null ? String(initial.quantidadeServidores) : ""
  );
  const [folhaBase, setFolhaBase] = useState<string>(
    initial?.folhaBase != null ? formatCurrency(Number(initial.folhaBase)) : ""
  );
  const [folhaSuplementar, setFolhaSuplementar] = useState<string>(
    initial?.folhaSuplementar != null ? formatCurrency(Number(initial.folhaSuplementar)) : ""
  );
  const [multas, setMultas] = useState<string>(
    initial?.multas != null ? formatCurrency(Number(initial.multas)) : ""
  );
  const [juros, setJuros] = useState<string>(
    initial?.juros != null ? formatCurrency(Number(initial.juros)) : ""
  );
  const [parcelado, setParcelado] = useState(initial?.parcelado ?? false);
  const [dataVencimento, setDataVencimento] = useState<string>(
    initial?.dataVencimento
      ? initial.dataVencimento.slice(0, 10)
      : new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState<string>(initial?.observacoes ?? "");
  const [justificativaDiferenca, setJustificativaDiferenca] = useState<string>(initial?.justificativaDiferenca ?? "");
  const [diferenca_aprovada, setDiferenca_aprovada] = useState(initial?.diferenca_aprovada ?? false);
  const [dataAprovacao, setDataAprovacao] = useState<string | null>(initial?.dataAprovacao ?? null);
  const [showAprovado, setShowAprovado] = useState(initial?.diferenca_aprovada ?? false);

  // ── FOLHAS DINÂMICAS ───────────────────────────────────────────────────────
  const [tiposFolha, setTiposFolha] = useState<TipoFolhaRow[]>([]);
  const [folhas, setFolhas] = useState<Array<{
    tipoFolhaId: number;
    nomeTipo: string;
    valor: string;
    valorRecolhido: string;
  }>>(() => {
    // Inicializar com Folha Base vazia (tipoFolhaId=1 é placeholder até carregar da API)
    return [{
      tipoFolhaId: 0,
      nomeTipo: "Base",
      valor: initial?.folhaBase != null ? formatCurrency(Number(initial.folhaBase)) : "",
      valorRecolhido: "",
    }];
  });
  const [showAddFolha, setShowAddFolha] = useState(false);

  // Buscar tipos de folha ativos da API
  useEffect(() => {
    async function fetchTipos() {
      try {
        const response = await fetch("/api/tipos-folha");
        const data = await response.json();
        const tipos: TipoFolhaRow[] = data.data || [];
        setTiposFolha(tipos);

        // Inicializar folhas: se há dados iniciais, usar; senão, começar com Base
        const tipoBase = tipos.find((t) => t.obrigatorio) ?? tipos[0];
        if (tipoBase) {
          setFolhas([{
            tipoFolhaId: tipoBase.id,
            nomeTipo: tipoBase.nome,
            valor: initial?.folhaBase != null ? formatCurrency(Number(initial.folhaBase)) : "",
            valorRecolhido: initial ? formatCurrency(Number(initial.valorRecolhido)) : "",
          }]);
        }
      } catch (error) {
        console.error("Erro ao buscar tipos de folha:", error);
      }
    }
    fetchTipos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar folhas salvas quando editando um lançamento existente
  useEffect(() => {
    if (!initial?.id || tiposFolha.length === 0) return; // Só no modo edição e após tipos carregados

    async function fetchLancamento() {
      try {
        const res = await fetch(`/api/lancamentos/${initial!.id}`);
        if (!res.ok) return;

        const data = await res.json();
        const lancamento = data.data;

        // Se lançamento tem folhas salvas, popular o estado do form
        if (lancamento.folhas && lancamento.folhas.length > 0) {
          const folhasFromDb = lancamento.folhas.map((f: {
            tipoFolhaId: number;
            tipoFolha: { nome: string };
            valor: number | string;
            valorRecolhido: number | string;
          }) => ({
            tipoFolhaId: f.tipoFolhaId,
            nomeTipo: f.tipoFolha.nome,
            valor: formatCurrency(Number(f.valor)),
            valorRecolhido: formatCurrency(Number(f.valorRecolhido)),
          }));
          setFolhas(folhasFromDb);
        }
      } catch (error) {
        console.error("Erro ao buscar lançamento:", error);
      }
    }

    fetchLancamento();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id, tiposFolha]);

  // Sincronizar FOLHAS DE SALÁRIOS → VALORES LEGADOS em tempo real
  useEffect(() => {
    if (folhas.length > 0) {
      setFolhaBase(folhas[0].valor);
      setValorRecolhido(folhas[0].valorRecolhido);
    }
  }, [folhas]);

  // Alíquota editável - usa valor do usuário ou padrão do tipo
  const aliquotaFolhas = Number(aliquota) || (tipo === "PATRONAL" ? 15 : 10);

  // Cálculos em tempo real das folhas dinâmicas
  const folhasComCalculos = useMemo(() => {
    return folhas.map((f) => {
      const valor = currencyToNumber(f.valor);
      const recolhido = currencyToNumber(f.valorRecolhido);
      const aRecolher = calcularValorARecolher(valor, aliquotaFolhas);
      const diferenca = calcularDiferenca(aRecolher, recolhido);
      return { ...f, valorNum: valor, valorARecolher: aRecolher, diferencaCalc: diferenca, valorRecolhidoNum: recolhido };
    });
  }, [folhas, aliquotaFolhas]);

  // Totalizadores das folhas dinâmicas
  const resumoFolhas = useMemo(() => {
    return {
      folhaTotal: calcularFolhaTotal(folhasComCalculos.map((f) => ({ valor: f.valorNum }))),
      totalARecolher: calcularTotalARecolher(folhasComCalculos.map((f) => ({ valorARecolher: f.valorARecolher }))),
      totalRecolhido: calcularTotalRecolhido(folhasComCalculos.map((f) => ({ valorRecolhido: f.valorRecolhidoNum }))),
      deficitTotal: calcularDeficitTotal(folhasComCalculos.map((f) => ({ diferenca: f.diferencaCalc }))),
    };
  }, [folhasComCalculos]);

  // Tipos disponíveis para adicionar (não obrigatórios e ainda não adicionados)
  const tiposDisponiveis = useMemo(() => {
    const idsUsados = new Set(folhas.map((f) => f.tipoFolhaId));
    return tiposFolha.filter((t) => !t.obrigatorio && !idsUsados.has(t.id));
  }, [tiposFolha, folhas]);

  // Cálculo automático de Valor a Recolher = (Folha Base + Folha Suplementar) × Alíquota ÷ 100
  const valorRecolherCalculado = useMemo(() => {
    const folha = currencyToNumber(folhaBase);
    const folhaSupl = currencyToNumber(folhaSuplementar);
    const folhaTotal = folha + folhaSupl;
    const aliq = Number(aliquota) || 0;

    // Se ambos estão preenchidos, calcula com arredondamento para 2 decimais
    if (folhaTotal && aliq > 0) {
      const result = (folhaTotal * aliq) / 100;
      return Number(result.toFixed(2));
    }

    // Senão, retorna 0
    return 0;
  }, [folhaBase, folhaSuplementar, aliquota]);

  const resultadoAcrescimo = useMemo(() => {
    const vRecolhido = currencyToNumber(valorRecolhido);
    const vMultas = currencyToNumber(multas);

    if (valorRecolherCalculado > 0 && vRecolhido > 0) {
      return calcularAcrescimoAuto(valorRecolherCalculado, vRecolhido, vMultas);
    }
    return null;
  }, [valorRecolherCalculado, valorRecolhido, multas]);

  const preview = useMemo(() => {
    return calcularLancamento({
      valorRecolher: valorRecolherCalculado,
      valorRecolhido: currencyToNumber(valorRecolhido),
      multas: currencyToNumber(multas),
      juros: currencyToNumber(juros),
      acrescimo: resultadoAcrescimo?.acrescimo ?? 0,
      parcelado,
    });
  }, [valorRecolherCalculado, valorRecolhido, multas, resultadoAcrescimo, parcelado]);

  const duplicateConflict = useMemo(() => {
    if (isEdit) return null;
    if (!orgaoId || !exercicioId || !competenciaId) return null;
    const oId = Number(orgaoId);
    const eId = Number(exercicioId);
    const cId = Number(competenciaId);
    const match = existingKeys.find(
      (k) =>
        k.orgaoId === oId &&
        k.tipo === tipo &&
        k.exercicioId === eId &&
        k.competenciaId === cId
    );
    return match ?? null;
  }, [isEdit, orgaoId, tipo, exercicioId, competenciaId, existingKeys]);

  const conflictLabel = useMemo(() => {
    if (!duplicateConflict) return null;
    const org = orgaos.find((o) => o.id === duplicateConflict.orgaoId);
    const exe = exercicios.find((e) => e.id === duplicateConflict.exercicioId);
    const cmp = competencias.find((c) => c.id === duplicateConflict.competenciaId);
    return `${org?.sigla ?? "?"} · ${cmp?.mes ?? "?"} · ${exe?.ano ?? "?"} · ${duplicateConflict.tipo === "PATRONAL" ? "Patronal" : "Segurado"}`;
  }, [duplicateConflict, orgaos, exercicios, competencias]);

  async function handleAprovarDiferenca(motivo: string, detalhe: string) {
    try {
      const payload = {
        lancamentoId: initial!.id,
        motivo,
        detalhe,
      };
      console.log("Enviando para API:", payload);

      const res = await fetch("/api/lancamentos/aprovar-diferenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();
      console.log("Resposta da API:", { status: res.status, body: responseText });

      if (!res.ok) {
        toast.error(`Erro ${res.status}: ${responseText}`);
        return;
      }

      const data = JSON.parse(responseText);
      setShowAprovado(true);
      setDataAprovacao(new Date().toISOString());
      toast.success("Diferença aprovada com sucesso! ✅");

      // Recarregar página após 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error("Erro ao aprovar diferença:", err);
      toast.error(`Erro: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgaoId || !exercicioId || !competenciaId) {
      toast.error("Preencha órgão, exercício e competência.");
      return;
    }
    if (duplicateConflict) {
      toast.error("Já existe um lançamento com essa combinação.", {
        description: "Edite o lançamento existente em vez de criar um novo.",
      });
      return;
    }
    start(async () => {
      try {
        // Preparar folhas dinâmicas para envio
        const folhasPayload = folhasComCalculos
          .filter((f) => f.tipoFolhaId > 0 && f.valorNum > 0)
          .map((f) => ({
            tipoFolhaId: f.tipoFolhaId,
            valor: f.valorNum,
            valorRecolhido: f.valorRecolhidoNum,
          }));

        const payload = {
          orgaoId: Number(orgaoId),
          tipo,
          exercicioId: Number(exercicioId),
          competenciaId: Number(competenciaId),
          aliquota: Number(aliquota || 0),
          valorRecolher: folhasPayload.length > 0 ? resumoFolhas.totalARecolher : valorRecolherCalculado,
          valorRecolhido: folhasPayload.length > 0 ? resumoFolhas.totalRecolhido : currencyToNumber(valorRecolhido),
          quantidadeServidores: quantidadeServidores ? Number(quantidadeServidores) : null,
          folhaBase: folhasPayload.length > 0 ? (folhasComCalculos[0]?.valorNum ?? null) : (folhaBase ? currencyToNumber(folhaBase) : null),
          folhaSuplementar: folhaSuplementar ? currencyToNumber(folhaSuplementar) : null,
          multas: multas ? currencyToNumber(multas) : null,
          juros: juros ? currencyToNumber(juros) : null,
          acrescimo: resultadoAcrescimo?.acrescimo ?? null,
          acrescimo_tipo: resultadoAcrescimo?.tipo ?? 'QUITADO',
          parcelado,
          dataVencimento: dataVencimento || null,
          observacoes: observacoes || null,
          ...(folhasPayload.length > 0 && { folhas: folhasPayload }),
        };
        const url = isEdit ? `/api/lancamentos/${initial!.id}` : "/api/lancamentos";
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
        toast.success(isEdit ? "Lançamento atualizado." : "Lançamento registrado.");
        router.push("/lancamentos");
        router.refresh();
      } catch (err) {
        toast.error("Erro ao salvar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── IDENTIFICAÇÃO ─────────────────────────────────────────── */}
      <section aria-labelledby="sec-ident">
        <SectionTitle id="sec-ident">Identificação</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Ente municipal *">
            <Select value={orgaoId} onValueChange={setOrgaoId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {orgaos.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.sigla}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo *">
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as "PATRONAL" | "SEGURADO")}
              disabled={isEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PATRONAL">Patronal</SelectItem>
                <SelectItem value="SEGURADO">Segurado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Exercício *">
            <Select value={exercicioId} onValueChange={setExercicioId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {exercicios.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Competência *">
            <Select value={competenciaId} onValueChange={setCompetenciaId} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {competencias.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {isEdit ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Para mudar órgão, tipo, exercício ou competência, exclua este lançamento e crie um novo
            — esses campos compõem a identidade única do registro.
          </p>
        ) : null}
        {duplicateConflict ? (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">
                Já existe um lançamento com essa combinação.
              </p>
              <p className="text-destructive/90">
                {conflictLabel}. Edite o registro existente em vez de criar um novo.
              </p>
              <a
                href={`/lancamentos/${duplicateConflict.id}/editar`}
                className="inline-block font-semibold underline-offset-2 hover:underline"
              >
                Abrir lançamento existente →
              </a>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── FOLHAS DINÂMICAS ──────────────────────────────────────── */}
      <section aria-labelledby="sec-folhas">
        <SectionTitle id="sec-folhas">Folhas de Salários</SectionTitle>

        {/* Folha Base (obrigatória) */}
        {folhasComCalculos[0] && (
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded border-2 border-blue-200 dark:border-blue-800 mb-3">
            <div className="flex justify-between items-center mb-3">
              <Label className="font-bold text-blue-900 dark:text-blue-200">
                {folhasComCalculos[0].nomeTipo || "Folha Base"}
              </Label>
              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                OBRIGATÓRIA
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {/* Col 1: Valor Folha */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor Folha</p>
                <CurrencyInput
                  value={folhasComCalculos[0].valor}
                  onChange={(e) => {
                    const novas = [...folhas];
                    novas[0] = { ...novas[0], valor: e.target.value };
                    setFolhas(novas);
                  }}
                  placeholder="R$ 0,00"
                  className="h-9 tabular-nums"
                />
              </div>

              {/* Col 2: Alíquota (editável, sincronizada) */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Alíquota (%)</p>
                <Input
                  type="number" step="0.01" min="0" max="100"
                  value={aliquota}
                  onChange={(e) => setAliquota(e.target.value)}
                  placeholder="15"
                  className="h-9 tabular-nums text-sm"
                />
              </div>

              {/* Col 3: Valor a Recolher (calculado) */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">A Recolher (auto)</p>
                <div className="h-9 p-2 bg-green-50 dark:bg-green-950/40 rounded border border-green-300 dark:border-green-700 flex items-center font-semibold text-sm text-green-700 dark:text-green-400 tabular-nums">
                  {formatBRL(folhasComCalculos[0].valorARecolher)}
                </div>
              </div>

              {/* Col 4: Valor Recolhido */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor Recolhido</p>
                <CurrencyInput
                  value={folhasComCalculos[0].valorRecolhido}
                  onChange={(e) => {
                    const novas = [...folhas];
                    novas[0] = { ...novas[0], valorRecolhido: e.target.value };
                    setFolhas(novas);
                  }}
                  placeholder="R$ 0,00"
                  className="h-9 tabular-nums"
                />
              </div>
            </div>

            {/* Diferença */}
            <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center gap-2 text-sm">
              <span className="text-gray-700 dark:text-gray-300">Diferença:</span>
              <span className={
                folhasComCalculos[0].diferencaCalc > 0
                  ? "text-red-600 dark:text-red-400 font-bold tabular-nums"
                  : "text-green-600 dark:text-green-400 font-bold tabular-nums"
              }>
                {formatBRL(folhasComCalculos[0].diferencaCalc)}
              </span>
            </div>
          </div>
        )}

        {/* Folhas opcionais (idx >= 1) */}
        {folhasComCalculos.slice(1).map((f, relIdx) => {
          const idx = relIdx + 1;
          return (
            <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-200 dark:border-gray-700 mb-2">
              <div className="flex justify-between items-center mb-2">
                <Label className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {f.nomeTipo}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    setFolhas((prev) => prev.filter((_, i) => i !== idx));
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor Folha</p>
                  <CurrencyInput
                    value={f.valor}
                    onChange={(e) => {
                      const novas = [...folhas];
                      novas[idx] = { ...novas[idx], valor: e.target.value };
                      setFolhas(novas);
                    }}
                    placeholder="R$ 0,00"
                    className="h-9 tabular-nums"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Alíquota</p>
                  <div className="h-9 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center font-semibold text-sm">
                    {aliquotaFolhas}%
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">A Recolher (auto)</p>
                  <div className="h-9 p-2 bg-green-50 dark:bg-green-950/40 rounded border border-green-300 dark:border-green-700 flex items-center font-semibold text-sm text-green-700 dark:text-green-400 tabular-nums">
                    {formatBRL(f.valorARecolher)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valor Recolhido</p>
                  <CurrencyInput
                    value={f.valorRecolhido}
                    onChange={(e) => {
                      const novas = [...folhas];
                      novas[idx] = { ...novas[idx], valorRecolhido: e.target.value };
                      setFolhas(novas);
                    }}
                    placeholder="R$ 0,00"
                    className="h-9 tabular-nums"
                  />
                </div>
              </div>

              <div className="mt-2 p-1.5 bg-gray-100 dark:bg-gray-800/60 rounded flex items-center gap-2 text-xs">
                <span className="text-gray-600 dark:text-gray-400">Diferença:</span>
                <span className={
                  f.diferencaCalc > 0
                    ? "text-red-600 dark:text-red-400 font-bold tabular-nums"
                    : "text-green-600 dark:text-green-400 font-bold tabular-nums"
                }>
                  {formatBRL(f.diferencaCalc)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Botão Adicionar Folha Suplementar */}
        {tiposDisponiveis.length > 0 && (
          <div className="mt-2">
            {showAddFolha ? (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/40 rounded border border-dashed border-gray-300 dark:border-gray-600">
                <span className="text-xs text-gray-600 dark:text-gray-400 w-full mb-1">Selecione o tipo de folha:</span>
                {tiposDisponiveis.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setFolhas((prev) => [
                        ...prev,
                        { tipoFolhaId: t.id, nomeTipo: t.nome, valor: "", valorRecolhido: "" },
                      ]);
                      setShowAddFolha(false);
                    }}
                  >
                    {t.nome}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowAddFolha(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setShowAddFolha(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Folha Suplementar
              </Button>
            )}
          </div>
        )}

        {/* Resumo de folhas */}
        {folhas.length > 0 && (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Resumo das Folhas
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Folha Total</p>
                <p className="font-bold tabular-nums">{formatBRL(resumoFolhas.folhaTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a Recolher</p>
                <p className="font-bold text-green-600 dark:text-green-400 tabular-nums">{formatBRL(resumoFolhas.totalARecolher)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Recolhido</p>
                <p className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatBRL(resumoFolhas.totalRecolhido)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Déficit Total</p>
                <p className={`font-bold tabular-nums ${resumoFolhas.deficitTotal > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                  {formatBRL(resumoFolhas.deficitTotal)}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── VALORES ───────────────────────────────────────────────── */}
      <section aria-labelledby="sec-val">
        <SectionTitle id="sec-val">Valores Legados</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Folha base (R$) *">
            <CurrencyInput
              value={folhaBase}
              onChange={(e) => setFolhaBase(e.target.value)}
              className="h-9 tabular-nums"
              required
            />
          </Field>
          <Field label="Alíquota (%) *">
            <Input
              type="number" step="0.01" min="0" max="100" required
              value={aliquota}
              onChange={(e) => setAliquota(e.target.value)}
              placeholder="15"
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Recolhido (R$) *">
            <CurrencyInput
              value={valorRecolhido}
              onChange={(e) => setValorRecolhido(e.target.value)}
              className="h-9 tabular-nums"
              required
            />
          </Field>
          <Field label="Data do repasse">
            <Input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="h-9"
            />
          </Field>
          <Field label="Qtd. servidores">
            <Input
              type="number" min="0"
              value={quantidadeServidores}
              onChange={(e) => setQuantidadeServidores(e.target.value)}
              placeholder="450"
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Multas (R$)">
            <CurrencyInput
              value={multas}
              onChange={(e) => setMultas(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Juros (R$)">
            <CurrencyInput
              value={juros}
              onChange={(e) => setJuros(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label={`${resultadoAcrescimo?.rótulo || 'Acréscimo'} (R$)`}>
            <div className={`rounded-md border h-9 flex items-center px-3 text-sm ${resultadoAcrescimo?.cor || 'bg-secondary border-border dark:bg-slate-800 dark:border-slate-700'}`}>
              <span className="tabular-nums dark:text-foreground">
                {resultadoAcrescimo?.valorExibicao ?? '0,00'}
              </span>
            </div>
          </Field>
        </div>

        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={parcelado}
            onChange={(e) => setParcelado(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span>Débito parcelado / negociado com o RPPS</span>
        </label>
      </section>

      {/* ── JUSTIFICATIVA DE DIFERENÇA ────────────────── */}
      {isEdit && resultadoAcrescimo?.acrescimo && resultadoAcrescimo.acrescimo < 0 && (
        <JustificativaDiferenca
          acrescimo={resultadoAcrescimo.acrescimo}
          justificativa={justificativaDiferenca}
          aprovada={showAprovado}
          dataAprovacao={dataAprovacao || undefined}
          onAprovar={handleAprovarDiferenca}
          disabled={pending || showAprovado}
        />
      )}

      {/* ── PREVIEW DE LANÇAMENTOS ─────────────────────── */}
      <section aria-labelledby="sec-prev">
        <SectionTitle id="sec-prev">Preview</SectionTitle>
        <div className="flex flex-nowrap gap-1 overflow-x-auto pb-2 -mx-4 px-4">
          {/* Ente */}
          <CalcPill label="Ente" tone="default">
            <span className="text-xs sm:text-sm">
              {orgaos.find((o) => o.id === Number(orgaoId))
                ? `${orgaos.find((o) => o.id === Number(orgaoId))?.sigla} ${orgaos.find((o) => o.id === Number(orgaoId))?.nome}`
                : "-"}
            </span>
          </CalcPill>

          {/* Competência */}
          <CalcPill label="Competência" tone="default">
            <span className="text-xs sm:text-sm">
              {competencias.find((c) => c.id === Number(competenciaId))?.mes
                ? `${competencias.find((c) => c.id === Number(competenciaId))?.mes}/${exercicios.find((e) => e.id === Number(exercicioId))?.ano ?? ""}`
                : "-"}
            </span>
          </CalcPill>

          {/* Tipo */}
          <CalcPill label="Tipo" tone="default">
            <span className="text-xs sm:text-sm">
              {tipo === "PATRONAL" ? "Patronal" : "Segurado"}
            </span>
          </CalcPill>

          {/* A Recolher */}
          <CalcPill label="A Recolher" tone="default">
            <span className="text-xs sm:text-sm">{formatBRL(valorRecolherCalculado)}</span>
          </CalcPill>

          {/* Recolhido */}
          <CalcPill label="Recolhido" tone={currencyToNumber(valorRecolhido) > 0 ? "success" : "default"}>
            <span className="text-xs sm:text-sm">{formatBRL(currencyToNumber(valorRecolhido))}</span>
          </CalcPill>

          {/* Déficit */}
          <CalcPill label="Déficit" tone={preview.deficit > 0 ? "danger" : "default"}>
            <span className="text-xs sm:text-sm">{formatBRL(preview.deficit)}</span>
          </CalcPill>

          {/* Inadimplência */}
          <CalcPill label="Inadimplência" tone={preview.inadimplencia > 0 ? "danger" : "default"}>
            <span className="text-xs sm:text-sm">{formatPercent(preview.inadimplencia)}</span>
          </CalcPill>

          {/* Status */}
          <CalcPill label="Status" tone="default">
            <StatusBadge status={diferenca_aprovada ? "PAGO" : preview.status} />
          </CalcPill>
        </div>
      </section>

      {/* ── FOOTER STICKY ─────────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-2 flex items-center justify-end gap-2 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mb-6 sm:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
          className="h-9"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={pending || Boolean(duplicateConflict)}
          className="h-9"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Salvar alterações" : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
    >
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function CalcPill({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "default" | "danger" | "success" | "warning";
  children: React.ReactNode;
}) {
  const toneClasses = {
    default: "text-foreground",
    danger: "text-destructive",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="flex-shrink-0 rounded-sm border border-border/50 bg-muted/20 px-1.5 py-1 min-w-max">
      <div className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/80 whitespace-nowrap leading-tight">
        {label}
      </div>
      <div className={`text-xs sm:text-sm font-semibold tabular-nums ${toneClasses[tone]}`}>
        {children}
      </div>
    </div>
  );
}
