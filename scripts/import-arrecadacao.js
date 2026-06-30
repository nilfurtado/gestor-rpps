#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

/**
 * Batch importer for CONTROLE DE ARRECADAÇÃO lançamentos
 *
 * Usage:
 *   node scripts/parse-arrecadacao.js > /tmp/arrecadacao.json
 *   node scripts/import-arrecadacao.js /tmp/arrecadacao.json
 *
 * Process:
 * 1. Read JSON file from parser
 * 2. Create temporary FormData-like structure with JSON as "file"
 * 3. Call /api/lancamentos/import/preview to validate
 * 4. Call /api/lancamentos/import/confirm to save
 * 5. Report results
 */

// Configuration
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const API_TIMEOUT = 30000; // 30 seconds
const BATCH_SIZE = 50; // Process in smaller batches for safety

/**
 * Make HTTP request with proper headers
 */
function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'User-Agent': 'import-arrecadacao/1.0',
        ...headers,
      },
      timeout: API_TIMEOUT,
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Convert parsed JSON array to FormData-like structure
 * The API expects FormData with a "file" field containing CSV/XLSX
 * For JSON input, we'll send it as a JSON file blob
 */
function createFilePayload(lancamentos) {
  // Create a JSON file content
  const jsonContent = JSON.stringify(lancamentos, null, 2);

  // Create a Blob-like structure
  return {
    name: 'arrecadacao.json',
    type: 'application/json',
    content: jsonContent,
    size: jsonContent.length,
  };
}

/**
 * Call preview endpoint to validate data
 */
async function callPreviewAPI(lancamentos) {
  console.log(`\nCalling /api/lancamentos/import/preview with ${lancamentos.length} lançamentos...`);

  // Create FormData manually since we can't use browser APIs
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 9);
  const file = createFilePayload(lancamentos);

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`;
  body += `Content-Type: ${file.type}\r\n\r\n`;
  body += file.content;
  body += `\r\n--${boundary}--\r\n`;

  try {
    const response = await makeRequest('POST', '/api/lancamentos/import/preview', body, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body),
    });

    if (response.status !== 200) {
      console.error(`Preview API error: ${response.status}`);
      console.error('Response:', JSON.stringify(response.body, null, 2));
      process.exit(1);
    }

    return response.body;
  } catch (error) {
    console.error('Preview API request failed:', error.message);
    process.exit(1);
  }
}

/**
 * Call confirm endpoint to save validated data
 */
async function callConfirmAPI(preview) {
  console.log(`\nCalling /api/lancamentos/import/confirm with ${preview.length} valid lançamentos...`);

  const payload = {
    preview: preview.filter((p) => p.valid),
  };

  try {
    const response = await makeRequest('POST', '/api/lancamentos/import/confirm', payload, {
      'Content-Type': 'application/json',
    });

    if (response.status !== 200) {
      console.error(`Confirm API error: ${response.status}`);
      console.error('Response:', JSON.stringify(response.body, null, 2));
      process.exit(1);
    }

    return response.body;
  } catch (error) {
    console.error('Confirm API request failed:', error.message);
    process.exit(1);
  }
}

/**
 * Format numbers for display
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Main import function
 */
async function importArrecadacao() {
  const jsonFile = process.argv[2];

  if (!jsonFile) {
    console.error('Usage: node scripts/import-arrecadacao.js <json-file>');
    console.error('Example: node scripts/parse-arrecadacao.js > /tmp/arrecadacao.json');
    console.error('         node scripts/import-arrecadacao.js /tmp/arrecadacao.json');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(jsonFile)) {
    console.error(`Error: File not found: ${jsonFile}`);
    process.exit(1);
  }

  // Read JSON file
  console.log(`Reading parsed data from: ${jsonFile}`);
  let lancamentos;
  try {
    const content = fs.readFileSync(jsonFile, 'utf8');
    lancamentos = JSON.parse(content);
  } catch (error) {
    console.error(`Error reading JSON file: ${error.message}`);
    process.exit(1);
  }

  if (!Array.isArray(lancamentos) || lancamentos.length === 0) {
    console.error('Error: JSON file must contain an array of lançamentos');
    process.exit(1);
  }

  console.log(`Successfully parsed ${lancamentos.length} lançamentos`);

  // Show summary
  const summary = lancamentos.reduce(
    (acc, l) => {
      acc.totalFolhaBase += l.folhaBase || 0;
      acc.totalRecolher += (l.folhaBase * l.aliquota) / 100;
      acc[`${l.tipo}Count`] = (acc[`${l.tipo}Count`] || 0) + 1;
      const key = `${l.orgao}:${l.competencia}`;
      acc.byOrgaoCompetencia[key] = (acc.byOrgaoCompetencia[key] || 0) + 1;
      return acc;
    },
    {
      totalFolhaBase: 0,
      totalRecolher: 0,
      byOrgaoCompetencia: {},
    }
  );

  console.log(`
Import Summary:
- Total lançamentos: ${lancamentos.length}
- PATRONAL: ${summary.PATRONALCount || 0}
- SEGURADO: ${summary.SEGURADOCount || 0}
- Total Folha Base: ${formatCurrency(summary.totalFolhaBase)}
- Total a Recolher: ${formatCurrency(summary.totalRecolher)}
- Órgão/Competência pairs: ${Object.keys(summary.byOrgaoCompetencia).length}

Starting import process...
`);

  try {
    // Step 1: Call preview API
    const previewResponse = await callPreviewAPI(lancamentos);

    const { preview, errors, stats } = previewResponse;

    console.log(`\nPreview Results:
- Total rows: ${stats.total}
- Valid: ${stats.valid}
- Invalid: ${stats.invalid}
`);

    if (errors.length > 0) {
      console.log('Errors found:');
      errors.slice(0, 10).forEach((e) => {
        console.log(`  - ${e.message || e}`);
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

    // Step 2: Call confirm API (only if there are valid rows)
    if (stats.valid === 0) {
      console.error('\nNo valid rows to import. Aborting.');
      process.exit(1);
    }

    const confirmResponse = await callConfirmAPI(preview);
    const { created, message } = confirmResponse;

    console.log(`\n✓ Import Complete!
- Created: ${created} lançamentos
- Message: ${message}
`);

    // Final report
    if (created > 0) {
      const totalValue = lancamentos
        .slice(0, created)
        .reduce((sum, l) => sum + (l.folhaBase * l.aliquota) / 100, 0);

      console.log(`Summary of imported data:
- Total records: ${created}
- Total value: ${formatCurrency(totalValue)}
`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
}

// Run importer
importArrecadacao();
