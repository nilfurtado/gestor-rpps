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
      description:
        "Nenhum backup foi criado ainda. É recomendado fazer um backup agora para proteger seus dados.",
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

  // Sugestão 3: Monitoramento de avisos
  if (logWarnings > 20) {
    suggestions.push({
      id: "log-2",
      priority: "medium",
      title: "Avisos acumulando",
      description: `${logWarnings} avisos detectados. Algumas operações podem estar falhando silenciosamente.`,
    });
  }

  // Sugestão 4: Saúde geral
  if (logErrors === 0 && backupCount >= 5) {
    suggestions.push({
      id: "health-1",
      priority: "low",
      title: "Sistema saudável",
      description:
        "Sem erros recentes e backups em dia. Continuar monitorando regularmente.",
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
                    <div className="font-medium text-sm">{suggestion.title}</div>
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
