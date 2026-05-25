import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { StatusAcordo } from "@prisma/client";
import type { AcordoReportResult } from "@/lib/reports-acordos";
import { formatBRL, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { reportStyles, palette } from "./styles";
import {
  PdfInstitutionalHeader,
  type RppsHeaderInfo,
} from "./institutional-header";
import {
  PdfInstitutionalFooter,
  type RppsFooterInfo,
} from "./institutional-footer";

export type RppsAcordoReportInfo = RppsHeaderInfo & RppsFooterInfo;

interface Props {
  report: AcordoReportResult;
  rpps: RppsAcordoReportInfo | null;
  logoBase64: string | null;
  emittedBy: string;
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StatusAcordo, string> = {
  VIGENTE: "Vigente",
  QUITADO: "Quitado",
  RESCINDIDO: "Rescindido",
  SUSPENSO: "Suspenso",
};

const STATUS_COLOR: Record<StatusAcordo, string> = {
  VIGENTE: palette.primary,
  QUITADO: "#2563eb",
  RESCINDIDO: palette.danger,
  SUSPENSO: "#b45309",
};

function tipoLabel(t: "PATRONAL" | "SEGURADO" | "AMBOS"): string {
  return t === "PATRONAL" ? "Patronal" : t === "SEGURADO" ? "Segurado" : "Ambos";
}

function formaGarantiaLabel(f: string | null): string {
  if (!f) return "—";
  switch (f) {
    case "FPM":
      return "FPM";
    case "CAUC":
      return "CAUC";
    case "RECEITAS_PROPRIAS":
      return "Receitas próprias";
    case "OUTRA":
      return "Outra";
    default:
      return f;
  }
}

// ───────────────────────────────────────────────────────────────
// Document
// ───────────────────────────────────────────────────────────────

export function AcordoReportDocument({ report, rpps, logoBase64, emittedBy }: Props) {
  const generatedAt = formatDateTime(new Date());
  const docTitle =
    rpps?.nomeInstituto?.trim() || "Sistema de Gestão Previdenciária";

  return (
    <Document title={report.titulo} author={docTitle} creator={docTitle}>
      <Page size="A4" orientation="portrait" style={reportStyles.page} wrap>
        <PdfInstitutionalHeader
          rpps={rpps}
          logoBase64={logoBase64}
          reportTitle={report.titulo}
          generatedAt={generatedAt}
        />

        {Object.keys(report.filtros).length > 0 ? (
          <View style={reportStyles.filtersBox}>
            <Text style={reportStyles.filtersTitle}>Filtros aplicados</Text>
            <View style={reportStyles.filterRow}>
              {Object.entries(report.filtros).map(([k, v]) => (
                <Text key={k} style={reportStyles.filterItem}>
                  {k}: <Text style={reportStyles.filterValue}>{v}</Text>
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {renderBody(report)}

        <PdfInstitutionalFooter
          rpps={rpps}
          emittedBy={emittedBy}
          generatedAt={generatedAt}
        />
      </Page>
    </Document>
  );
}

function renderBody(report: AcordoReportResult): React.ReactNode {
  switch (report.tipo) {
    case "geral":
      return <GeralBody report={report} />;
    case "parcelas-pagas":
      return <ParcelasPagasBody report={report} />;
    case "parcelas-em-atraso":
      return <ParcelasAtrasoBody report={report} />;
    case "extrato":
      return <ExtratoBody report={report} />;
    case "demonstrativo-orgao":
      return <DemonstrativoBody report={report} />;
    case "anual":
      return <AnualBody report={report} />;
  }
}

// ───────────────────────────────────────────────────────────────
// 1. Geral
// ───────────────────────────────────────────────────────────────

const COL_GERAL = {
  numero: { width: 38, paddingLeft: 4, paddingRight: 4 },
  orgao: { width: 105, paddingLeft: 4, paddingRight: 4 },
  tipo: { width: 46, paddingLeft: 4, paddingRight: 4 },
  data: { width: 52, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  cons: { width: 72, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  pago: { width: 70, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  pct: { width: 30, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  parc: { width: 40, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  status: { width: 75, paddingLeft: 4, paddingRight: 4 },
};

function GeralBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "geral" }>;
}) {
  return (
    <>
      <View style={reportStyles.table}>
        <View style={reportStyles.th} fixed>
          <Text style={COL_GERAL.numero}>Nº</Text>
          <Text style={COL_GERAL.orgao}>ÓRGÃO</Text>
          <Text style={COL_GERAL.tipo}>TIPO</Text>
          <Text style={COL_GERAL.data}>DATA</Text>
          <Text style={COL_GERAL.cons}>CONSOLIDADO</Text>
          <Text style={COL_GERAL.pago}>PAGO</Text>
          <Text style={COL_GERAL.pct}>%</Text>
          <Text style={COL_GERAL.parc}>PARC.</Text>
          <Text style={COL_GERAL.status}>STATUS</Text>
        </View>
        {report.rows.map((r, i) => (
          <View
            key={i}
            style={
              i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
            }
            wrap={false}
          >
            <Text style={COL_GERAL.numero}>{r.numero}</Text>
            <Text style={COL_GERAL.orgao}>{r.orgaoSigla}</Text>
            <Text style={COL_GERAL.tipo}>{tipoLabel(r.tipoDebito)}</Text>
            <Text style={COL_GERAL.data}>{formatDate(r.dataAcordo)}</Text>
            <Text style={COL_GERAL.cons}>{formatBRL(r.valorConsolidado)}</Text>
            <Text style={COL_GERAL.pago}>{formatBRL(r.valorPago)}</Text>
            <Text style={COL_GERAL.pct}>{r.percentualPago.toFixed(0)}%</Text>
            <Text style={COL_GERAL.parc}>
              {r.parcelasPagas}/{r.numeroParcelas}
            </Text>
            <Text style={[COL_GERAL.status, { color: STATUS_COLOR[r.status] }]}>
              {STATUS_LABEL[r.status]}
            </Text>
          </View>
        ))}
      </View>

      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem label="Acordos" value={String(report.totais.qtd)} />
        <TotalItem label="Consolidado" value={formatBRL(report.totais.consolidado)} />
        <TotalItem label="Pago" value={formatBRL(report.totais.pago)} />
        <TotalItem
          label="Saldo a pagar"
          value={formatBRL(report.totais.saldo)}
          tone="danger"
        />
      </View>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// 2. Parcelas Pagas
// ───────────────────────────────────────────────────────────────

const COL_PP = {
  numero: { width: 44, paddingLeft: 4, paddingRight: 4 },
  orgao: { width: 115, paddingLeft: 4, paddingRight: 4 },
  parc: { width: 52, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  vp: { width: 75, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  pago: { width: 75, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  ult: { width: 55, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  pct: { width: 38, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  status: { width: 75, paddingLeft: 4, paddingRight: 4 },
};

function ParcelasPagasBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "parcelas-pagas" }>;
}) {
  return (
    <>
      <View style={reportStyles.table}>
        <View style={reportStyles.th} fixed>
          <Text style={COL_PP.numero}>Nº</Text>
          <Text style={COL_PP.orgao}>ÓRGÃO</Text>
          <Text style={COL_PP.parc}>PARC.</Text>
          <Text style={COL_PP.vp}>VALOR PARC.</Text>
          <Text style={COL_PP.pago}>TOTAL PAGO</Text>
          <Text style={COL_PP.ult}>ÚLT. PAGA</Text>
          <Text style={COL_PP.pct}>%</Text>
          <Text style={COL_PP.status}>STATUS</Text>
        </View>
        {report.rows.length === 0 ? (
          <View style={reportStyles.tr}>
            <Text
              style={{
                paddingLeft: 4,
                paddingRight: 4,
                color: palette.mute,
                fontStyle: "italic",
              }}
            >
              Nenhum acordo com parcelas pagas para os filtros aplicados.
            </Text>
          </View>
        ) : (
          report.rows.map((r, i) => (
            <View
              key={i}
              style={
                i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
              }
              wrap={false}
            >
              <Text style={COL_PP.numero}>{r.numero}</Text>
              <Text style={COL_PP.orgao}>{r.orgaoSigla}</Text>
              <Text style={COL_PP.parc}>
                {r.parcelasPagas}/{r.numeroParcelas}
              </Text>
              <Text style={COL_PP.vp}>{formatBRL(r.valorParcela)}</Text>
              <Text style={COL_PP.pago}>{formatBRL(r.valorPago)}</Text>
              <Text style={COL_PP.ult}>
                {r.ultimaParcelaData ? formatDate(r.ultimaParcelaData) : "—"}
              </Text>
              <Text style={COL_PP.pct}>{r.percentualConsolidado.toFixed(0)}%</Text>
              <Text style={[COL_PP.status, { color: STATUS_COLOR[r.status] }]}>
                {STATUS_LABEL[r.status]}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem label="Acordos" value={String(report.totais.qtdAcordos)} />
        <TotalItem
          label="Parcelas pagas"
          value={String(report.totais.qtdParcelas)}
        />
        <TotalItem label="Total pago" value={formatBRL(report.totais.totalPago)} />
      </View>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// 3. Parcelas em Atraso
// ───────────────────────────────────────────────────────────────

const COL_PA = {
  numero: { width: 44, paddingLeft: 4, paddingRight: 4 },
  orgao: { width: 118, paddingLeft: 4, paddingRight: 4 },
  esp: { width: 36, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  pag: { width: 36, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  atr: {
    width: 36,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center" as const,
    color: palette.danger,
  },
  vp: { width: 70, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  valor: {
    width: 108,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "right" as const,
    color: palette.danger,
  },
  prox: { width: 75, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
};

function ParcelasAtrasoBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "parcelas-em-atraso" }>;
}) {
  return (
    <>
      <View style={reportStyles.table}>
        <View style={reportStyles.th} fixed>
          <Text style={COL_PA.numero}>Nº</Text>
          <Text style={COL_PA.orgao}>ÓRGÃO</Text>
          <Text style={COL_PA.esp}>ESP.</Text>
          <Text style={COL_PA.pag}>PAG.</Text>
          <Text style={{ ...COL_PA.atr, color: palette.white }}>ATR.</Text>
          <Text style={COL_PA.vp}>VALOR PARC.</Text>
          <Text style={{ ...COL_PA.valor, color: palette.white }}>
            VALOR ATRASADO
          </Text>
          <Text style={COL_PA.prox}>PRÓX. VENC.</Text>
        </View>
        {report.rows.length === 0 ? (
          <View style={reportStyles.tr}>
            <Text
              style={{
                paddingLeft: 4,
                paddingRight: 4,
                color: palette.mute,
                fontStyle: "italic",
              }}
            >
              Nenhum acordo vigente em atraso até a data atual.
            </Text>
          </View>
        ) : (
          report.rows.map((r, i) => (
            <View
              key={i}
              style={
                i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
              }
              wrap={false}
            >
              <Text style={COL_PA.numero}>{r.numero}</Text>
              <Text style={COL_PA.orgao}>{r.orgaoSigla}</Text>
              <Text style={COL_PA.esp}>{r.parcelasEsperadas}</Text>
              <Text style={COL_PA.pag}>{r.parcelasPagas}</Text>
              <Text style={COL_PA.atr}>{r.parcelasAtrasadas}</Text>
              <Text style={COL_PA.vp}>{formatBRL(r.valorParcela)}</Text>
              <Text style={COL_PA.valor}>{formatBRL(r.valorAtrasado)}</Text>
              <Text style={COL_PA.prox}>
                {r.proximoVencimento ? formatDate(r.proximoVencimento) : "—"}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem
          label="Acordos em atraso"
          value={String(report.totais.qtdAcordosAtrasados)}
        />
        <TotalItem
          label="Parcelas em atraso"
          value={String(report.totais.qtdParcelasAtrasadas)}
        />
        <TotalItem
          label="Valor total em atraso"
          value={formatBRL(report.totais.totalAtrasado)}
          tone="danger"
        />
      </View>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// 4. Extrato (1 acordo detalhado)
// ───────────────────────────────────────────────────────────────

const COL_EX_LANC = {
  comp: { width: 145, paddingLeft: 4, paddingRight: 4 },
  ano: { width: 50, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  tipo: { width: 120, paddingLeft: 4, paddingRight: 4 },
  def: {
    width: 216,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "right" as const,
    color: palette.danger,
  },
};

const COL_EX_PARC = {
  n: { width: 40, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  venc: { width: 145, paddingLeft: 4, paddingRight: 4 },
  valor: { width: 200, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  sit: { width: 146, paddingLeft: 4, paddingRight: 4 },
};

function ExtratoBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "extrato" }>;
}) {
  const e = report.extrato;
  return (
    <>
      {/* ── DADOS GERAIS ────────────────────────────────────────── */}
      <SectionTitle>Dados gerais do acordo</SectionTitle>
      <View style={extraStyles.kvGrid}>
        <KVField label="Termo nº" value={e.numero} />
        <KVField label="Data do acordo" value={formatDate(e.dataAcordo)} />
        <KVField
          label="Status"
          value={STATUS_LABEL[e.status]}
          valueColor={STATUS_COLOR[e.status]}
        />
        <KVField label="Tipo de débito" value={tipoLabel(e.tipoDebito)} />
        <KVField
          label="Órgão devedor"
          value={`${e.orgaoSigla} — ${e.orgaoNome}`}
          wide
        />
        <KVField label="Lei autorizativa" value={e.leiAutorizativa ?? "—"} wide />
        <KVField
          label="Garantia"
          value={
            e.formaGarantia
              ? `${formaGarantiaLabel(e.formaGarantia)}${
                  e.garantiaDetalhes ? ` — ${e.garantiaDetalhes}` : ""
                }`
              : "—"
          }
          wide
        />
      </View>

      {/* ── COMPOSIÇÃO FINANCEIRA ──────────────────────────────── */}
      <SectionTitle marginTop={10}>Composição financeira</SectionTitle>
      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem label="Valor original" value={formatBRL(e.valorOriginal)} />
        <TotalItem
          label="Atualização"
          value={formatBRL(e.atualizacaoMonetaria)}
        />
        <TotalItem label="Juros" value={formatBRL(e.jurosAcordo)} />
        <TotalItem label="Multa" value={formatBRL(e.multaAcordo)} />
      </View>
      <View
        style={[reportStyles.totalsBox, { marginTop: 6 }]}
        wrap={false}
      >
        <TotalItem
          label="Consolidado"
          value={formatBRL(e.valorConsolidado)}
          tone="primary"
        />
        <TotalItem label="Pago" value={formatBRL(e.valorPago)} />
        <TotalItem label="Saldo" value={formatBRL(e.saldo)} tone="danger" />
        <TotalItem label="% Pago" value={formatPercent(e.percentualPago)} />
      </View>

      {/* ── PARCELAMENTO ───────────────────────────────────────── */}
      <SectionTitle marginTop={10}>Parcelamento</SectionTitle>
      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem
          label="Parcelas"
          value={`${e.parcelasPagas} / ${e.numeroParcelas}`}
        />
        <TotalItem label="Valor da parcela" value={formatBRL(e.valorParcela)} />
        <TotalItem label="Dia de vencimento" value={String(e.diaVencimento)} />
        <TotalItem
          label="1º vencimento"
          value={formatDate(e.primeiroVencimento)}
        />
      </View>

      {/* ── LANÇAMENTOS VINCULADOS ─────────────────────────────── */}
      <SectionTitle marginTop={10}>
        Lançamentos vinculados ({e.lancamentos.length})
      </SectionTitle>
      <View style={reportStyles.table}>
        <View style={reportStyles.th}>
          <Text style={COL_EX_LANC.comp}>COMPETÊNCIA</Text>
          <Text style={COL_EX_LANC.ano}>ANO</Text>
          <Text style={COL_EX_LANC.tipo}>TIPO</Text>
          <Text style={{ ...COL_EX_LANC.def, color: palette.white }}>
            DÉFICIT
          </Text>
        </View>
        {e.lancamentos.map((l, i) => (
          <View
            key={i}
            style={
              i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
            }
            wrap={false}
          >
            <Text style={COL_EX_LANC.comp}>{l.competencia}</Text>
            <Text style={COL_EX_LANC.ano}>{l.ano}</Text>
            <Text style={COL_EX_LANC.tipo}>
              {l.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
            </Text>
            <Text style={COL_EX_LANC.def}>{formatBRL(l.deficit)}</Text>
          </View>
        ))}
      </View>

      {/* ── CRONOGRAMA DE PARCELAS ─────────────────────────────── */}
      <SectionTitle marginTop={10}>
        Cronograma de parcelas ({e.cronograma.length})
      </SectionTitle>
      <View style={reportStyles.table}>
        <View style={reportStyles.th} fixed>
          <Text style={COL_EX_PARC.n}>Nº</Text>
          <Text style={COL_EX_PARC.venc}>VENCIMENTO</Text>
          <Text style={COL_EX_PARC.valor}>VALOR</Text>
          <Text style={COL_EX_PARC.sit}>SITUAÇÃO</Text>
        </View>
        {e.cronograma.map((p, i) => {
          const sitColor =
            p.situacao === "ATRASADA"
              ? palette.danger
              : p.situacao === "PAGA"
              ? palette.primary
              : palette.mute;
          return (
            <View
              key={i}
              style={
                i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
              }
              wrap={false}
            >
              <Text style={COL_EX_PARC.n}>{p.n}</Text>
              <Text style={COL_EX_PARC.venc}>{formatDate(p.vencimento)}</Text>
              <Text style={COL_EX_PARC.valor}>{formatBRL(p.valor)}</Text>
              <Text style={[COL_EX_PARC.sit, { color: sitColor }]}>
                {p.situacao === "PAGA"
                  ? "Paga"
                  : p.situacao === "ATRASADA"
                  ? "Atrasada"
                  : "Pendente"}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── OBSERVAÇÕES ────────────────────────────────────────── */}
      {e.observacoes ? (
        <View wrap={false} style={{ marginTop: 10 }}>
          <SectionTitle>Observações</SectionTitle>
          <View
            style={{
              backgroundColor: palette.surfaceTint,
              padding: 7,
              borderLeftWidth: 2,
              borderLeftColor: palette.accent,
            }}
          >
            <Text style={{ fontSize: 7, color: palette.text, lineHeight: 1.4 }}>
              {e.observacoes}
            </Text>
          </View>
        </View>
      ) : null}
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// 5. Demonstrativo por órgão
// ───────────────────────────────────────────────────────────────

const COL_DEMO = {
  numero: { width: 60, paddingLeft: 4, paddingRight: 4 },
  tipo: { width: 65, paddingLeft: 4, paddingRight: 4 },
  data: { width: 60, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  cons: { width: 85, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  pago: { width: 85, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  saldo: { width: 85, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  status: { width: 85, paddingLeft: 4, paddingRight: 4 },
};

function DemonstrativoBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "demonstrativo-orgao" }>;
}) {
  return (
    <>
      {report.grupos.map((g, gi) => (
        <View key={gi} style={{ marginBottom: 10 }} wrap={false}>
          <View style={extraStyles.groupHeader}>
            <Text style={extraStyles.groupTitle}>
              {g.orgaoSigla} — {g.orgaoNome}
            </Text>
            <Text style={extraStyles.groupSubtitle}>
              {g.subtotais.qtdAcordos} acordo(s)
            </Text>
          </View>

          <View style={reportStyles.table}>
            <View style={reportStyles.th}>
              <Text style={COL_DEMO.numero}>Nº</Text>
              <Text style={COL_DEMO.tipo}>TIPO</Text>
              <Text style={COL_DEMO.data}>DATA</Text>
              <Text style={COL_DEMO.cons}>CONSOLIDADO</Text>
              <Text style={COL_DEMO.pago}>PAGO</Text>
              <Text style={COL_DEMO.saldo}>SALDO</Text>
              <Text style={COL_DEMO.status}>STATUS</Text>
            </View>
            {g.acordos.map((a, ai) => (
              <View
                key={ai}
                style={
                  ai % 2 === 1
                    ? [reportStyles.tr, reportStyles.trAlt]
                    : reportStyles.tr
                }
                wrap={false}
              >
                <Text style={COL_DEMO.numero}>{a.numero}</Text>
                <Text style={COL_DEMO.tipo}>{tipoLabel(a.tipoDebito)}</Text>
                <Text style={COL_DEMO.data}>{formatDate(a.dataAcordo)}</Text>
                <Text style={COL_DEMO.cons}>{formatBRL(a.valorConsolidado)}</Text>
                <Text style={COL_DEMO.pago}>{formatBRL(a.valorPago)}</Text>
                <Text style={[COL_DEMO.saldo, { color: palette.danger }]}>
                  {formatBRL(a.saldo)}
                </Text>
                <Text style={[COL_DEMO.status, { color: STATUS_COLOR[a.status] }]}>
                  {STATUS_LABEL[a.status]}
                </Text>
              </View>
            ))}
            <View style={extraStyles.subtotalRow}>
              <Text style={COL_DEMO.numero}> </Text>
              <Text
                style={[
                  COL_DEMO.tipo,
                  { fontFamily: "Helvetica-Bold", color: palette.mute },
                ]}
              >
                SUBTOTAL
              </Text>
              <Text style={COL_DEMO.data}> </Text>
              <Text style={[COL_DEMO.cons, { fontFamily: "Helvetica-Bold" }]}>
                {formatBRL(g.subtotais.consolidado)}
              </Text>
              <Text style={[COL_DEMO.pago, { fontFamily: "Helvetica-Bold" }]}>
                {formatBRL(g.subtotais.pago)}
              </Text>
              <Text
                style={[
                  COL_DEMO.saldo,
                  { fontFamily: "Helvetica-Bold", color: palette.danger },
                ]}
              >
                {formatBRL(g.subtotais.saldo)}
              </Text>
              <Text style={COL_DEMO.status}> </Text>
            </View>
          </View>
        </View>
      ))}

      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem label="Órgãos" value={String(report.grupos.length)} />
        <TotalItem
          label="Acordos"
          value={String(report.totaisGerais.qtdAcordos)}
        />
        <TotalItem
          label="Consolidado"
          value={formatBRL(report.totaisGerais.consolidado)}
        />
        <TotalItem
          label="Saldo total"
          value={formatBRL(report.totaisGerais.saldo)}
          tone="danger"
        />
      </View>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// 6. Anual
// ───────────────────────────────────────────────────────────────

const COL_ANUAL = {
  numero: { width: 42, paddingLeft: 4, paddingRight: 4 },
  orgao: { width: 100, paddingLeft: 4, paddingRight: 4 },
  tipo: { width: 50, paddingLeft: 4, paddingRight: 4 },
  data: { width: 58, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  cons: { width: 78, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  pago: { width: 78, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  saldo: { width: 60, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  status: { width: 60, paddingLeft: 4, paddingRight: 4 },
};

function AnualBody({
  report,
}: {
  report: Extract<AcordoReportResult, { tipo: "anual" }>;
}) {
  return (
    <>
      <View style={reportStyles.table}>
        <View style={reportStyles.th} fixed>
          <Text style={COL_ANUAL.numero}>Nº</Text>
          <Text style={COL_ANUAL.orgao}>ÓRGÃO</Text>
          <Text style={COL_ANUAL.tipo}>TIPO</Text>
          <Text style={COL_ANUAL.data}>DATA</Text>
          <Text style={COL_ANUAL.cons}>CONSOLIDADO</Text>
          <Text style={COL_ANUAL.pago}>PAGO</Text>
          <Text style={COL_ANUAL.saldo}>SALDO</Text>
          <Text style={COL_ANUAL.status}>STATUS</Text>
        </View>
        {report.rows.length === 0 ? (
          <View style={reportStyles.tr}>
            <Text
              style={{
                paddingLeft: 4,
                paddingRight: 4,
                color: palette.mute,
                fontStyle: "italic",
              }}
            >
              Nenhum acordo firmado em {report.ano}.
            </Text>
          </View>
        ) : (
          report.rows.map((r, i) => (
            <View
              key={i}
              style={
                i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr
              }
              wrap={false}
            >
              <Text style={COL_ANUAL.numero}>{r.numero}</Text>
              <Text style={COL_ANUAL.orgao}>{r.orgaoSigla}</Text>
              <Text style={COL_ANUAL.tipo}>{tipoLabel(r.tipoDebito)}</Text>
              <Text style={COL_ANUAL.data}>{formatDate(r.dataAcordo)}</Text>
              <Text style={COL_ANUAL.cons}>{formatBRL(r.valorConsolidado)}</Text>
              <Text style={COL_ANUAL.pago}>{formatBRL(r.valorPago)}</Text>
              <Text style={[COL_ANUAL.saldo, { color: palette.danger }]}>
                {formatBRL(r.saldo)}
              </Text>
              <Text style={[COL_ANUAL.status, { color: STATUS_COLOR[r.status] }]}>
                {STATUS_LABEL[r.status]}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={reportStyles.totalsBox} wrap={false}>
        <TotalItem
          label={`Acordos em ${report.ano}`}
          value={String(report.totais.qtd)}
        />
        <TotalItem
          label="Consolidado"
          value={formatBRL(report.totais.consolidado)}
        />
        <TotalItem label="Pago" value={formatBRL(report.totais.pago)} />
        <TotalItem
          label="Saldo"
          value={formatBRL(report.totais.saldo)}
          tone="danger"
        />
      </View>
    </>
  );
}

// ───────────────────────────────────────────────────────────────
// Componentes auxiliares
// ───────────────────────────────────────────────────────────────

function TotalItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "danger" | "primary";
}) {
  const color =
    tone === "danger"
      ? palette.danger
      : tone === "primary"
      ? palette.primary
      : palette.text;
  return (
    <View style={reportStyles.totalItem}>
      <Text style={reportStyles.totalLabel}>{label}</Text>
      <Text style={[reportStyles.totalValue, { color }]}>{value}</Text>
    </View>
  );
}

function SectionTitle({
  children,
  marginTop,
}: {
  children: React.ReactNode;
  marginTop?: number;
}) {
  const style = marginTop
    ? [extraStyles.sectionTitle, { marginTop }]
    : extraStyles.sectionTitle;
  return <Text style={style}>{children}</Text>;
}

function KVField({
  label,
  value,
  valueColor,
  wide,
}: {
  label: string;
  value: string;
  valueColor?: string;
  wide?: boolean;
}) {
  return (
    <View style={[extraStyles.kvField, { width: wide ? "100%" : "33.333%" }]}>
      <Text style={extraStyles.kvLabel}>{label}</Text>
      <Text
        style={[
          extraStyles.kvValue,
          valueColor ? { color: valueColor, fontFamily: "Helvetica-Bold" } : {},
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const extraStyles = {
  sectionTitle: {
    fontSize: 6.5,
    color: palette.mute,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
    marginBottom: 5,
    fontFamily: "Helvetica-Bold",
  },
  kvGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    backgroundColor: palette.surface,
    borderWidth: 0.5,
    borderColor: palette.divider,
    padding: 4,
  },
  kvField: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
  },
  kvLabel: {
    fontSize: 6,
    color: palette.mute,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  kvValue: {
    fontSize: 8,
    color: palette.text,
  },
  groupHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: palette.surfaceTint,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderLeftWidth: 2,
    borderLeftColor: palette.accent,
    marginBottom: 4,
  },
  groupTitle: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    color: palette.primary,
  },
  groupSubtitle: {
    fontSize: 7,
    color: palette.mute,
  },
  subtotalRow: {
    flexDirection: "row" as const,
    backgroundColor: palette.highlight,
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 6.5,
    borderTopWidth: 0.5,
    borderTopColor: palette.divider,
  },
};
