import { CheckCircle2, Circle, FileClock, PauseCircle, XCircle } from "lucide-react";
import type { StatusAcordo } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const META: Record<
  StatusAcordo,
  { label: string; variant: "success" | "warning" | "destructive" | "info"; Icon: typeof Circle }
> = {
  VIGENTE: { label: "Vigente", variant: "success", Icon: FileClock },
  QUITADO: { label: "Quitado", variant: "info", Icon: CheckCircle2 },
  RESCINDIDO: { label: "Rescindido", variant: "destructive", Icon: XCircle },
  SUSPENSO: { label: "Suspenso", variant: "warning", Icon: PauseCircle },
};

export function AcordoStatusBadge({ status }: { status: StatusAcordo }) {
  const m = META[status];
  const Icon = m.Icon;
  return (
    <Badge variant={m.variant} aria-label={`Status: ${m.label}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {m.label}
    </Badge>
  );
}
