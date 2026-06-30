#!/usr/bin/env node

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure fixtures directory exists
const fixtureDir = path.join(__dirname, '../tests/fixtures');
if (!fs.existsSync(fixtureDir)) {
  fs.mkdirSync(fixtureDir, { recursive: true });
}

// Sample lançamento data
const data = [
  {
    Órgão: 'SEAP',
    Competência: 'Janeiro',
    Tipo: 'PATRONAL',
    FolhaBase: 50000,
    Alíquota: 20,
    ValorRecolhido: 10000,
    FolhaSuplementar: 0,
    quantidadeServidores: 5
  },
  {
    Órgão: 'SEDUC',
    Competência: 'Fevereiro',
    Tipo: 'SEGURADO',
    FolhaBase: 30000,
    Alíquota: 11,
    ValorRecolhido: 3300,
    FolhaSuplementar: 0,
    quantidadeServidores: 3
  },
  {
    Órgão: 'DETRAN',
    Competência: 'Março',
    Tipo: 'PATRONAL',
    FolhaBase: 75000,
    Alíquota: 20,
    ValorRecolhido: 15000,
    FolhaSuplementar: 5000,
    quantidadeServidores: 8
  },
  {
    Órgão: 'SEPLAG',
    Competência: 'Abril',
    Tipo: 'SEGURADO',
    FolhaBase: 45000,
    Alíquota: 11,
    ValorRecolhido: 4950,
    FolhaSuplementar: 0,
    quantidadeServidores: 2
  },
  {
    Órgão: 'SECOM',
    Competência: 'Maio',
    Tipo: 'PATRONAL',
    FolhaBase: 60000,
    Alíquota: 20,
    ValorRecolhido: 12000,
    FolhaSuplementar: 3000,
    quantidadeServidores: 6
  }
];

// Create workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Format columns (set widths for better readability)
ws['!cols'] = [
  { wch: 15 }, // Órgão
  { wch: 15 }, // Competência
  { wch: 12 }, // Tipo
  { wch: 12 }, // FolhaBase
  { wch: 10 }, // Alíquota
  { wch: 15 }, // ValorRecolhido
  { wch: 18 }, // FolhaSuplementar
  { wch: 18 }  // quantidadeServidores
];

XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');

// Save file
const outputPath = path.join(fixtureDir, 'test-lancamentos.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`✓ Test fixture created: ${outputPath}`);
console.log(`✓ Rows: ${data.length}`);
console.log(`✓ Columns: ${Object.keys(data[0]).length}`);
