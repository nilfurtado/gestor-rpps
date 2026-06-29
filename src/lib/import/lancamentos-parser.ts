/**
 * CSV Parser for Lançamentos (financial records)
 * Handles parsing and validation of lancamento data from CSV files
 */

import { parseExcelFile } from './excel-parser';

export interface ParsedLancamento {
  orgaoSigla: string;
  competenciaMes: string;
  tipo: "PATRONAL" | "SEGURADO";
  folhaBase: number;
  aliquota: number;
  valorRecolhido: number;
  tiposFolhas?: Array<{ nome: string; valor: number }>;
}

export interface ParseError {
  row: number;
  field: string;
  message: string;
}

interface ParseResult {
  rows: ParsedLancamento[];
  errors: ParseError[];
}

// Valid month names in Portuguese
const VALID_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Required fields that must be in CSV header
const REQUIRED_FIELDS = [
  "Órgão",
  "Competência",
  "Tipo",
  "FolhaBase",
  "Alíquota",
  "ValorRecolhido",
];

/**
 * Parse CSV file content into rows and errors
 * @param file CSV file to parse
 * @returns Promise with parsed rows and any validation errors
 */
export async function parseLancamentosCSV(
  file: File
): Promise<ParseResult> {
  const content = await file.text();
  const lines = content.split("\n");

  if (lines.length < 2) {
    return { rows: [], errors: [] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  // Find column indices (use -1 if not found, will handle later)
  const headerIndices: Record<string, number> = {};
  for (const field of REQUIRED_FIELDS) {
    const idx = headers.indexOf(field);
    headerIndices[field] = idx;
  }

  // Identify optional tipos de folhas columns (anything after the required fields)
  const tiposFolhasHeaders: Array<{ index: number; name: string }> = [];
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (!REQUIRED_FIELDS.includes(header)) {
      tiposFolhasHeaders.push({ index: i, name: header });
    }
  }

  const rows: ParsedLancamento[] = [];
  const errors: ParseError[] = [];

  // Parse data rows (starting from line 1, row numbers start at 2)
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    const rowNumber = lineIdx + 1;
    const values = parseCSVLine(line);
    const rowErrors: ParseError[] = [];

    // Extract required fields
    const orgaoIdx = headerIndices["Órgão"];
    const competenciaIdx = headerIndices["Competência"];
    const tipoIdx = headerIndices["Tipo"];
    const folhaBaseIdx = headerIndices["FolhaBase"];
    const aliquotaIdx = headerIndices["Alíquota"];
    const valorRecolhidoIdx = headerIndices["ValorRecolhido"];

    const orgaoSigla = orgaoIdx >= 0 ? values[orgaoIdx]?.trim() || "" : "";
    const competenciaMes =
      competenciaIdx >= 0 ? values[competenciaIdx]?.trim() || "" : "";
    const tipo = tipoIdx >= 0 ? values[tipoIdx]?.trim() || "" : "";
    const folhaBaseStr =
      folhaBaseIdx >= 0 ? values[folhaBaseIdx]?.trim() || "" : "";
    const aliquotaStr =
      aliquotaIdx >= 0 ? values[aliquotaIdx]?.trim() || "" : "";
    const valorRecolhidoStr =
      valorRecolhidoIdx >= 0 ? values[valorRecolhidoIdx]?.trim() || "" : "";

    // Validate Órgão
    if (orgaoIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "Órgão",
        message: 'Required field "Órgão" not found in CSV header',
      });
    } else if (!orgaoSigla) {
      rowErrors.push({
        row: rowNumber,
        field: "Órgão",
        message: "Órgão is required and cannot be empty",
      });
    }

    // Validate Competência
    if (competenciaIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "Competência",
        message: 'Required field "Competência" not found in CSV header',
      });
    } else if (!competenciaMes) {
      rowErrors.push({
        row: rowNumber,
        field: "Competência",
        message: "Competência is required and cannot be empty",
      });
    } else if (!VALID_MONTHS.includes(competenciaMes)) {
      rowErrors.push({
        row: rowNumber,
        field: "Competência",
        message: `Competência must be a valid month name. Valid values: ${VALID_MONTHS.join(", ")}`,
      });
    }

    // Validate Tipo
    if (tipoIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: 'Required field "Tipo" not found in CSV header',
      });
    } else if (!tipo) {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: "Tipo is required and cannot be empty",
      });
    } else if (tipo !== "PATRONAL" && tipo !== "SEGURADO") {
      rowErrors.push({
        row: rowNumber,
        field: "Tipo",
        message: 'Tipo must be either "PATRONAL" or "SEGURADO"',
      });
    }

    // Validate FolhaBase
    let folhaBase = 0;
    if (folhaBaseIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "FolhaBase",
        message: 'Required field "FolhaBase" not found in CSV header',
      });
    } else if (!folhaBaseStr) {
      rowErrors.push({
        row: rowNumber,
        field: "FolhaBase",
        message: "FolhaBase is required",
      });
    } else {
      const parsed = parseFloat(folhaBaseStr);
      if (isNaN(parsed) || parsed <= 0) {
        rowErrors.push({
          row: rowNumber,
          field: "FolhaBase",
          message: "FolhaBase must be a valid positive number",
        });
      } else {
        folhaBase = parsed;
      }
    }

    // Validate Alíquota
    let aliquota = 0;
    if (aliquotaIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "Alíquota",
        message: 'Required field "Alíquota" not found in CSV header',
      });
    } else if (!aliquotaStr) {
      rowErrors.push({
        row: rowNumber,
        field: "Alíquota",
        message: "Alíquota is required",
      });
    } else {
      const parsed = parseFloat(aliquotaStr);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        rowErrors.push({
          row: rowNumber,
          field: "Alíquota",
          message: "Alíquota must be a number between 0 and 100",
        });
      } else {
        aliquota = parsed;
      }
    }

    // Validate ValorRecolhido
    let valorRecolhido = 0;
    if (valorRecolhidoIdx < 0) {
      rowErrors.push({
        row: rowNumber,
        field: "ValorRecolhido",
        message: 'Required field "ValorRecolhido" not found in CSV header',
      });
    } else if (!valorRecolhidoStr) {
      rowErrors.push({
        row: rowNumber,
        field: "ValorRecolhido",
        message: "ValorRecolhido is required",
      });
    } else {
      const parsed = parseFloat(valorRecolhidoStr);
      if (isNaN(parsed) || parsed < 0) {
        rowErrors.push({
          row: rowNumber,
          field: "ValorRecolhido",
          message: "ValorRecolhido must be a valid non-negative number",
        });
      } else {
        valorRecolhido = parsed;
      }
    }

    // Parse optional tipos de folhas
    const tiposFolhas: Array<{ nome: string; valor: number }> = [];
    for (const { index, name } of tiposFolhasHeaders) {
      const valueStr = values[index]?.trim() || "";
      if (valueStr) {
        const parsed = parseFloat(valueStr);
        if (isNaN(parsed) || parsed < 0) {
          rowErrors.push({
            row: rowNumber,
            field: name,
            message: `${name} must be a valid non-negative number`,
          });
        } else {
          tiposFolhas.push({ nome: name, valor: parsed });
        }
      }
    }

    // Add row regardless of errors (for caller to see data and errors together)
    const lancamento: ParsedLancamento = {
      orgaoSigla,
      competenciaMes,
      tipo: (tipo === "PATRONAL" || tipo === "SEGURADO" ? tipo : "PATRONAL") as "PATRONAL" | "SEGURADO",
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

/**
 * Parse a lancamentos file (CSV or XLSX) with automatic format detection
 * @param file File to parse (CSV or XLSX)
 * @returns Promise with parsed rows and any validation errors
 */
export async function parseLancamentosFile(
  file: File
): Promise<{ rows: ParsedLancamento[]; errors: ParseError[] }> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseLancamentosCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file);
  } else {
    return {
      rows: [],
      errors: [
        {
          row: 0,
          field: 'file',
          message: 'Formato de arquivo não suportado. Use CSV ou XLSX.',
        },
      ],
    };
  }
}

/**
 * Parse a single CSV line, handling quoted fields and commas within quotes
 * @param line CSV line to parse
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // Field separator
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add the last field
  fields.push(current.trim());

  return fields;
}
