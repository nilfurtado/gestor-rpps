"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
// (valorOriginal é editável; auto-sugere a soma dos déficits, mas o usuário pode digitar manualmente)
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import type { TipoDebitoAcordo, FormaGarantia, StatusAcordo } from "@prisma/client";
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
import { formatBRL } from "@/lib/format";

const NONE = "__none__";

export interface AcordoInitial {
  id: number;
  numero: string;
  dataAcordo: string;
  orgaoId: number;
  tipoDebito: TipoDebitoAcordo;
  valorOriginal: number;
  atualizacaoMonetaria: number;
  jurosAcordo: number;
  multaAcordo: number;
  valorConsolidado: number;
  numeroParcelas: number;
  valorParcela: number;
  diaVencimento: number;
  primeiroVencimento: string;
  parcelasPagas: number;
  valorPago: number;
  status: StatusAcordo;
  formaGarantia: FormaGarantia | null;
  garantiaDetalhes: string | null;
  leiAutorizativa: string | null;
  observacoes: string | null;
  lancamentos: {
    id: number;
    tipo: "PATRONAL" | "SEGURADO";
    competencia: { mes: string; ordem: number };
    exercicio: { ano: number };
    deficit: number;
  }[];
}

interface EligibleLancamento {
  id: number;
  tipo: "PATRONAL" | "SEGURADO";
  competencia: { id: number; mes: string; ordem: number };
  exercicio: { id: number; ano: number; status: string };
  deficit: number;
  status: string;
  parcelado: boolean;
}

interface Props {
  orgaos: { id: number; sigla: string; nome: string }[];
  initial?: AcordoInitial;
}

export function AcordoForm({ orgaos, initial }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isEdit = Boolean(initial);

  // Identificação
  const [numero, setNumero] = useState(initial?.numero ?? "");
  const [dataAcordo, setDataAcordo] = useState(
    initial ? initial.dataAcordo.slice(0, 10) : ""
  );
  const [orgaoId, setOrgaoId] = useState(initial ? String(initial.orgaoId) : "");
  const [leiAutorizativa, setLeiAutorizativa] = useState(initial?.leiAutorizativa ?? "");

  // Débitos
  const [tipoDebito, setTipoDebito] = useState<TipoDebitoAcordo>(
    initial?.tipoDebito ?? "PATRONAL"
  );
  const [eligible, setEligible] = useState<EligibleLancamento[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(initial?.lancamentos.map((l) => l.id) ?? [])
  );

  // Composição
  const [atualizacaoMonetaria, setAtualizacaoMonetaria] = useState(
    initial ? String(initial.atualizacaoMonetaria) : "0"
  );
  const [jurosAcordo, setJurosAcordo] = useState(
    initial ? String(initial.jurosAcordo) : "0"
  );
  const [multaAcordo, setMultaAcordo] = useState(
    initial ? String(initial.multaAcordo) : "0"
  );

  // Parcelamento
  const [numeroParcelas, setNumeroParcelas] = useState(
    initial ? String(initial.numeroParcelas) : "12"
  );
  const [valorParcela, setValorParcela] = useState(
    initial ? String(initial.valorParcela) : ""
  );
  const [diaVencimento, setDiaVencimento] = useState(
    initial ? String(initial.diaVencimento) : "10"
  );
  const [primeiroVencimento, setPrimeiroVencimento] = useState(
    initial ? initial.primeiroVencimento.slice(0, 10) : ""
  );

  // Garantia / observações
  const [formaGarantia, setFormaGarantia] = useState<string>(
    initial?.formaGarantia ?? NONE
  );
  const [garantiaDetalhes, setGarantiaDetalhes] = useState(initial?.garantiaDetalhes ?? "");
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? "");

  // Acompanhamento (edição)
  const [status, setStatus] = useState<StatusAcordo>(initial?.status ?? "VIGENTE");
  const [parcelasPagas, setParcelasPagas] = useState(
    initial ? String(initial.parcelasPagas) : "0"
  );
  const [valorPago, setValorPago] = useState(initial ? String(initial.valorPago) : "0");

  // Busca lançamentos elegíveis quando órgão+tipo mudarem (somente criação)
  useEffect(() => {
    if (isEdit) return;
    if (!orgaoId) {
      setEligible([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEligible(true);
      try {
        const params = new URLSearchParams({ orgaoId });
        if (tipoDebito === "PATRONAL" || tipoDebito === "SEGURADO") {
          params.set("tipo", tipoDebito);
        }
        const res = await fetch(`/api/lancamentos?${params}`);
        if (!res.ok) throw new Error("Falha ao buscar lançamentos");
        const data: EligibleLancamento[] = await res.json();
        const elig = data.filter(
          (l) => !l.parcelado && (l.status === "INADIMPLENTE" || l.status === "PARCIAL")
        );
        if (!cancelled) {
          setEligible(elig);
          setSelectedIds(new Set());
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setEligible([]);
      } finally {
        if (!cancelled) setLoadingEligible(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, orgaoId, tipoDebito]);

  // Valor original — editável. Auto-sugere a soma dos déficits dos lançamentos selecionados,
  // mas o usuário pode digitar qualquer valor (override desativa o auto-sync).
  const [valorOriginalInput, setValorOriginalInput] = useState<string>(
    initial ? String(initial.valorOriginal) : "0"
  );
  const [valorOriginalAutoSync, setValorOriginalAutoSync] = useState(!isEdit);

  const valorOriginalSugerido = useMemo(() => {
    return eligible
      .filter((l) => selectedIds.has(l.id))
      .reduce((s, l) => s + Number(l.deficit), 0);
  }, [eligible, selectedIds]);

  // Auto-sync valorOriginal com a soma das seleções, enquanto o usuário não editar manualmente
  useEffect(() => {
    if (!valorOriginalAutoSync) return;
    setValorOriginalInput(valorOriginalSugerido.toFixed(2));
  }, [valorOriginalAutoSync, valorOriginalSugerido]);

  const valorOriginal = Number(valorOriginalInput) || 0;
  const sugestaoDiferente =
    !isEdit &&
    selectedIds.size > 0 &&
    Math.abs(valorOriginalSugerido - valorOriginal) > 0.01;

  const valorConsolidado = useMemo(() => {
    return (
      valorOriginal +
      (Number(atualizacaoMonetaria) || 0) +
      (Number(jurosAcordo) || 0) +
      (Number(multaAcordo) || 0)
    );
  }, [valorOriginal, atualizacaoMonetaria, jurosAcordo, multaAcordo]);

  // Sugere valor da parcela quando consolidado/parcelas mudarem (somente se ainda não foi editado manualmente)
  const [parcelaAutoSync, setParcelaAutoSync] = useState(!isEdit);
  useEffect(() => {
    if (!parcelaAutoSync) return;
    const n = Number(numeroParcelas);
    if (n > 0 && valorConsolidado > 0) {
      setValorParcela((valorConsolidado / n).toFixed(2));
    }
  }, [parcelaAutoSync, valorConsolidado, numeroParcelas]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgaoId || !numero || !dataAcordo || !primeiroVencimento) {
      toast.error("Preencha número, órgão, data do acordo e 1º vencimento.");
      return;
    }
    if (!isEdit && selectedIds.size === 0) {
      toast.error("Selecione ao menos um lançamento para vincular.");
      return;
    }
    start(async () => {
      try {
        const basePayload = {
          numero: numero.trim(),
          dataAcordo,
          orgaoId: Number(orgaoId),
          tipoDebito,
          valorOriginal,
          atualizacaoMonetaria: Number(atualizacaoMonetaria) || 0,
          jurosAcordo: Number(jurosAcordo) || 0,
          multaAcordo: Number(multaAcordo) || 0,
          numeroParcelas: Number(numeroParcelas),
          valorParcela: Number(valorParcela),
          diaVencimento: Number(diaVencimento),
          primeiroVencimento,
          formaGarantia: formaGarantia === NONE ? null : formaGarantia,
          garantiaDetalhes: garantiaDetalhes || null,
          leiAutorizativa: leiAutorizativa || null,
          observacoes: observacoes || null,
        };

        const url = isEdit ? `/api/acordos/${initial!.id}` : "/api/acordos";
        const method = isEdit ? "PATCH" : "POST";
        const payload = isEdit
          ? {
              ...basePayload,
              status,
              parcelasPagas: Number(parcelasPagas) || 0,
              valorPago: Number(valorPago) || 0,
            }
          : { ...basePayload, lancamentoIds: Array.from(selectedIds) };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Falha ao salvar");
        }
        toast.success(isEdit ? "Acordo atualizado." : "Acordo registrado.");
        router.push("/acordos");
        router.refresh();
      } catch (err) {
        toast.error("Erro ao salvar.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  const consolidadoMatchesParcelas = useMemo(() => {
    const n = Number(numeroParcelas);
    const vp = Number(valorParcela);
    if (n <= 0 || vp <= 0) return true;
    const total = n * vp;
    return Math.abs(total - valorConsolidado) < 1;
  }, [numeroParcelas, valorParcela, valorConsolidado]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── 1. Informações do Órgão e Acordo ──────────────────────── */}
      <section aria-labelledby="sec-ident">
        <SectionTitle id="sec-ident">Informações do órgão e acordo</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Órgão devedor *">
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
          <Field label="Número do termo *">
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="ex.: 001/2026"
              required
              className="h-9"
            />
          </Field>
          <Field label="Data do acordo *">
            <Input
              type="date"
              value={dataAcordo}
              onChange={(e) => setDataAcordo(e.target.value)}
              required
              className="h-9"
            />
          </Field>
          <Field label="Lei autorizativa">
            <Input
              value={leiAutorizativa}
              onChange={(e) => setLeiAutorizativa(e.target.value)}
              placeholder="ex.: Lei Municipal 123/2026"
              className="h-9"
            />
          </Field>
        </div>
        {isEdit ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Órgão, tipo de débito e lançamentos vinculados ficam bloqueados na edição. Para mudá-los, exclua e crie um novo acordo.
          </p>
        ) : null}
      </section>

      {/* ── 2. Débitos a parcelar ─────────────────────────────────── */}
      <section aria-labelledby="sec-deb">
        <SectionTitle id="sec-deb">Débitos a parcelar</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Tipo do débito *">
            <Select
              value={tipoDebito}
              onValueChange={(v) => setTipoDebito(v as TipoDebitoAcordo)}
              disabled={isEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PATRONAL">Patronal</SelectItem>
                <SelectItem value="SEGURADO">Segurado</SelectItem>
                <SelectItem value="AMBOS">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {isEdit ? (
          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lançamentos vinculados ({initial?.lancamentos.length ?? 0})
            </div>
            <ul className="space-y-1 text-sm">
              {initial?.lancamentos.map((l) => (
                <li key={l.id} className="flex items-center justify-between">
                  <span>
                    {l.competencia.mes}/{l.exercicio.ano} ·{" "}
                    <span className="text-muted-foreground">
                      {l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
                    </span>
                  </span>
                  <span className="tabular-nums">{formatBRL(l.deficit)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : !orgaoId ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Selecione o órgão devedor para listar os lançamentos elegíveis.
          </p>
        ) : loadingEligible ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando lançamentos...
          </p>
        ) : eligible.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum lançamento inadimplente ou parcial disponível para este órgão/tipo.
          </p>
        ) : (
          <div className="mt-3 max-h-72 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos"
                      checked={
                        eligible.length > 0 && selectedIds.size === eligible.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(new Set(eligible.map((l) => l.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Competência</th>
                  <th className="px-3 py-2 text-left">Ano</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Déficit</th>
                </tr>
              </thead>
              <tbody>
                {eligible.map((l) => {
                  const checked = selectedIds.has(l.id);
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(l.id)) next.delete(l.id);
                              else next.add(l.id);
                              return next;
                            });
                          }}
                          aria-label={`Selecionar ${l.competencia.mes}/${l.exercicio.ano}`}
                        />
                      </td>
                      <td className="px-3 py-1.5">{l.competencia.mes}</td>
                      <td className="px-3 py-1.5 tabular-nums">{l.exercicio.ano}</td>
                      <td className="px-3 py-1.5">
                        {l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground">
                        {l.status}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {formatBRL(l.deficit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 3. Composição do valor consolidado ────────────────────── */}
      <section aria-labelledby="sec-comp">
        <SectionTitle id="sec-comp">Composição do valor consolidado</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Valor original (R$) *">
            <Input
              type="number"
              step="0.01"
              min="0"
              required
              value={valorOriginalInput}
              onChange={(e) => {
                setValorOriginalAutoSync(false);
                setValorOriginalInput(e.target.value);
              }}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Atualização monetária (R$)">
            <Input
              type="number" step="0.01" min="0"
              value={atualizacaoMonetaria}
              onChange={(e) => setAtualizacaoMonetaria(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Juros (R$)">
            <Input
              type="number" step="0.01" min="0"
              value={jurosAcordo}
              onChange={(e) => setJurosAcordo(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Multa (R$)">
            <Input
              type="number" step="0.01" min="0"
              value={multaAcordo}
              onChange={(e) => setMultaAcordo(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <ReadOnlyField label="Consolidado" highlight>
            {formatBRL(valorConsolidado)}
          </ReadOnlyField>
        </div>
        {!isEdit && selectedIds.size > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Soma dos déficits selecionados:{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatBRL(valorOriginalSugerido)}
              </span>
            </span>
            {sugestaoDiferente ? (
              <button
                type="button"
                onClick={() => {
                  setValorOriginalAutoSync(true);
                  setValorOriginalInput(valorOriginalSugerido.toFixed(2));
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Usar valor sugerido
              </button>
            ) : (
              <span className="text-xs text-primary">✓ sincronizado</span>
            )}
          </div>
        ) : null}
      </section>

      {/* ── 4. Parcelamento ───────────────────────────────────────── */}
      <section aria-labelledby="sec-parc">
        <SectionTitle id="sec-parc">Parcelamento</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Nº de parcelas *">
            <Input
              type="number" min="1" max="240" required
              value={numeroParcelas}
              onChange={(e) => setNumeroParcelas(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Valor da parcela (R$) *">
            <Input
              type="number" step="0.01" min="0.01" required
              value={valorParcela}
              onChange={(e) => {
                setParcelaAutoSync(false);
                setValorParcela(e.target.value);
              }}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="Dia do vencimento *">
            <Input
              type="number" min="1" max="31" required
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
              className="h-9 tabular-nums"
            />
          </Field>
          <Field label="1º vencimento *">
            <Input
              type="date"
              value={primeiroVencimento}
              onChange={(e) => setPrimeiroVencimento(e.target.value)}
              required
              className="h-9"
            />
          </Field>
        </div>
        {!consolidadoMatchesParcelas ? (
          <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-amber-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
            Atenção: nº de parcelas × valor da parcela ={" "}
            {formatBRL(Number(numeroParcelas) * Number(valorParcela))} difere do consolidado
            ({formatBRL(valorConsolidado)}).
          </p>
        ) : null}
      </section>

      {/* ── 5. Garantia ───────────────────────────────────────────── */}
      <section aria-labelledby="sec-gar">
        <SectionTitle id="sec-gar">Garantia</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Forma de garantia">
            <Select value={formaGarantia} onValueChange={setFormaGarantia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhuma</SelectItem>
                <SelectItem value="FPM">FPM — Fundo de Participação</SelectItem>
                <SelectItem value="CAUC">CAUC — Habilitação</SelectItem>
                <SelectItem value="RECEITAS_PROPRIAS">Receitas próprias</SelectItem>
                <SelectItem value="OUTRA">Outra</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Detalhes da garantia">
            <Input
              value={garantiaDetalhes}
              onChange={(e) => setGarantiaDetalhes(e.target.value)}
              maxLength={500}
              placeholder="opcional"
              className="h-9"
            />
          </Field>
        </div>
      </section>

      {/* ── 6. Observações ────────────────────────────────────────── */}
      <section aria-labelledby="sec-obs">
        <SectionTitle id="sec-obs">Observações</SectionTitle>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Anotações internas sobre o acordo (opcional)"
        />
      </section>

      {/* ── 7. Acompanhamento (somente edição) ────────────────────── */}
      {isEdit ? (
        <section aria-labelledby="sec-acc">
          <SectionTitle id="sec-acc">Acompanhamento</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Status do acordo">
              <Select value={status} onValueChange={(v) => setStatus(v as StatusAcordo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIGENTE">Vigente</SelectItem>
                  <SelectItem value="QUITADO">Quitado</SelectItem>
                  <SelectItem value="RESCINDIDO">Rescindido</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Parcelas pagas">
              <Input
                type="number" min="0" max={Number(numeroParcelas) || 240}
                value={parcelasPagas}
                onChange={(e) => setParcelasPagas(e.target.value)}
                className="h-9 tabular-nums"
              />
            </Field>
            <Field label="Valor pago (R$)">
              <Input
                type="number" step="0.01" min="0"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="h-9 tabular-nums"
              />
            </Field>
          </div>
        </section>
      ) : null}

      {/* Footer */}
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
        <Button type="submit" disabled={pending} className="h-9">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? "Salvar alterações" : "Salvar acordo"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div
        className={
          "flex h-9 items-center rounded-md border border-input px-3 text-sm tabular-nums " +
          (highlight
            ? "border-primary/60 bg-primary/10 font-semibold text-primary"
            : "bg-muted/40 text-foreground")
        }
      >
        {children}
      </div>
    </div>
  );
}
