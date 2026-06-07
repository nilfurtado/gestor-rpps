import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatBRL, formatDate } from "@/lib/format";
import { reportStyles, palette } from "./styles";
import {
  PdfInstitutionalHeader,
  type RppsHeaderInfo,
} from "./institutional-header";
import {
  PdfInstitutionalFooter,
  type RppsFooterInfo,
} from "./institutional-footer";

export type RppsGuiaInfo = RppsHeaderInfo & RppsFooterInfo;

export interface GuiaContribuicaoData {
  // Órgão
  orgaoNome: string;
  orgaoCnpj: string;
  orgaoEndereco: string;
  orgaoNumero: string;
  orgaoBairro: string;
  orgaoCidade: string;
  orgaoEstado: string;
  orgaoCep: string;

  // Contribuição
  competencia: string; // "Maio/2026"
  dataVencimento: Date;
  baseCálculo: number;
  contribuicaoPatronal: number;
  contribuicaoSegurado: number;
  tipo: "PATRONAL" | "SEGURADO" | "AMBOS";
}

interface Props {
  data: GuiaContribuicaoData;
  rpps: RppsGuiaInfo | null;
  logoBase64: string | null;
  emittedBy: string;
}

export function GuiaContribuicaoDocument({
  data,
  rpps,
  logoBase64,
  emittedBy,
}: Props) {
  const generatedAt = new Date();
  const docTitle = rpps?.nomeInstituto || "SANPREV";

  const enderecoCompleto = [
    data.orgaoEndereco,
    data.orgaoNumero,
    data.orgaoBairro,
    data.orgaoCidade,
    data.orgaoEstado,
    data.orgaoCep,
  ]
    .filter(Boolean)
    .join(", ");

  const totalPagamento =
    (data.tipo === "AMBOS"
      ? data.contribuicaoPatronal + data.contribuicaoSegurado
      : data.tipo === "PATRONAL"
        ? data.contribuicaoPatronal
        : data.contribuicaoSegurado) || 0;

  return (
    <Document title="Guia de Contribuição Previdenciária" author={docTitle}>
      <Page size="A4" orientation="portrait" style={reportStyles.page} wrap>
        <PdfInstitutionalHeader
          rpps={rpps}
          logoBase64={logoBase64}
          reportTitle="GUIA DE RECOLHIMENTO DE CONTRIBUIÇÃO PREVIDENCIÁRIA"
          generatedAt={generatedAt.toLocaleString("pt-BR")}
        />

        {/* Ente Público Pagador */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>ENTE PÚBLICO PAGADOR</Text>
          <View style={infoRow}>
            <View style={infoCol}>
              <Text style={labelStyle}>Razão Social</Text>
              <Text style={valueStyle}>{data.orgaoNome}</Text>
            </View>
          </View>
          <View style={infoRow}>
            <View style={infoCol}>
              <Text style={labelStyle}>CNPJ</Text>
              <Text style={valueStyle}>{data.orgaoCnpj}</Text>
            </View>
          </View>
          <View style={infoRow}>
            <View style={infoCol}>
              <Text style={labelStyle}>Endereço</Text>
              <Text style={valueStyle}>{enderecoCompleto}</Text>
            </View>
          </View>
        </View>

        {/* Dados da Contribuição */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>DADOS DA CONTRIBUIÇÃO</Text>

          <View style={twoColRow}>
            <View style={twoColItem}>
              <Text style={labelStyle}>Competência</Text>
              <Text style={valueStyle}>{data.competencia}</Text>
            </View>
            <View style={twoColItem}>
              <Text style={labelStyle}>Data de Vencimento</Text>
              <Text style={valueStyle}>
                {formatDate(data.dataVencimento)}
              </Text>
            </View>
          </View>

          <View style={infoRow}>
            <View style={infoCol}>
              <Text style={labelStyle}>Base de Cálculo</Text>
              <Text style={valueStyleBold}>
                {formatBRL(data.baseCálculo)}
              </Text>
            </View>
          </View>

          {(data.tipo === "PATRONAL" || data.tipo === "AMBOS") && (
            <View style={infoRow}>
              <View style={infoCol}>
                <Text style={labelStyle}>Contribuição Patronal</Text>
                <Text style={valueStyleBold}>
                  {formatBRL(data.contribuicaoPatronal)}
                </Text>
              </View>
            </View>
          )}

          {(data.tipo === "SEGURADO" || data.tipo === "AMBOS") && (
            <View style={infoRow}>
              <View style={infoCol}>
                <Text style={labelStyle}>Contribuição Segurado</Text>
                <Text style={valueStyleBold}>
                  {formatBRL(data.contribuicaoSegurado)}
                </Text>
              </View>
            </View>
          )}

          <View style={{ ...infoRow, backgroundColor: "#f0f4f8", padding: 10, borderRadius: 4, marginTop: 12 }}>
            <View style={infoCol}>
              <Text style={labelStyle}>Valor para Pagamento</Text>
              <Text style={{ ...valueStyleBold, fontSize: 16, color: "#1a3a52" }}>
                {formatBRL(totalPagamento)}
              </Text>
            </View>
          </View>
        </View>

        {/* Dados para Depósito */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>DADOS PARA DEPÓSITO/TRANSFERÊNCIA</Text>

          <View style={twoColRow}>
            <View style={twoColItem}>
              <Text style={labelStyle}>Banco</Text>
              <Text style={valueStyle}>{rpps?.banco || "—"}</Text>
            </View>
            <View style={twoColItem}>
              <Text style={labelStyle}>Agência</Text>
              <Text style={valueStyle}>{rpps?.agencia || "—"}</Text>
            </View>
          </View>

          <View style={infoRow}>
            <View style={infoCol}>
              <Text style={labelStyle}>Conta Corrente</Text>
              <Text style={valueStyle}>{rpps?.conta || "—"}</Text>
            </View>
          </View>
        </View>

        <PdfInstitutionalFooter
          rpps={rpps}
          emittedBy={emittedBy}
          generatedAt={generatedAt.toLocaleString("pt-BR")}
        />
      </Page>
    </Document>
  );
}

// ───────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────

const sectionStyle = {
  marginBottom: 16,
  paddingLeft: 12,
  paddingRight: 12,
};

const sectionTitle = {
  fontSize: 10,
  fontWeight: "bold" as const,
  marginBottom: 8,
  paddingBottom: 6,
  borderBottomWidth: 1,
  borderBottomColor: palette.border,
  color: palette.primary,
};

const infoRow = {
  marginBottom: 8,
  flexDirection: "row" as const,
  gap: 12,
};

const infoCol = {
  flex: 1,
};

const labelStyle = {
  fontSize: 8,
  color: palette.muted,
  marginBottom: 2,
  fontWeight: "bold" as const,
};

const valueStyle = {
  fontSize: 9,
  color: palette.text,
  lineHeight: 1.2,
};

const valueStyleBold = {
  fontSize: 10,
  color: palette.text,
  fontWeight: "bold" as const,
  lineHeight: 1.2,
};

const twoColRow = {
  flexDirection: "row" as const,
  gap: 12,
  marginBottom: 8,
};

const twoColItem = {
  flex: 1,
};

const totalizerBox = {
  marginVertical: 14,
  paddingHorizontal: 12,
  paddingVertical: 12,
  backgroundColor: palette.primary,
  borderRadius: 4,
  alignItems: "center" as const,
};

const totalizerLabel = {
  fontSize: 9,
  color: "#fff",
  marginBottom: 6,
  fontWeight: "bold" as const,
};

const totalizerValue = {
  fontSize: 20,
  color: "#fff",
  fontWeight: "bold" as const,
};
