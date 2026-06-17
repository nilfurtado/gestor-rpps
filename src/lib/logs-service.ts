import type { SystemLog, LogLevel } from "@/types/backup";

class LogsService {
  private logs: SystemLog[] = [];
  private maxLogs = 1000;

  addLog(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    userId?: string
  ) {
    const log: SystemLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
      context,
      userId,
    };

    this.logs.unshift(log);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(
    filters?: {
      level?: LogLevel;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ): SystemLog[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters?.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(
        (log) => log.timestamp >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }

  getStats() {
    return {
      total: this.logs.length,
      errors: this.logs.filter((l) => l.level === "error").length,
      warnings: this.logs.filter((l) => l.level === "warn").length,
      info: this.logs.filter((l) => l.level === "info").length,
    };
  }
}

export const logsService = new LogsService();
