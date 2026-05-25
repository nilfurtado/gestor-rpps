import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
  hint?: string;
}

export function KpiCard({ label, value, icon: Icon, tone = "default", hint }: KpiCardProps) {
  const ring = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        {/* Cabeçalho: ícone + label (linha única, ícone nunca compete com o valor) */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              ring
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>

        {/* Valor principal — ocupa 100% da largura do card */}
        <p className="mt-4 text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
          {value}
        </p>

        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
