import { AlertTriangle, CheckCircle2, Circle, FileClock, XCircle } from "lucide-react";
import type { LancamentoStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const META: Record<
  LancamentoStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "info"; Icon: typeof Circle }
> = {
  PAGO: { label: "Pago", variant: "success", Icon: CheckCircle2 },
  PARCIAL: { label: "Parcial", variant: "warning", Icon: AlertTriangle },
  INADIMPLENTE: { label: "Inadimplente", variant: "destructive", Icon: XCircle },
  PARCELADO: { label: "Parcelado", variant: "info", Icon: FileClock },
};

export function StatusBadge({ status }: { status: LancamentoStatus }) {
  const m = META[status];
  const Icon = m.Icon;
  return (
    <Badge variant={m.variant} aria-label={`Status: ${m.label}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {m.label}
    </Badge>
  );
}
