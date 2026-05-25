import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/lib/auth";
import {
  buildAcordoReport,
  type AcordoRelatorioTipo,
  type AcordoReportFilters,
} from "@/lib/reports-acordos";
import { AcordoReportDocument } from "@/lib/pdf/acordo-report-document";
import { loadRppsWithLogo } from "@/lib/pdf/load-rpps";

const VALID: AcordoRelatorioTipo[] = [
  "geral",
  "parcelas-pagas",
  "parcelas-em-atraso",
  "extrato",
  "demonstrativo-orgao",
  "anual",
];

interface Ctx {
  params: Promise<{ tipo: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tipo } = await params;
  if (!VALID.includes(tipo as AcordoRelatorioTipo)) {
    return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const filters: AcordoReportFilters = {
    acordoId: url.searchParams.get("acordoId")
      ? Number(url.searchParams.get("acordoId"))
      : undefined,
    orgaoId: url.searchParams.get("orgaoId")
      ? Number(url.searchParams.get("orgaoId"))
      : undefined,
    competenciaId: url.searchParams.get("competenciaId")
      ? Number(url.searchParams.get("competenciaId"))
      : undefined,
    ano: url.searchParams.get("ano")
      ? Number(url.searchParams.get("ano"))
      : undefined,
    status:
      (url.searchParams.get("status") as
        | "VIGENTE"
        | "QUITADO"
        | "RESCINDIDO"
        | "SUSPENSO"
        | null) || undefined,
    tipoDebito:
      (url.searchParams.get("tipoDebito") as
        | "PATRONAL"
        | "SEGURADO"
        | "AMBOS"
        | null) || undefined,
    dataInicio: url.searchParams.get("dataInicio")
      ? new Date(url.searchParams.get("dataInicio")!)
      : undefined,
    dataFim: url.searchParams.get("dataFim")
      ? new Date(url.searchParams.get("dataFim")!)
      : undefined,
  };

  let report;
  try {
    report = await buildAcordoReport(tipo as AcordoRelatorioTipo, filters);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao gerar relatório" },
      { status: 400 }
    );
  }

  const loaded = await loadRppsWithLogo();
  const emittedBy = session.user.name ?? session.user.email ?? "—";

  const instance = pdf(
    <AcordoReportDocument
      report={report}
      rpps={loaded.rpps}
      logoBase64={loaded.logoBase64}
      emittedBy={emittedBy}
    />
  );
  const blob = await instance.toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="acordo-${tipo}-${Date.now()}.pdf"`,
    },
  });
}
