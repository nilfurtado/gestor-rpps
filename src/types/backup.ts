export type BackupStatus = "healthy" | "error" | "pending";

export interface Backup {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  status: BackupStatus;
  downloadUrl?: string;
}

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
}

export interface BackupSuggestion {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
  resolved?: boolean;
}
