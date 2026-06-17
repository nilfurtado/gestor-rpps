import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Backup } from "@/types/backup";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const MAX_BACKUPS = 8;

/** Cria o diretório de backups se não existir. */
export async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório de backups:", error);
  }
}

/** Lista todos os backups ordenados por data (mais recentes primeiro). */
export async function listBackups(): Promise<Backup[]> {
  await ensureBackupDir();

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups: Backup[] = [];

    for (const file of files) {
      if (!file.endsWith(".db")) continue;

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const timestamp = stats.birthtimeMs || stats.mtimeMs;

      backups.push({
        id: file.replace(".db", ""),
        filename: file,
        size: stats.size,
        createdAt: new Date(timestamp),
        status: "healthy",
      });
    }

    return backups.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  } catch (error) {
    console.error("Erro ao listar backups:", error);
    return [];
  }
}

/** Cria um novo backup, limpando backups antigos automaticamente (máximo 8). */
export async function createBackup(): Promise<Backup> {
  await ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    const command =
      process.platform === "win32"
        ? `copy "${DB_PATH}" "${backupPath}"`
        : `cp "${DB_PATH}" "${backupPath}"`;

    await execAsync(command);
    const stats = await fs.stat(backupPath);

    await cleanOldBackups();

    return {
      id: filename.replace(".db", ""),
      filename,
      size: stats.size,
      createdAt: new Date(),
      status: "healthy",
    };
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    throw new Error(`Falha ao criar backup: ${error}`);
  }
}

/** Restaura um backup específico. Cria backup da versão atual antes de restaurar. */
export async function restoreBackup(id: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, `${id}.db`);

  try {
    await createBackup();

    const command =
      process.platform === "win32"
        ? `copy "${backupPath}" "${DB_PATH}"`
        : `cp "${backupPath}" "${DB_PATH}"`;

    await execAsync(command);
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    throw new Error(`Falha ao restaurar backup: ${error}`);
  }
}

/** Remove um backup do diretório de backups. */
export async function deleteBackup(id: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, `${id}.db`);

  try {
    await fs.unlink(backupPath);
  } catch (error) {
    console.error("Erro ao deletar backup:", error);
    throw new Error(`Falha ao deletar backup: ${error}`);
  }
}

async function cleanOldBackups(): Promise<void> {
  try {
    const backups = await listBackups();

    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS);

      for (const backup of toDelete) {
        await deleteBackup(backup.id);
      }
    }
  } catch (error) {
    console.error("Erro ao limpar backups antigos:", error);
  }
}
