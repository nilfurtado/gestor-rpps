"use client";

import { AlertTriangle, AlertOctagon, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { CriticalAlert } from "@/lib/dashboard";

const ICON_MAP = {
  INADIMPLENCIA_CRITICA: AlertTriangle,
  ORGAO_NOVO_ATRASO: AlertCircle,
  ATRASO_EXTREMO: AlertOctagon,
  SUPERAVIT: TrendingUp,
};

const BADGE_COLORS = {
  critical: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

const BADGE_DOT = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export function AlertsCard({ data }: { data: CriticalAlert[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas críticos</CardTitle>
          <CardDescription>Situações que requerem atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm">Nenhum alerta crítico</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas críticos</CardTitle>
        <CardDescription>Situações que requerem atenção ({data.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((alert) => {
            const Icon = ICON_MAP[alert.tipo];
            const badgeClass = BADGE_COLORS[alert.severidade];
            const dotClass = BADGE_DOT[alert.severidade];

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${badgeClass}`}
              >
                <div className="mt-0.5 shrink-0">
                  <div className={`h-2 w-2 rounded-full ${dotClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{alert.orgaoSigla}</p>
                      <p className="text-xs opacity-75">{alert.orgaoNome}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-sm">{alert.mensagem}</p>
                  {alert.valor !== undefined && alert.valor > 0 && (
                    <p className="mt-1 text-xs font-semibold opacity-75">{formatBRL(alert.valor)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
