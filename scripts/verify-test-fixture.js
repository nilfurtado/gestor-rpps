#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');

const fixturePath = path.join(__dirname, '../tests/fixtures/test-lancamentos.xlsx');

try {
  const wb = XLSX.readFile(fixturePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws);

  console.log('✓ File is valid and readable');
  console.log(`✓ Sheet name: ${wb.SheetNames[0]}`);
  console.log(`✓ Total rows: ${data.length}`);
  console.log(`✓ Columns: ${Object.keys(data[0]).join(', ')}`);
  console.log('\n✓ Sample data:');
  data.forEach((row, idx) => {
    const qtdDisplay = row.quantidadeServidores ? ` | Servidores: ${row.quantidadeServidores}` : '';
    console.log(`  Row ${idx + 1}: ${row.Órgão} | ${row.Competência} | ${row.Tipo} | Base: ${row.FolhaBase} | Recolhido: ${row.ValorRecolhido}${qtdDisplay}`);
  });

  // Verify all required columns exist
  const requiredColumns = ['Órgão', 'Competência', 'Tipo', 'FolhaBase', 'Alíquota', 'ValorRecolhido', 'FolhaSuplementar'];
  const hasAllColumns = requiredColumns.every(col => Object.keys(data[0]).includes(col));
  if (hasAllColumns) {
    console.log('\n✓ All required columns present');
  } else {
    console.error('✗ Missing columns');
    process.exit(1);
  }

  // Verify optional quantidadeServidores column
  const hasQuantidadeServidores = Object.keys(data[0]).includes('quantidadeServidores');
  if (hasQuantidadeServidores) {
    const allRowsHaveQtd = data.every(row => row.quantidadeServidores !== undefined && row.quantidadeServidores !== null && row.quantidadeServidores !== '');
    if (allRowsHaveQtd) {
      console.log('✓ quantidadeServidores column present and populated in all rows');
    } else {
      console.warn('⚠ quantidadeServidores column present but some rows have missing values');
    }
  } else {
    console.warn('⚠ quantidadeServidores column not found (optional field)');
  }

  // Verify data integrity
  if (data.length === 5) {
    console.log('✓ Expected row count (5) verified');
  } else {
    console.error('✗ Unexpected row count');
    process.exit(1);
  }

  console.log('\n✓ Test fixture verified successfully!');
} catch (error) {
  console.error('✗ Error reading fixture:', error.message);
  process.exit(1);
}
