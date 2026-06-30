#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validate imported CONTROLE DE ARRECADAÇÃO data
 *
 * Usage:
 *   node scripts/validate-arrecadacao.js [--expected-count <n>]
 *
 * Process:
 * 1. Connect to database
 * 2. Query imported lançamentos by órgão and tipo
 * 3. Verify counts match expected values
 * 4. Sample validation of calculations
 * 5. Report any discrepancies
 */

// Load Prisma client
let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (error) {
  console.error('Error: Could not load Prisma client. Make sure to run from project root.');
  console.error(error.message);
  process.exit(1);
}

// Constants
const EXPECTED_LANCAMENTOS = 102; // From parse-arrecadacao: 51 rows × 2 types
const EXPECTED_ORGAOS = ['SEMAD', 'SEMSA', 'CMS', 'SEME', 'STTRANS'];

/**
 * Format numbers for display
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value) {
  return (value * 100).toFixed(2) + '%';
}

/**
 * Validate a single lancamento's calculations
 */
function validateCalculations(lancamento) {
  const errors = [];

  // Expected: valorRecolher = folhaBase × aliquota
  if (lancamento.folhaBase && lancamento.aliquota) {
    const expected = lancamento.folhaBase * lancamento.aliquota;
    const actual = lancamento.valorRecolher;
    const tolerance = 0.01; // Allow 1 cent difference due to rounding

    if (Math.abs(expected - actual) > tolerance) {
      errors.push(
        `Valor a Recolher mismatch: expected ${formatCurrency(expected)}, got ${formatCurrency(actual)}`
      );
    }
  }

  // Check that quantidadeServidores is present and positive if provided
  if (lancamento.quantidadeServidores !== null && lancamento.quantidadeServidores !== undefined) {
    if (lancamento.quantidadeServidores < 0) {
      errors.push(`quantidadeServidores is negative: ${lancamento.quantidadeServidores}`);
    }
  }

  // Verify tipo is valid
  if (lancamento.tipo !== 'PATRONAL' && lancamento.tipo !== 'SEGURADO') {
    errors.push(`Invalid tipo: ${lancamento.tipo}`);
  }

  // Verify aliquota is in expected range
  const expectedAliquotas = {
    'PATRONAL': 0.1777,
    'SEGURADO': 0.11,
  };
  if (lancamento.aliquota !== expectedAliquotas[lancamento.tipo]) {
    errors.push(
      `Aliquota mismatch: expected ${formatPercent(expectedAliquotas[lancamento.tipo])}, got ${formatPercent(lancamento.aliquota)}`
    );
  }

  return errors;
}

/**
 * Main validation function
 */
async function validateArrecadacao() {
  console.log('Starting CONTROLE DE ARRECADAÇÃO validation...\n');

  try {
    // Step 1: Count total lançamentos
    console.log('Step 1: Counting lançamentos...');
    const totalCount = await prisma.folhaPrevidenciaria.count();
    console.log(`Total lançamentos in database: ${totalCount}`);

    // Step 2: Group by órgão
    console.log('\nStep 2: Counting by órgão...');
    const byOrgao = await prisma.folhaPrevidenciaria.groupBy({
      by: ['orgaoId'],
      _count: true,
    });

    const orgaoData = await prisma.orgao.findMany();
    const orgaoMap = Object.fromEntries(orgaoData.map(o => [o.id, o.sigla]));

    const orgaoCounts = {};
    byOrgao.forEach(group => {
      const sigla = orgaoMap[group.orgaoId] || `ID:${group.orgaoId}`;
      orgaoCounts[sigla] = group._count;
      console.log(`  ${sigla}: ${group._count}`);
    });

    // Step 3: Group by tipo
    console.log('\nStep 3: Counting by tipo...');
    const byTipo = await prisma.folhaPrevidenciaria.groupBy({
      by: ['tipo'],
      _count: true,
    });

    const tipoCounts = {};
    byTipo.forEach(group => {
      tipoCounts[group.tipo] = group._count;
      console.log(`  ${group.tipo}: ${group._count}`);
    });

    // Step 4: Verify expected órgãos exist
    console.log('\nStep 4: Verifying órgãos...');
    let validOrgaos = true;
    EXPECTED_ORGAOS.forEach(expected => {
      if (expected in orgaoCounts) {
        console.log(`  ✓ ${expected} found`);
      } else {
        console.log(`  ✗ ${expected} NOT found`);
        validOrgaos = false;
      }
    });

    // Step 5: Sample validation
    console.log('\nStep 5: Sampling validation...');
    const samples = await prisma.folhaPrevidenciaria.findMany({
      take: 5,
      include: {
        orgao: true,
        competencia: true,
      },
    });

    let sampleErrors = 0;
    samples.forEach((sample, idx) => {
      console.log(`\n  Sample ${idx + 1}:`);
      console.log(`    Órgão: ${sample.orgao.sigla}`);
      console.log(`    Competência: ${sample.competencia.mes}/${sample.competencia.ano}`);
      console.log(`    Tipo: ${sample.tipo}`);
      console.log(`    Folha Base: ${formatCurrency(sample.folhaBase || 0)}`);
      console.log(`    Valor a Recolher: ${formatCurrency(sample.valorRecolher)}`);
      console.log(`    Aliquota: ${formatPercent(sample.aliquota)}`);
      if (sample.quantidadeServidores) {
        console.log(`    Servidores: ${sample.quantidadeServidores}`);
      }

      const errors = validateCalculations(sample);
      if (errors.length > 0) {
        errors.forEach(e => {
          console.log(`    ✗ ${e}`);
        });
        sampleErrors++;
      } else {
        console.log(`    ✓ Calculations valid`);
      }
    });

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));

    const importedCount = Object.values(orgaoCounts).reduce((a, b) => a + b, 0);
    console.log(`\nImported lançamentos: ${importedCount}`);
    console.log(`Expected lançamentos: ${EXPECTED_LANCAMENTOS}`);

    if (importedCount === EXPECTED_LANCAMENTOS) {
      console.log('✓ Count matches expected value!');
    } else if (importedCount > 0) {
      console.log(
        `⚠ Count mismatch: imported ${importedCount}, expected ${EXPECTED_LANCAMENTOS}`
      );
    } else {
      console.log(
        '✗ No lançamentos imported! Check import process or server connectivity.'
      );
    }

    console.log(`\nTipo distribution:`);
    console.log(`  PATRONAL: ${tipoCounts['PATRONAL'] || 0}`);
    console.log(`  SEGURADO: ${tipoCounts['SEGURADO'] || 0}`);

    console.log(`\nÓrgão distribution:`);
    EXPECTED_ORGAOS.forEach(orgao => {
      const count = orgaoCounts[orgao] || 0;
      console.log(`  ${orgao}: ${count}`);
    });

    console.log(`\nSample validation:`);
    console.log(`  Samples checked: ${samples.length}`);
    console.log(`  Errors found: ${sampleErrors}`);

    if (sampleErrors === 0 && samples.length > 0) {
      console.log('✓ All samples passed validation!');
    } else if (sampleErrors > 0) {
      console.log(`⚠ Found errors in samples (see details above)`);
    }

    console.log(`\n${validOrgaos ? '✓' : '✗'} All expected órgãos present\n`);

    // Determine exit code
    const hasIssues = importedCount === 0 || sampleErrors > 0 || !validOrgaos;
    process.exit(hasIssues ? 1 : 0);
  } catch (error) {
    console.error('Validation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run validation
validateArrecadacao();
