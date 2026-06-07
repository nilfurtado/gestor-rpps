#!/usr/bin/env node

/**
 * Script de Backup do Banco de Dados
 * Executa backup diário do SQLite para pasta segura
 *
 * Uso:
 *   node scripts/backup-database.js
 *
 * Cron (Linux/Mac):
 *   0 2 * * * cd /path/to/gestor && node scripts/backup-database.js
 *
 * Task Scheduler (Windows):
 *   Agendar comando: node C:\path\to\gestor\scripts\backup-database.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // Manter últimos 30 backups

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`✅ Diretório de backups criado: ${BACKUP_DIR}`);
}

// Verificar se banco existe
if (!fs.existsSync(DB_PATH)) {
  console.error(`❌ Banco de dados não encontrado: ${DB_PATH}`);
  process.exit(1);
}

// Criar nome do backup com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupName = `dev.db.backup.${timestamp}.sqlite`;
const backupPath = path.join(BACKUP_DIR, backupName);

try {
  // Copiar banco para backup
  fs.copyFileSync(DB_PATH, backupPath);
  const stats = fs.statSync(backupPath);
  console.log(`✅ Backup criado: ${backupName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Listar backups e limpar antigos
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('dev.db.backup'))
    .sort()
    .reverse();

  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS);
    toDelete.forEach(file => {
      fs.unlinkSync(path.join(BACKUP_DIR, file));
    });
    console.log(`🗑️  ${toDelete.length} backup(s) antigo(s) removido(s)`);
  }

  // Exibir resumo
  console.log(`\n📊 Resumo de Backups:`);
  console.log(`   Total: ${backups.length}`);
  console.log(`   Mantendo: ${Math.min(backups.length, MAX_BACKUPS)} backups`);
  console.log(`   Diretório: ${BACKUP_DIR}`);

  process.exit(0);
} catch (err) {
  console.error(`❌ Erro ao fazer backup: ${err.message}`);
  process.exit(1);
}
