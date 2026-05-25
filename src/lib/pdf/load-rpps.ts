import { prisma } from "@/lib/db";
import type { RppsReportInfo } from "./report-document";

export interface LoadedRpps {
  rpps: RppsReportInfo | null;
  logoBase64: string | null;
  logoBuffer: Buffer | null;
  logoExt: "jpeg" | "png" | null;
}

export async function loadRppsWithLogo(): Promise<LoadedRpps> {
  const rppsRecord = await prisma.institutoRpps.findFirst();

  let logoBase64: string | null = null;
  let logoBuffer: Buffer | null = null;
  let logoExt: "jpeg" | "png" | null = null;

  if (rppsRecord?.logoData) {
    logoBuffer = Buffer.from(rppsRecord.logoData);
    logoBase64 = logoBuffer.toString("base64");
    const mime = rppsRecord.logoMime ?? "image/jpeg";
    logoExt = mime.includes("png") ? "png" : "jpeg";
  }

  const rpps: RppsReportInfo | null = rppsRecord
    ? {
        nomeInstituto: rppsRecord.nomeInstituto,
        nomeDepartamento: rppsRecord.nomeDepartamento,
        cnpj: rppsRecord.cnpj,
        enderecoCompleto: rppsRecord.enderecoCompleto,
        telefone: rppsRecord.telefone,
        email: rppsRecord.email,
        responsavelDepartamento: rppsRecord.responsavelDepartamento,
        nomeResponsavel: rppsRecord.nomeResponsavel,
      }
    : null;

  return { rpps, logoBase64, logoBuffer, logoExt };
}
