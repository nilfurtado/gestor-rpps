# Página de Backup e Logs - Implementation Plan

> **Para execução:** Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para implementar este plano tarefa por tarefa.

**Objetivo:** Criar página de administração para gerenciar backups do banco de dados, visualizar logs do sistema e fornecer sugestões automáticas de manutenção.

**Arquitetura:** Sistema modular com três camadas:
1. **API (`/api/admin/backup`)** - Endpoints para listar, criar, restaurar backups e logs
2. **Componentes UI** - Tabelas de backups, viewer de logs, card de sugestões
3. **Página Dashboard** - Layout integrado com sidebar e topbar existentes

**Tech Stack:**
- Next.js 16.2.6 (API Routes)
- Prisma 6.19.3 (para futuros registros de logs)
- React 19.2.4 + TypeScript
- TanStack React Table (tabelas)
- Tailwind CSS 4 (estilos)
- Lucide React (ícones)
- date-fns 4.3.0 (formatação de datas)

## Global Constraints

- Rotas sob `/admin` exigem role `GESTOR`
- Backups armazenados em `./backups/` (SQLite)
- Máx 8 backups retidos (~2 meses)
- Logs em memória (próxima: persistência Prisma)
- Sem breaking changes em APIs existentes
- Compatível com dark mode (next-themes)

---

## Estrutura de Arquivos

```
src/app/(dashboard)/
├── admin/
│   └── backup/
│       ├── page.tsx                 # Página principal
│       ├── backup-table.tsx         # Tabela de backups
│       ├── logs-viewer.tsx          # Viewer de logs
│       ├── suggestions-card.tsx     # Card de sugestões
│       └── backup-actions.tsx       # Diálogos e ações

src/app/api/admin/
├── backup/
│   ├── route.ts                     # GET/POST backups
│   ├── [id]/
│   │   ├── restore/route.ts         # POST restore backup
│   │   └── delete/route.ts          # DELETE backup
│   └── logs/route.ts                # GET logs com filtros

src/lib/
├── backup-service.ts                # Serviço de backup (shell/fs)
├── logs-service.ts                  # Serviço de logs em memória
└── backup-utils.ts                  # Helpers (tamanho, data, etc)

src/types/
└── backup.ts                        # Types de backup e logs
```

---

## Task 1: Tipos e Interfaces

**Files:**
- Create: `src/types/backup.ts`

**Produces:**
- `type Backup = { id: string; filename: string; size: number; createdAt: Date; status: "healthy" | "error" }`
- `type SystemLog = { id: string; timestamp: Date; level: "info" | "warn" | "error"; message: string; context?: Record<string, any> }`
- `interface BackupSuggestion = { id: string; priority: "high" | "medium" | "low"; title: string; description: string; action?: () => Promise<void> }`

- [ ] **Step 1: Criar arquivo de tipos**

```typescript
// src/types/backup.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/backup.ts
git commit -m "types: adicionar tipos de backup e logs"
```

---

## Task 2: Serviço de Backup (fs/shell)

**Files:**
- Create: `src/lib/backup-service.ts`

**Produces:**
- `listBackups(): Promise<Backup[]>`
- `createBackup(): Promise<Backup>`
- `restoreBackup(id: string): Promise<void>`
- `deleteBackup(id: string): Promise<void>`
- `getBackupSize(filename: string): number`

- [ ] **Step 1: Criar serviço de backup**

```typescript
// src/lib/backup-service.ts
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Backup } from "@/types/backup";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "data", "database.db");
const MAX_BACKUPS = 8;

export async function ensureBackupDir() {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error("Erro ao criar diretório de backups:", error);
  }
}

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

    // Manter apenas os últimos MAX_BACKUPS
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

export async function restoreBackup(id: string): Promise<void> {
  const backupPath = path.join(BACKUP_DIR, `${id}.db`);

  try {
    // Criar backup da versão atual antes de restaurar
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/backup-service.ts
git commit -m "feat: adicionar serviço de backup com copy/restore"
```

---

## Task 3: Serviço de Logs

**Files:**
- Create: `src/lib/logs-service.ts`

**Produces:**
- `addLog(level, message, context?): void`
- `getLogs(filters?): SystemLog[]`
- `clearLogs(): void`

- [ ] **Step 1: Criar serviço de logs em memória**

```typescript
// src/lib/logs-service.ts
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

    // Manter apenas os últimos maxLogs
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

// Singleton
export const logsService = new LogsService();
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/logs-service.ts
git commit -m "feat: adicionar serviço de logs em memória"
```

---

## Task 4: API - Listar e Criar Backups

**Files:**
- Create: `src/app/api/admin/backup/route.ts`

**Produces:**
- `GET /api/admin/backup` → `{ backups: Backup[] }`
- `POST /api/admin/backup` → `{ backup: Backup }`

- [ ] **Step 1: Criar API route para backups**

```typescript
// src/app/api/admin/backup/route.ts
import { auth } from "@/lib/auth";
import { listBackups, createBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const backups = await listBackups();

    logsService.addLog("info", "Listou backups", {
      count: backups.length,
    });

    return NextResponse.json({ backups });
  } catch (error) {
    logsService.addLog("error", "Erro ao listar backups", { error });
    return NextResponse.json(
      { error: "Erro ao listar backups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const backup = await createBackup();

    logsService.addLog(
      "info",
      "Backup criado com sucesso",
      { backupId: backup.id, size: backup.size },
      session.user.email
    );

    return NextResponse.json({ backup });
  } catch (error) {
    logsService.addLog("error", "Erro ao criar backup", { error });
    return NextResponse.json(
      { error: "Erro ao criar backup" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/backup/route.ts
git commit -m "feat: adicionar GET/POST /api/admin/backup"
```

---

## Task 5: API - Restaurar e Deletar Backups

**Files:**
- Create: `src/app/api/admin/backup/[id]/restore/route.ts`
- Create: `src/app/api/admin/backup/[id]/delete/route.ts`

**Produces:**
- `POST /api/admin/backup/[id]/restore` → `{ success: true }`
- `DELETE /api/admin/backup/[id]/delete` → `{ success: true }`

- [ ] **Step 1: Criar route de restore**

```typescript
// src/app/api/admin/backup/[id]/restore/route.ts
import { auth } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    await restoreBackup(params.id);

    logsService.addLog(
      "warn",
      "Backup restaurado",
      { backupId: params.id },
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao restaurar backup",
      { backupId: params.id, error }
    );
    return NextResponse.json(
      { error: "Erro ao restaurar backup" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Criar route de delete**

```typescript
// src/app/api/admin/backup/[id]/delete/route.ts
import { auth } from "@/lib/auth";
import { deleteBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    await deleteBackup(params.id);

    logsService.addLog(
      "info",
      "Backup deletado",
      { backupId: params.id },
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao deletar backup",
      { backupId: params.id, error }
    );
    return NextResponse.json(
      { error: "Erro ao deletar backup" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/backup/[id]/restore/route.ts src/app/api/admin/backup/[id]/delete/route.ts
git commit -m "feat: adicionar routes de restore e delete de backups"
```

---

## Task 6: API - Logs

**Files:**
- Create: `src/app/api/admin/backup/logs/route.ts`

**Produces:**
- `GET /api/admin/backup/logs?level=error&search=fail` → `{ logs: SystemLog[] }`

- [ ] **Step 1: Criar API route de logs**

```typescript
// src/app/api/admin/backup/logs/route.ts
import { auth } from "@/lib/auth";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";
import type { LogLevel } from "@/types/backup";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as LogLevel | null;
    const search = searchParams.get("search");
    const days = parseInt(searchParams.get("days") || "7");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = logsService.getLogs({
      level: level || undefined,
      search: search || undefined,
      startDate,
    });

    const stats = logsService.getStats();

    return NextResponse.json({ logs, stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar logs" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/backup/logs/route.ts
git commit -m "feat: adicionar GET /api/admin/backup/logs com filtros"
```

---

## Task 7: Componente - Tabela de Backups

**Files:**
- Create: `src/app/(dashboard)/admin/backup/backup-table.tsx`

**Consumes:**
- `type Backup` (Task 1)
- `GET /api/admin/backup` (Task 4)

**Produces:**
- `<BackupTable backups={Backup[]} onRefresh={() => void} />`

- [ ] **Step 1: Criar componente de tabela**

```typescript
// src/app/(dashboard)/admin/backup/backup-table.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Download,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { Backup } from "@/types/backup";
import { useState } from "react";
import { toast } from "sonner";

interface BackupTableProps {
  backups: Backup[];
  onRefresh: () => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function BackupTable({
  backups,
  onRefresh,
  onRestore,
  onDelete,
}: BackupTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    if (
      !confirm(
        "Tem certeza? Esta ação vai sobrescrever o banco de dados atual."
      )
    ) {
      return;
    }

    setLoading(id);
    try {
      await onRestore(id);
      toast.success("Backup restaurado com sucesso");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao restaurar backup");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este backup?")) {
      return;
    }

    setLoading(id);
    try {
      await onDelete(id);
      toast.success("Backup deletado");
      await onRefresh();
    } catch (error) {
      toast.error("Erro ao deletar backup");
    } finally {
      setLoading(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Arquivo</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {backups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum backup encontrado
              </TableCell>
            </TableRow>
          ) : (
            backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>
                  {backup.status === "healthy" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {backup.filename}
                </TableCell>
                <TableCell>{formatBytes(backup.size)}</TableCell>
                <TableCell>
                  {format(backup.createdAt, "dd MMM yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                      onClick={() => handleRestore(backup.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading === backup.id}
                      onClick={() => handleDelete(backup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/backup/backup-table.tsx
git commit -m "feat: adicionar componente BackupTable"
```

---

## Task 8: Componente - Viewer de Logs

**Files:**
- Create: `src/app/(dashboard)/admin/backup/logs-viewer.tsx`

**Consumes:**
- `type SystemLog` (Task 1)
- `GET /api/admin/backup/logs` (Task 6)

**Produces:**
- `<LogsViewer />`

- [ ] **Step 1: Criar componente de logs**

```typescript
// src/app/(dashboard)/admin/backup/logs-viewer.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { SystemLog, LogLevel } from "@/types/backup";

export function LogsViewer() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [level, setLevel] = useState<LogLevel | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level !== "all") params.append("level", level);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/backup/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [level, search]);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={level} onValueChange={(v) => setLevel(v as LogLevel | "all")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="warn">Aviso</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar nos logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Nenhum log encontrado
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex gap-3 text-sm p-2 rounded border-l-2 border-l-muted hover:bg-muted/50 transition"
            >
              <div className="pt-0.5">{getLogIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-2 items-center">
                  <Badge
                    variant={getLevelColor(log.level)}
                    className="text-xs"
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(log.timestamp, "HH:mm:ss", { locale: ptBR })}
                  </span>
                  {log.userId && (
                    <span className="text-xs text-muted-foreground">
                      por {log.userId}
                    </span>
                  )}
                </div>
                <p className="text-foreground break-words">{log.message}</p>
                {log.context && (
                  <pre className="text-xs bg-muted p-1 rounded mt-1 overflow-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/backup/logs-viewer.tsx
git commit -m "feat: adicionar componente LogsViewer com filtros"
```

---

## Task 9: Componente - Card de Sugestões

**Files:**
- Create: `src/app/(dashboard)/admin/backup/suggestions-card.tsx`

**Produces:**
- `<SuggestionsCard backupCount={number} logErrors={number} />`

- [ ] **Step 1: Criar componente de sugestões**

```typescript
// src/app/(dashboard)/admin/backup/suggestions-card.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";
import type { BackupSuggestion } from "@/types/backup";

interface SuggestionsCardProps {
  backupCount: number;
  logErrors: number;
  logWarnings: number;
}

export function SuggestionsCard({
  backupCount,
  logErrors,
  logWarnings,
}: SuggestionsCardProps) {
  const suggestions: BackupSuggestion[] = [];

  // Sugestão 1: Manutenção de backups
  if (backupCount === 0) {
    suggestions.push({
      id: "backup-1",
      priority: "high",
      title: "Criar primeiro backup",
      description: "Nenhum backup foi criado ainda. É recomendado fazer um backup agora para proteger seus dados.",
    });
  } else if (backupCount < 3) {
    suggestions.push({
      id: "backup-2",
      priority: "medium",
      title: "Aumentar frequência de backups",
      description: `Você tem apenas ${backupCount} backup(s). É recomendado manter entre 5-8 backups para melhor recuperação.`,
    });
  } else {
    suggestions.push({
      id: "backup-3",
      priority: "low",
      title: "Backups em dia",
      description: `Sistema com ${backupCount} backups - está bem protegido!`,
    });
  }

  // Sugestão 2: Monitoramento de erros
  if (logErrors > 10) {
    suggestions.push({
      id: "log-1",
      priority: "high",
      title: "Muitos erros detectados",
      description: `${logErrors} erros nos últimos 7 dias. Revise os logs para identificar problemas.`,
    });
  }

  if (logWarnings > 20) {
    suggestions.push({
      id: "log-2",
      priority: "medium",
      title: "Avisos acumulando",
      description: `${logWarnings} avisos detectados. Algumas operações podem estar falhando silenciosamente.`,
    });
  }

  // Sugestão 3: Saúde geral
  if (logErrors === 0 && backupCount >= 5) {
    suggestions.push({
      id: "health-1",
      priority: "low",
      title: "Sistema saudável",
      description: "Sem erros recentes e backups em dia. Continuar monitorando regularmente.",
    });
  }

  const priorityIcon = {
    high: <AlertCircle className="h-4 w-4 text-red-500" />,
    medium: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    low: <CheckCircle className="h-4 w-4 text-green-500" />,
  };

  const priorityColor = {
    high: "destructive",
    medium: "secondary",
    low: "default",
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestões
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sugestão no momento
            </p>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="border rounded-lg p-3 space-y-1"
              >
                <div className="flex items-start gap-2">
                  {priorityIcon[suggestion.priority]}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {suggestion.title}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                  <Badge
                    variant={priorityColor[suggestion.priority]}
                    className="text-xs"
                  >
                    {suggestion.priority}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/backup/suggestions-card.tsx
git commit -m "feat: adicionar componente SuggestionsCard"
```

---

## Task 10: Página Principal - Backup & Logs

**Files:**
- Create: `src/app/(dashboard)/admin/backup/page.tsx`

**Consumes:**
- `BackupTable` (Task 7)
- `LogsViewer` (Task 8)
- `SuggestionsCard` (Task 9)
- `GET /api/admin/backup` (Task 4)
- `GET /api/admin/backup/logs` (Task 6)

**Produces:**
- Página em `/admin/backup`

- [ ] **Step 1: Criar página principal**

```typescript
// src/app/(dashboard)/admin/backup/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BackupTable } from "./backup-table";
import { LogsViewer } from "./logs-viewer";
import { SuggestionsCard } from "./suggestions-card";
import { Plus, RotateCw } from "lucide-react";
import type { Backup } from "@/types/backup";

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState({ total: 0, errors: 0, warnings: 0, info: 0 });

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/admin/backup");
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      toast.error("Erro ao carregar backups");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/backup/logs");
      const data = await res.json();
      setStats(data.stats || { total: 0, errors: 0, warnings: 0, info: 0 });
    } catch (error) {
      console.error("Erro ao carregar stats:", error);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST" });
      if (res.ok) {
        toast.success("Backup criado com sucesso!");
        await fetchBackups();
      } else {
        toast.error("Erro ao criar backup");
      }
    } catch (error) {
      toast.error("Erro ao criar backup");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/admin/backup/${id}/restore`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Erro ao restaurar");
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/backup/${id}/delete`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup & Logs</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie backups do banco de dados e visualize logs do sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Backups</div>
          <div className="text-2xl font-bold">{backups.length}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Erros</div>
          <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Avisos</div>
          <div className="text-2xl font-bold text-yellow-500">
            {stats.warnings}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Logs</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
      </div>

      {/* Sugestões */}
      <SuggestionsCard
        backupCount={backups.length}
        logErrors={stats.errors}
        logWarnings={stats.warnings}
      />

      {/* Backups Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Backups</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBackups()}
              disabled={loading}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleCreateBackup}
              disabled={creating}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Backup
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando backups...
          </div>
        ) : (
          <BackupTable
            backups={backups}
            onRefresh={fetchBackups}
            onRestore={handleRestore}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Logs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Logs do Sistema</h2>
        <LogsViewer />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/admin/backup/page.tsx
git commit -m "feat: adicionar página /admin/backup com dashboard completo"
```

---

## Task 11: Verificação e Testes

- [ ] **Step 1: Verificar autenticação**

Tente acessar `/admin/backup` sem estar logado:
```bash
curl http://localhost:3002/admin/backup
```
Esperado: Redirect para login ou erro 403

- [ ] **Step 2: Verificar acesso GESTOR**

Login como `gestor` / `admin123` e acesse `/admin/backup`
Esperado: Página carrega com backups vazios e sugestão para criar primeiro backup

- [ ] **Step 3: Testar criar backup**

Clique no botão "Novo Backup"
Esperado: Toast "Backup criado com sucesso" + backup aparece na tabela

- [ ] **Step 4: Testar visualizar logs**

Abra a aba "Logs do Sistema"
Esperado: Aparecem logs da ação anterior (backup criado)

- [ ] **Step 5: Testar filtros de logs**

Altere o filtro para "Erro" e busque por "backup"
Esperado: Logs filtrados conforme critério

- [ ] **Step 6: Verificar sugestões**

Com 1 backup e sem erros, a sugestão deve ser "Aumentar frequência"
Esperado: Card mostra sugestão com prioridade medium

---

## Task 12: Documentação e Polish

- [ ] **Step 1: Adicionar comentários nos serviços**

Adicione JSDoc nos métodos principais de `backup-service.ts`

- [ ] **Step 2: Criar README.md**

```markdown
# Backup & Logs Manager

## Features

- ✅ Criar backups do banco de dados
- ✅ Listar e visualizar backups
- ✅ Restaurar backups com confirmação
- ✅ Deletar backups antigos
- ✅ Visualizar logs do sistema com filtros
- ✅ Sugestões automáticas de manutenção

## Acesso

Somente usuários com role `GESTOR` podem acessar `/admin/backup`

## Estrutura

- Backups salvos em `./backups/`
- Máximo 8 backups retidos (~2 meses)
- Logs em memória (até 1000 entradas)
- Próxima: Persistência de logs em Prisma
```

- [ ] **Step 3: Commit final**

```bash
git add docs/
git commit -m "docs: adicionar documentação de backup & logs"
```

---

## Verificação Spec Coverage

✅ Página de backup com CRUD (criar, listar, restaurar, deletar)
✅ Visualizador de logs com filtros (level, search, date)
✅ Card de sugestões automáticas (baseadas em backups e erros)
✅ Proteção por role (GESTOR)
✅ Integração com sidebar/layout existentes
✅ Dark mode compatível
✅ Sem breaking changes

**Próximas melhorias (fora do escopo):**
- Persistência de logs em Prisma
- Download de backup via HTTP
- Agendamento automático de backups
- Alertas por email
