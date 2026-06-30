const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Constants
const ALIQUOTA_SEGURADO = 0.11;
const ALIQUOTA_PATRONAL = 0.1777;

// Map sheet names to orgao codes
const ORGAOS_MAP = {
  'SEMAD': 'SEMAD',
  'SEMSA': 'SEMSA',
  'CMS': 'CMS',
  'SEME': 'SEME',
  'STTRANS': 'STTRANS',
};

/**
 * Convert Excel date value to MM/YYYY format
 * Handles both numeric serial dates and Date objects
 */
function dateToMMYYYY(dateValue) {
  if (!dateValue) {
    return null;
  }

  let date;

  // If it's already a Date object
  if (dateValue instanceof Date) {
    date = dateValue;
  }
  // If it's a number, convert from Excel serial
  else if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    date = new Date(excelEpoch.getTime() + dateValue * 86400000);
  }
  // If it's a string, try to parse it
  else if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    } else {
      return null;
    }
  } else {
    return null;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${year}`;
}

/**
 * Parse a row of data from Excel sheet
 */
function parseRow(row, sheetName) {
  // Column layout:
  // Col 1: Date
  // Col 2: FOLHA (folhaBase)
  // Col 5: QNT (quantidadeServidores)

  const dateValue = row.getCell(1).value;
  const folhaBase = row.getCell(2).value;
  const qnt = row.getCell(5).value;

  // Skip invalid rows
  if (!dateValue || folhaBase === null || folhaBase === undefined || !qnt) {
    return null;
  }

  // Convert date
  const competencia = dateToMMYYYY(dateValue);
  if (!competencia) {
    return null;
  }

  // Ensure numeric values
  const folhaBaseNum = parseFloat(folhaBase);
  const qntNum = parseInt(qnt, 10);

  if (isNaN(folhaBaseNum) || isNaN(qntNum)) {
    return null;
  }

  const orgao = ORGAOS_MAP[sheetName];
  if (!orgao) {
    return null;
  }

  return [
    {
      orgao: orgao,
      competencia: competencia,
      tipo: 'PATRONAL',
      folhaBase: folhaBaseNum,
      aliquota: ALIQUOTA_PATRONAL,
      quantidadeServidores: qntNum,
    },
    {
      orgao: orgao,
      competencia: competencia,
      tipo: 'SEGURADO',
      folhaBase: folhaBaseNum,
      aliquota: ALIQUOTA_SEGURADO,
      quantidadeServidores: qntNum,
    },
  ];
}

/**
 * Main parser function
 */
async function parseArrecadacao() {
  const downloadsDir = path.join(
    process.env.USERPROFILE || process.env.HOME,
    'Downloads'
  );

  // Find the Excel file (handle various encodings/versions)
  const files = fs.readdirSync(downloadsDir);
  const arrecadacaoFile = files.find(f =>
    f.includes('CONTROLE') &&
    f.includes('ARRECADA') &&
    f.endsWith('.xlsx') &&
    f.includes('ATUALIZADO') &&
    f.includes('(1)')
  );

  if (!arrecadacaoFile) {
    console.error(`Error: Could not find CONTROLE DE ARRECADACAO file in ${downloadsDir}`);
    console.error(`Available files: ${files.filter(f => f.includes('ARRECADA')).join(', ')}`);
    process.exit(1);
  }

  const filePath = path.join(downloadsDir, arrecadacaoFile);
  console.error(`Using file: ${arrecadacaoFile}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const lancamentos = [];

  // Process each sheet
  workbook.eachSheet((worksheet) => {
    const sheetName = worksheet.name;

    // Skip if not one of our target sheets
    if (!ORGAOS_MAP[sheetName]) {
      return;
    }

    console.error(`Processing sheet: ${sheetName}`);

    let dataStartRow = null;
    let rowCount = 0;

    // Find the header row by looking for "FOLHA" in column 2
    worksheet.eachRow((row, rowNumber) => {
      const col2Value = row.getCell(2).value;
      const col5Value = row.getCell(5).value;

      // Header row contains "FOLHA" and "QNT"
      if (col2Value === 'FOLHA' && col5Value === 'QNT') {
        dataStartRow = rowNumber + 1;
        return; // Stop search, found header
      }
    });

    if (!dataStartRow) {
      console.error(`  Warning: Could not find header row in sheet ${sheetName}`);
      return;
    }

    console.error(`  Header found at row ${dataStartRow - 1}, data starts at row ${dataStartRow}`);

    // Process data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) {
        return; // Skip header and rows before data
      }

      const records = parseRow(row, sheetName);
      if (records) {
        lancamentos.push(...records);
        rowCount++;
      }
    });

    console.error(`  Parsed ${rowCount} rows, created ${rowCount * 2} lancamentos`);
  });

  // Output as JSON
  console.log(JSON.stringify(lancamentos, null, 2));

  // Also output summary to stderr
  console.error(`\nTotal lancamentos parsed: ${lancamentos.length}`);
}

// Run parser
parseArrecadacao().catch((error) => {
  console.error('Parser error:', error);
  process.exit(1);
});
