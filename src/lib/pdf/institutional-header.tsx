import React from "react";
import { Text, View, Image as PdfImage } from "@react-pdf/renderer";
import { reportStyles } from "./styles";

export interface RppsHeaderInfo {
  nomeInstituto: string | null;
  nomeDepartamento: string | null;
  cnpj: string | null;
}

interface Props {
  rpps: RppsHeaderInfo | null;
  logoBase64: string | null;
  reportTitle: string;
  generatedAt: string;
}

export function PdfInstitutionalHeader({
  rpps,
  logoBase64,
  reportTitle,
  generatedAt,
}: Props) {
  const nome = rpps?.nomeInstituto?.trim() || "Instituto não configurado";
  const dept = rpps?.nomeDepartamento?.trim() || null;
  const cnpj = rpps?.cnpj?.trim() || null;

  return (
    <View style={reportStyles.header} fixed>
      <View style={reportStyles.headerLeft}>
        {logoBase64 ? (
          <PdfImage
            src={`data:image/jpeg;base64,${logoBase64}`}
            style={reportStyles.headerLogo}
          />
        ) : (
          <View style={reportStyles.headerBadge} />
        )}
        <View>
          <Text style={reportStyles.headerInstitution}>{nome}</Text>
          {dept ? <Text style={reportStyles.headerDept}>{dept}</Text> : null}
          {cnpj ? <Text style={reportStyles.headerCnpj}>CNPJ: {cnpj}</Text> : null}
        </View>
      </View>
      <View style={reportStyles.headerRight}>
        <Text style={reportStyles.headerReportTitle}>{reportTitle}</Text>
        <Text style={reportStyles.headerEmittedAt}>Emitido em {generatedAt}</Text>
        <Text
          style={reportStyles.headerPage}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
    </View>
  );
}
