import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ReportResult } from "@/lib/reports";
import { formatBRL, formatPercent, formatDateTime } from "@/lib/format";
import { reportStyles, palette } from "./styles";
import {
  PdfInstitutionalHeader,
  type RppsHeaderInfo,
} from "./institutional-header";
import {
  PdfInstitutionalFooter,
  type RppsFooterInfo,
} from "./institutional-footer";

export type RppsReportInfo = RppsHeaderInfo & RppsFooterInfo;

interface Props {
  report: ReportResult;
  rpps: RppsReportInfo | null;
  logoBase64: string | null;
  emittedBy: string;
}

const COL = {
  orgao: { width: 32, paddingLeft: 4, paddingRight: 4 },
  nome: { width: 138, paddingLeft: 4, paddingRight: 4 },
  tipo: { width: 40, paddingLeft: 4, paddingRight: 4 },
  comp: { width: 62, paddingLeft: 4, paddingRight: 4 },
  ano: { width: 26, paddingLeft: 4, paddingRight: 4, textAlign: "center" as const },
  aliq: { width: 32, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  rec: { width: 64, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  recdo: { width: 64, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const },
  def: { width: 70, paddingLeft: 4, paddingRight: 4, textAlign: "right" as const, color: palette.danger },
};

export function ReportDocument({ report, rpps, logoBase64, emittedBy }: Props) {
  const generatedAt = formatDateTime(new Date());
  const docTitle = rpps?.nomeInstituto?.trim() || "Sistema de Gestão Previdenciária";

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

        <View style={reportStyles.table}>
          <View style={reportStyles.th} fixed>
            <Text style={COL.orgao}>ÓRGÃO</Text>
            <Text style={COL.nome}>DENOMINAÇÃO</Text>
            <Text style={COL.tipo}>TIPO</Text>
            <Text style={COL.comp}>COMPETÊNCIA</Text>
            <Text style={COL.ano}>ANO</Text>
            <Text style={COL.aliq}>ALÍQ.</Text>
            <Text style={COL.rec}>A RECOLHER</Text>
            <Text style={COL.recdo}>RECOLHIDO</Text>
            <Text style={{ ...COL.def, color: palette.white }}>DÉFICIT</Text>
          </View>
          {report.rows.map((r, i) => (
            <View
              key={i}
              style={i % 2 === 1 ? [reportStyles.tr, reportStyles.trAlt] : reportStyles.tr}
              wrap={false}
            >
              <Text style={COL.orgao}>{r.orgaoSigla}</Text>
              <Text style={COL.nome}>{r.orgaoNome}</Text>
              <Text style={COL.tipo}>
                {r.tipo === "PATRONAL" ? "Patronal" : "Segurado"}
              </Text>
              <Text style={COL.comp}>{r.competencia}</Text>
              <Text style={COL.ano}>{r.ano}</Text>
              <Text style={COL.aliq}>{formatPercent(r.aliquota)}</Text>
              <Text style={COL.rec}>{formatBRL(r.valorRecolher)}</Text>
              <Text style={COL.recdo}>{formatBRL(r.valorRecolhido)}</Text>
              <Text style={COL.def}>{formatBRL(r.deficit)}</Text>
            </View>
          ))}
        </View>

        <View style={reportStyles.totalsBox} wrap={false}>
          <View style={reportStyles.totalItem}>
            <Text style={reportStyles.totalLabel}>Total a recolher</Text>
            <Text style={reportStyles.totalValue}>
              {formatBRL(report.totais.valorRecolher)}
            </Text>
          </View>
          <View style={reportStyles.totalItem}>
            <Text style={reportStyles.totalLabel}>Total recolhido</Text>
            <Text style={reportStyles.totalValue}>
              {formatBRL(report.totais.valorRecolhido)}
            </Text>
          </View>
          <View style={reportStyles.totalItem}>
            <Text style={reportStyles.totalLabel}>Déficit total</Text>
            <Text style={[reportStyles.totalValue, { color: palette.danger }]}>
              {formatBRL(report.totais.deficit)}
            </Text>
          </View>
          <View style={reportStyles.totalItem}>
            <Text style={reportStyles.totalLabel}>Inadimplência média</Text>
            <Text style={reportStyles.totalValue}>
              {formatPercent(report.totais.inadimplenciaMedia)}
            </Text>
          </View>
        </View>

        <PdfInstitutionalFooter
          rpps={rpps}
          emittedBy={emittedBy}
          generatedAt={generatedAt}
        />
      </Page>
    </Document>
  );
}
