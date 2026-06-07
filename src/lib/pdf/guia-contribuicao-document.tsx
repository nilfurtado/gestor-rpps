import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { formatBRL, formatDate } from "@/lib/format";
import { generateBarcodeNumber } from "@/lib/barcode-generator";
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
  orgaoNome: string;
  orgaoCnpj: string;
  orgaoEndereco: string;
  orgaoNumero: string;
  orgaoBairro: string;
  orgaoCidade: string;
  orgaoEstado: string;
  orgaoCep: string;
  competencia: string;
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
      <Page size="A4" orientation="portrait" style={reportStyles.page}>
        {/* Header */}
        <PdfInstitutionalHeader
          rpps={rpps}
          logoBase64={logoBase64}
          reportTitle=""
          generatedAt={generatedAt.toLocaleString("pt-BR")}
        />

        {/* Título Centralizado */}
        <Text style={{ textAlign: "center", fontSize: 11, fontWeight: "bold", color: "#1a3a52", marginBottom: 6, paddingLeft: 12, paddingRight: 12 }}>
          GUIA DE RECOLHIMENTO DE CONTRIBUIÇÃO PREVIDENCIÁRIA
        </Text>

        {/* Linha divisória */}
        <View style={{ height: 1, backgroundColor: "#ddd", marginBottom: 8 }} />

        {/* Info Guia com Labels em Negrito */}
        <View style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 6 }}>
          <Text style={{ fontSize: 9, color: "#333", marginBottom: 3 }}>
            <Text style={{ fontWeight: "bold" }}>ENTE MUNICIPAL:</Text> {data.orgaoNome}
          </Text>
          <Text style={{ fontSize: 9, color: "#333" }}>
            <Text style={{ fontWeight: "bold" }}>COMPETÊNCIA:</Text> {data.competencia} | <Text style={{ fontWeight: "bold" }}>TIPO:</Text> {data.tipo === "AMBOS" ? "Patronal e Segurado" : data.tipo}
          </Text>
        </View>

        {/* 2 Colunas: Ente + Dados */}
        <View style={{ flexDirection: "row", gap: 12, paddingLeft: 12, paddingRight: 12, marginBottom: 8 }}>
          {/* Coluna 1: Ente Pagador */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a3a52", marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 2 }}>
              ENTE PAGADOR
            </Text>
            <Text style={{ fontSize: 8, color: "#666", marginBottom: 1 }}>
              <Text style={{ fontWeight: "bold" }}>Razão Social:</Text> {data.orgaoNome}
            </Text>
            <Text style={{ fontSize: 8, color: "#666", marginBottom: 1 }}>
              <Text style={{ fontWeight: "bold" }}>CNPJ:</Text> {data.orgaoCnpj}
            </Text>
            <Text style={{ fontSize: 8, color: "#666" }}>
              <Text style={{ fontWeight: "bold" }}>Endereço:</Text> {enderecoCompleto}
            </Text>
          </View>

          {/* Coluna 2: Contribuição */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a3a52", marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 2 }}>
              CONTRIBUIÇÃO
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#666", marginBottom: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>Vencimento:</Text>
                </Text>
                <Text style={{ fontSize: 8, color: "#333" }}>{formatDate(data.dataVencimento)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, color: "#666", marginBottom: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>Base Cálculo:</Text>
                </Text>
                <Text style={{ fontSize: 8, color: "#333", fontWeight: "bold" }}>{formatBRL(data.baseCálculo)}</Text>
              </View>
            </View>
            {data.tipo === "AMBOS" ? (
              <>
                <Text style={{ fontSize: 8, color: "#666", marginBottom: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>Patronal:</Text> {formatBRL(data.contribuicaoPatronal)}
                </Text>
                <Text style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>
                  <Text style={{ fontWeight: "bold" }}>Segurado:</Text> {formatBRL(data.contribuicaoSegurado)}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>
                <Text style={{ fontWeight: "bold" }}>
                  {data.tipo === "PATRONAL" ? "Patronal:" : "Segurado:"}
                </Text>{" "}
                {formatBRL(data.tipo === "PATRONAL" ? data.contribuicaoPatronal : data.contribuicaoSegurado)}
              </Text>
            )}
          </View>
        </View>

        {/* Valor para Pagamento (Destaque) */}
        <View style={{ backgroundColor: "#f0f4f8", marginLeft: 12, marginRight: 12, marginBottom: 8, padding: 8, borderRadius: 3, borderLeftWidth: 4, borderLeftColor: "#1a3a52" }}>
          <Text style={{ fontSize: 8, color: "#666", marginBottom: 2 }}>Valor para Pagamento</Text>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1a3a52" }}>
            {formatBRL(totalPagamento)}
          </Text>
        </View>

        {/* Depósito + Código de Barras */}
        <View style={{ paddingLeft: 12, paddingRight: 12, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
            {/* Depósito */}
            <View style={{ flex: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#1a3a52", marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 2 }}>
                DEPÓSITO/TRANSFERÊNCIA
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 3 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, color: "#666", fontWeight: "bold" }}>Banco</Text>
                  <Text style={{ fontSize: 8, color: "#333" }}>{rpps?.banco || "—"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 7, color: "#666", fontWeight: "bold" }}>Agência</Text>
                  <Text style={{ fontSize: 8, color: "#333" }}>{rpps?.agencia || "—"}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 7, color: "#666", fontWeight: "bold", marginBottom: 1 }}>Conta</Text>
              <Text style={{ fontSize: 8, color: "#333" }}>{rpps?.conta || "—"}</Text>
            </View>

            {/* QR Code */}
            <View style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 3, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 7, color: "#999", textAlign: "center" }}>
                [QR CODE]{"\n"}Escaneie{"\n"}para pagar
              </Text>
            </View>
          </View>

          {/* Código de Barras */}
          <View style={{ backgroundColor: "#fff", padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 3 }}>
            <Text style={{ fontSize: 7, color: "#666", fontWeight: "bold", marginBottom: 4 }}>CÓDIGO DE BARRAS PARA PAGAMENTO</Text>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#333", fontFamily: "Courier", letterSpacing: 1, textAlign: "center" }}>
              {generateBarcodeNumber({
                orgaoCnpj: data.orgaoCnpj,
                dataVencimento: data.dataVencimento,
                totalPagamento,
              })}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <PdfInstitutionalFooter
          rpps={rpps}
          emittedBy={emittedBy}
          generatedAt={generatedAt.toLocaleString("pt-BR")}
        />
      </Page>
    </Document>
  );
}

