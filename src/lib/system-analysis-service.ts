import { logsService } from "@/lib/logs-service";
import { listBackups } from "@/lib/backup-service";

export interface SystemState {
  errorCount: number;
  warningCount: number;
  backupCount: number;
  lastBackupAge: string;
  hasRecentErrors: boolean;
}

export async function analyzeSystemState(): Promise<SystemState> {
  const stats = logsService.getStats();
  const backups = await listBackups();

  let lastBackupAge = "nunca";
  if (backups.length > 0) {
    const lastBackup = backups[0];
    const ageMs = Date.now() - lastBackup.createdAt.getTime();
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = Math.floor(ageHours / 24);

    if (ageDays > 0) {
      lastBackupAge = `${ageDays}d`;
    } else if (ageHours > 0) {
      lastBackupAge = `${ageHours}h`;
    } else {
      lastBackupAge = `${Math.floor(ageMs / (1000 * 60))}m`;
    }
  }

  return {
    errorCount: stats.errors,
    warningCount: stats.warnings,
    backupCount: backups.length,
    lastBackupAge,
    hasRecentErrors: stats.errors > 0,
  };
}

export function generateAutoDescription(state: SystemState): string {
  if (state.backupCount === 0) {
    return "SETUP-INICIAL";
  }

  if (state.errorCount >= 10) {
    return "CRITICO";
  }

  if (state.errorCount >= 5) {
    return "ANTES-FIX";
  }

  if (state.lastBackupAge !== "nunca" && state.lastBackupAge.includes("d")) {
    const days = parseInt(state.lastBackupAge);
    if (days > 7) {
      return "BACKUP-ATRASADO";
    }
  }

  if (state.errorCount === 0 && state.warningCount === 0) {
    return "SISTEMA-OK";
  }

  return "BACKUP-ROTINA";
}
