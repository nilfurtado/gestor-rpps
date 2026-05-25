import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/lib/auth";
import { buildReport, type RelatorioTipo } from "@/lib/reports";
import { ReportDocument } from "@/lib/pdf/report-document";
import { loadRppsWithLogo } from "@/lib/pdf/load-rpps";

const VALID: RelatorioTipo[] = [
  "mensal",
  "anual",
  "orgao",
  "patronal",
  "segurado",
  "inadimplencia",
];

interface Ctx {
  params: Promise<{ tipo: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tipo } = await params;
  if (!VALID.includes(tipo as RelatorioTipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const url = new URL(req.url);
  const filters = {
    exercicioId: url.searchParams.get("exercicioId")
      ? Number(url.searchParams.get("exercicioId"))
      : undefined,
    competenciaId: url.searchParams.get("competenciaId")
      ? Number(url.searchParams.get("competenciaId"))
      : undefined,
    orgaoId: url.searchParams.get("orgaoId")
      ? Number(url.searchParams.get("orgaoId"))
      : undefined,
    tipo: (url.searchParams.get("tipo") as "PATRONAL" | "SEGURADO" | null) || undefined,
    status:
      (url.searchParams.get("status") as
        | "PAGO"
        | "PARCIAL"
        | "INADIMPLENTE"
        | "PARCELADO"
        | null) || undefined,
  };

  const [report, loaded] = await Promise.all([
    buildReport(tipo as RelatorioTipo, filters),
    loadRppsWithLogo(),
  ]);
  const emittedBy = session.user.name ?? session.user.email ?? "—";

  const instance = pdf(
    <ReportDocument
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
      "Content-Disposition": `attachment; filename="${tipo}-${Date.now()}.pdf"`,
    },
  });
}
