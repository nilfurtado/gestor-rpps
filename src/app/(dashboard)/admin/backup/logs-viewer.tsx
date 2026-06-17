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
            <SelectItem value="debug">Debug</SelectItem>
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
            {loading ? "Carregando logs..." : "Nenhum log encontrado"}
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
