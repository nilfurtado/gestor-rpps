import type ExcelJS from "exceljs";
import type { ReportResult } from "@/lib/reports";
import type { LoadedRpps } from "@/lib/pdf/load-rpps";
import { formatDateTime } from "@/lib/format";

const COL_COUNT = 11;
const LAST_COL = "K";

const PRIMARY = "FF0F5132";
const MUTE = "FF57534E";
const SUBTLE = "FFA8A29E";

function setCell(
  ws: ExcelJS.Worksheet,
  ref: string,
  value: string,
  opts: { bold?: boolean; size?: number; color?: string; italic?: boolean } = {}
) {
  const cell = ws.getCell(ref);
  cell.value = value;
  cell.font = {
    bold: opts.bold,
    italic: opts.italic,
    size: opts.size,
    color: opts.color ? { argb: opts.color } : undefined,
  };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

export function applyInstitutionalHeader(
  workbook: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  loaded: LoadedRpps,
  report: ReportResult
): number {
  const { rpps, logoBuffer, logoExt } = loaded;

  if (logoBuffer && logoExt) {
    const imgId = workbook.addImage({
      buffer: logoBuffer as unknown as ArrayBuffer,
      extension: logoExt,
    });
    ws.addImage(imgId, {
      tl: { col: 0.2, row: 0.2 },
      ext: { width: 70, height: 70 },
      editAs: "absolute",
    });
  }

  ws.mergeCells(`A1:B4`);

  ws.mergeCells(`C1:${LAST_COL}1`);
  setCell(ws, "C1", rpps?.nomeInstituto?.trim() || "Instituto não configurado", {
    bold: true,
    size: 14,
    color: PRIMARY,
  });

  ws.mergeCells(`C2:${LAST_COL}2`);
  setCell(ws, "C2", rpps?.nomeDepartamento?.trim() || "", {
    size: 10,
    color: MUTE,
  });

  ws.mergeCells(`C3:${LAST_COL}3`);
  setCell(
    ws,
    "C3",
    rpps?.cnpj?.trim() ? `CNPJ: ${rpps.cnpj.trim()}` : "",
    { size: 9, color: SUBTLE }
  );

  const contact: string[] = [];
  if (rpps?.enderecoCompleto?.trim()) contact.push(rpps.enderecoCompleto.trim());
  if (rpps?.telefone?.trim()) contact.push(`Tel.: ${rpps.telefone.trim()}`);
  if (rpps?.email?.trim()) contact.push(rpps.email.trim());
  ws.mergeCells(`C4:${LAST_COL}4`);
  setCell(ws, "C4", contact.join("  ·  "), { size: 9, color: MUTE });

  for (let r = 1; r <= 4; r++) {
    ws.getRow(r).height = 18;
  }
  ws.getRow(1).height = 22;

  const dividerRow = 5;
  for (let c = 1; c <= COL_COUNT; c++) {
    const cell = ws.getRow(dividerRow).getCell(c);
    cell.border = { bottom: { style: "thin", color: { argb: "FFE7E5E4" } } };
  }
  ws.getRow(dividerRow).height = 4;

  const titleRow = 6;
  ws.mergeCells(`A${titleRow}:${LAST_COL}${titleRow}`);
  const titleCell = ws.getCell(`A${titleRow}`);
  titleCell.value = report.titulo;
  titleCell.font = { bold: true, size: 13, color: { argb: PRIMARY } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(titleRow).height = 22;

  const subRow = titleRow + 1;
  ws.mergeCells(`A${subRow}:${LAST_COL}${subRow}`);
  const subCell = ws.getCell(`A${subRow}`);
  subCell.value = `${report.subtitulo}  ·  Emitido em ${formatDateTime(new Date())}`;
  subCell.font = { italic: true, size: 9, color: { argb: MUTE } };
  subCell.alignment = { horizontal: "center" };

  return subRow + 2;
}
