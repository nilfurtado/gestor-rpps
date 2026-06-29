/**
 * Excel Parser for Lançamentos (financial records)
 * Handles parsing and validation of lancamento data from .xlsx files
 */

import * as XLSX from "xlsx";
import { ParsedLancamento, ParseError } from "./lancamentos-parser";

interface ParseResult {
  rows: ParsedLancamento[];
  errors: ParseError[];
}

// Required field names (with alternate accent-free spellings)
const FIELD_ALIASES: Record<string, string[]> = {
  Órgão: ["Órgão", "Orgao", "orgao", "Orgão", "órgão"],
  Competência: ["Competência", "Competencia", "competencia", "competência"],
  Tipo: ["Tipo", "tipo"],
  FolhaBase: ["FolhaBase", "Folha Base", "folhabase", "folha_base"],
  Alíquota: ["Alíquota", "Aliquota", "aliquota", "alíquota"],
  ValorRecolhido: ["ValorRecolhido", "Valor Recolhido", "valor_recolhido"],
};

const REQUIRED_CANONICAL = [
  "Órgão",
  "Competência",
  "Tipo",
  "FolhaBase",
  "Alíquota",
  "ValorRecolhido",
];

/**
 * Resolve a header name to its canonical field name.
 * Returns null if not a required field.
 */
function resolveHeader(header: string): string | null {
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(header)) {
      return canonical;
    }
  }
  return null;
}

/**
 * Convert a value from Excel to a number.
 * Handles both numeric values and Brazilian-style strings with comma decimals.
 */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const str = String(value).trim().replace(",", ".");
  const parsed = parseFloat(str);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse Excel (.xlsx) file content into rows and errors.
 * @param file .xlsx File object to parse
 * @returns Promise with parsed rows and any validation errors
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      rows: [],
      errors: [{ row: 0, field: "", message: "Arquivo Excel vazio" }],
    };
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return {
      rows: [],
      errors: [{ row: 0, field: "", message: "Arquivo Excel vazio" }],
    };
  }

  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array with header row as keys
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rawRows.length === 0) {
    return {
      rows: [],
      errors: [
        { row: 0, field: "", message: "Nenhuma linha de dados encontrada" },
      ],
    };
  }

  // Build a mapping from canonical field → actual header key found in data
  const firstRow = rawRows[0];
  const allHeaders = Object.keys(firstRow);

  const canonicalToActual: Record<string, string> = {};
  const extraHeaders: string[] = [];

  for (const header of allHeaders) {
    const canonical = resolveHeader(header);
    if (canonical) {
      canonicalToActual[canonical] = header;
    } else {
      extraHeaders.push(header);
    }
  }

  const rows: ParsedLancamento[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNumber = i + 2; // row 1 is header, data starts at row 2
    const rowErrors: ParseError[] = [];

    // ── Órgão ──────────────────────────────────────────────────────────────
    const orgaoKey = canonicalToActual["Órgão"];
    const orgaoSigla = orgaoKey ? String(raw[orgaoKey] ?? "").trim() : "";

    if (!orgaoKey) {
      rowErrors.push({
        row: rowNumber,
        field: "Órgão",
        message: 'Required field "Órgão" not found in Excel header',
      });
    } else if (!orgaoSigla) {
      rowErrors.push({
        row: rowNumber,
        field: "Órgão",
        message: "Órgão is required and cannot be empty",
      });
    }

    // ── Competência ────────────────────────────────────────────────────────
    const competenciaKey = canonicalToActual["Competência"];
    const competenciaMes = competenciaKey
      ? String(raw[competenciaKey] ?? "").trim()
      : "";

    if (!competenciaKey) {
      rowErrors.push({
        row: rowNumber,
        field: "Competência",
        message: 'Required field "Competência" not found in Excel header',
      });
    } else if (!competenciaMes) {
      rowErrors.push({
        row: rowNumber,
        field: "Competência",
        message: "Competência is required and cannot be empty",
      });
    }

    // ── Tipo ───────────────────────────────────────────────────────────────
    const tipoKey = canonicalToActual["Tipo"];
    const tipoRaw = tipoKey ? String(raw[tipoKey] ?? "").trim() : "";

    if (!tipoKey) {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: 'Required field "Tipo" not found in Excel header',
      });
    } else if (!tipoRaw) {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: "Tipo is required and cannot be empty",
      });
    } else if (tipoRaw !== "PATRONAL" && tipoRaw !== "SEGURADO") {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: "Deve ser PATRONAL ou SEGURADO",
      });
    }

    // ── FolhaBase ──────────────────────────────────────────────────────────
    const folhaBaseKey = canonicalToActual["FolhaBase"];
    let folhaBase = 0;

    if (!folhaBaseKey) {
      rowErrors.push({
        row: rowNumber,
        field: "FolhaBase",
        message: 'Required field "FolhaBase" not found in Excel header',
      });
    } else if (raw[folhaBaseKey] === "" || raw[folhaBaseKey] === null) {
      rowErrors.push({
        row: rowNumber,
        field: "FolhaBase",
        message: "FolhaBase is required",
      });
    } else {
      const num = toNumber(raw[folhaBaseKey]);
      if (num === null || num <= 0) {
        rowErrors.push({
          row: rowNumber,
          field: "FolhaBase",
          message: "Número inválido",
        });
      } else {
        folhaBase = num;
      }
    }

    // ── Alíquota ───────────────────────────────────────────────────────────
    const aliquotaKey = canonicalToActual["Alíquota"];
    let aliquota = 0;

    if (!aliquotaKey) {
      rowErrors.push({
        row: rowNumber,
        field: "Alíquota",
        message: 'Required field "Alíquota" not found in Excel header',
      });
    } else if (raw[aliquotaKey] === "" || raw[aliquotaKey] === null) {
      rowErrors.push({
        row: rowNumber,
        field: "Alíquota",
        message: "Alíquota is required",
      });
    } else {
      const num = toNumber(raw[aliquotaKey]);
      if (num === null) {
        rowErrors.push({
          row: rowNumber,
          field: "Alíquota",
          message: "Número inválido",
        });
      } else if (num < 0 || num > 100) {
        rowErrors.push({
          row: rowNumber,
          field: "Alíquota",
          message: "Deve estar entre 0 e 100",
        });
      } else {
        aliquota = num;
      }
    }

    // ── ValorRecolhido ─────────────────────────────────────────────────────
    const valorKey = canonicalToActual["ValorRecolhido"];
    let valorRecolhido = 0;

    if (!valorKey) {
      rowErrors.push({
        row: rowNumber,
        field: "ValorRecolhido",
        message: 'Required field "ValorRecolhido" not found in Excel header',
      });
    } else if (raw[valorKey] === "" || raw[valorKey] === null) {
      rowErrors.push({
        row: rowNumber,
        field: "ValorRecolhido",
        message: "ValorRecolhido is required",
      });
    } else {
      const num = toNumber(raw[valorKey]);
      if (num === null || num < 0) {
        rowErrors.push({
          row: rowNumber,
          field: "ValorRecolhido",
          message: "Número inválido",
        });
      } else {
        valorRecolhido = num;
      }
    }

    // ── Optional tiposFolhas columns ───────────────────────────────────────
    const tiposFolhas: Array<{ nome: string; valor: number }> = [];
    for (const header of extraHeaders) {
      const cellValue = raw[header];
      if (cellValue !== "" && cellValue !== null && cellValue !== undefined) {
        const num = toNumber(cellValue);
        if (num === null || num < 0) {
          rowErrors.push({
            row: rowNumber,
            field: header,
            message: `${header} must be a valid non-negative number`,
          });
        } else {
          tiposFolhas.push({ nome: header, valor: num });
        }
      }
    }

    // Build row (always push so caller sees data alongside errors)
    const lancamento: ParsedLancamento = {
      orgaoSigla,
      competenciaMes,
      tipo:
        tipoRaw === "PATRONAL" || tipoRaw === "SEGURADO"
          ? tipoRaw
          : "PATRONAL",
      folhaBase,
      aliquota,
      valorRecolhido,
    };

    if (tiposFolhas.length > 0) {
      lancamento.tiposFolhas = tiposFolhas;
    }

    rows.push(lancamento);
    errors.push(...rowErrors);
  }

  return { rows, errors };
}
