import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { reportStyles } from "./styles";

export interface RppsFooterInfo {
  enderecoCompleto: string | null;
  telefone: string | null;
  email: string | null;
  responsavelDepartamento: string | null;
  nomeResponsavel: string | null;
}

interface Props {
  rpps: RppsFooterInfo | null;
  emittedBy: string;
  generatedAt: string;
}

function joinContact(rpps: RppsFooterInfo | null): string {
  if (!rpps) return "";
  const parts: string[] = [];
  if (rpps.enderecoCompleto?.trim()) parts.push(rpps.enderecoCompleto.trim());
  if (rpps.telefone?.trim()) parts.push(`Tel.: ${rpps.telefone.trim()}`);
  return parts.join("  ·  ");
}

export function PdfInstitutionalFooter({
  rpps,
  emittedBy,
  generatedAt,
}: Props) {
  const contactLine = joinContact(rpps);
  const email = rpps?.email?.trim() || "";

  return (
    <View style={reportStyles.footer} fixed>
      <View style={reportStyles.footerDivider} />
      {contactLine.length > 0 && (
        <Text style={[reportStyles.footerText, { textAlign: "center" }]}>
          {contactLine}
        </Text>
      )}
      {email && (
        <Text style={[reportStyles.footerText, { textAlign: "center" }]}>
          Email: {email}
        </Text>
      )}
      <Text style={[reportStyles.footerText, { textAlign: "center" }]}>
        Emitido por {emittedBy} em {generatedAt}
      </Text>
      <Text
        style={[reportStyles.footerText, { textAlign: "center" }]}
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}
