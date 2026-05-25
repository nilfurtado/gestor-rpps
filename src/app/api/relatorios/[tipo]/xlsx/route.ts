import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { buildReport, type RelatorioTipo } from "@/lib/reports";
import { loadRppsWithLogo } from "@/lib/pdf/load-rpps";
import { applyInstitutionalHeader } from "@/lib/xlsx/institutional-header";

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

  const wb = new ExcelJS.Workbook();
  wb.creator = loaded.rpps?.nomeInstituto ?? "Sistema RPPS";
  wb.created = new Date();
  const ws = wb.addWorksheet(report.titulo, {
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
  });

  ws.columns = [
    { width: 12 },
    { width: 38 },
    { width: 11 },
    { width: 18 },
    { width: 8 },
    { width: 12 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
  ];

  let row = applyInstitutionalHeader(wb, ws, loaded, report);

  if (Object.keys(report.filtros).length > 0) {
    ws.getCell(`A${row}`).value = "Filtros aplicados:";
    ws.getCell(`A${row}`).font = { bold: true };
    row++;
    for (const [k, v] of Object.entries(report.filtros)) {
      ws.getCell(`A${row}`).value = `${k}: ${v}`;
      row++;
    }
    row++;
  }

  const headerRow = ws.getRow(row);
  const headers = [
    "Órgão",
    "Nome",
    "Tipo",
    "Competência",
    "Ano",
    "Alíquota (%)",
    "A recolher",
    "Recolhido",
    "Déficit",
    "Inadimpl. (%)",
    "Status",
  ];
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F5132" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
      bottom: { style: "thin" },
    };
  });
  ws.getRow(row).height = 22;
  row++;

  for (const r of report.rows) {
    const tipoLabel = r.tipo === "PATRONAL" ? "Patronal" : "Segurado";
    const statusLabel = {
      PAGO: "Pago",
      PARCIAL: "Parcial",
      INADIMPLENTE: "Inadimplente",
      PARCELADO: "Parcelado",
    }[r.status];
    const rowRef = ws.getRow(row);
    rowRef.values = [
      r.orgaoSigla,
      r.orgaoNome,
      tipoLabel,
      r.competencia,
      r.ano,
      r.aliquota,
      r.valorRecolher,
      r.valorRecolhido,
      r.deficit,
      r.inadimplencia,
      statusLabel,
    ];
    [7, 8, 9].forEach((c) => {
      rowRef.getCell(c).numFmt = '"R$" #,##0.00';
    });
    rowRef.getCell(6).numFmt = "0.00";
    rowRef.getCell(10).numFmt = "0.00";
    row++;
  }

  row++;
  const totalsRow = ws.getRow(row);
  totalsRow.getCell(6).value = "TOTAIS";
  totalsRow.getCell(7).value = report.totais.valorRecolher;
  totalsRow.getCell(8).value = report.totais.valorRecolhido;
  totalsRow.getCell(9).value = report.totais.deficit;
  totalsRow.getCell(10).value = report.totais.inadimplenciaMedia;
  totalsRow.font = { bold: true };
  [7, 8, 9].forEach((c) => (totalsRow.getCell(c).numFmt = '"R$" #,##0.00'));
  totalsRow.getCell(10).numFmt = "0.00";

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${tipo}-${Date.now()}.xlsx"`,
    },
  });
}
