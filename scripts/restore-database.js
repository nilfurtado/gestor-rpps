#!/usr/bin/env node

/**
 * Script de Restauração do Banco de Dados
 * Restaura banco a partir de um backup
 *
 * Uso:
 *   node scripts/restore-database.js [data]
 *   node scripts/restore-database.js 2026-06-07
 *   node scripts/restore-database.js  (usa backup mais recente)
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Pegar data do argumento ou usar a mais recente
const targetDate = process.argv[2];

// Listar backups disponíveis
if (!fs.existsSync(BACKUP_DIR)) {
  console.error(`❌ Nenhum backup encontrado. Diretório não existe: ${BACKUP_DIR}`);
  process.exit(1);
}

const backups = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('dev.db.backup'))
  .sort()
  .reverse();

if (backups.length === 0) {
  console.error(`❌ Nenhum backup disponível em ${BACKUP_DIR}`);
  process.exit(1);
}

// Selecionar backup
let selectedBackup;
if (targetDate) {
  selectedBackup = backups.find(b => b.includes(targetDate));
  if (!selectedBackup) {
    console.error(`❌ Backup não encontrado para data: ${targetDate}`);
    console.log(`\n📋 Backups disponíveis:`);
    backups.forEach((b, idx) => {
      console.log(`   ${idx + 1}. ${b}`);
    });
    process.exit(1);
  }
} else {
  selectedBackup = backups[0];
}

const backupPath = path.join(BACKUP_DIR, selectedBackup);

// Confirmar restauração
console.log(`⚠️  RESTAURAÇÃO DE BANCO DE DADOS`);
console.log(`\n   Banco atual: ${DB_PATH}`);
console.log(`   Backup: ${selectedBackup}`);
console.log(`   Tamanho: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log(`\n⚠️  AVISO: Todos os dados após ${selectedBackup.replace('dev.db.backup.', '').replace('.sqlite', '')} serão perdidos!`);

// Para produção, fazer backup de segurança
const currentDate = new Date().toISOString().split('T')[0];
const safetyBackup = path.join(BACKUP_DIR, `dev.db.backup.BEFORE-RESTORE.${currentDate}.sqlite`);

try {
  // Fazer backup de segurança do banco atual
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, safetyBackup);
    console.log(`✅ Backup de segurança criado: dev.db.backup.BEFORE-RESTORE.${currentDate}.sqlite`);
  }

  // Restaurar banco
  fs.copyFileSync(backupPath, DB_PATH);
  console.log(`\n✅ Banco restaurado com sucesso!`);
  console.log(`   Data: ${selectedBackup}`);
  console.log(`\n💡 Para reverter, use:`);
  console.log(`   node scripts/restore-database.js BEFORE-RESTORE.${currentDate}`);

  process.exit(0);
} catch (err) {
  console.error(`\n❌ Erro ao restaurar: ${err.message}`);
  process.exit(1);
}
