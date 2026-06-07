"use client";

import { useEffect, useState } from "react";
import { useRealtimeUpdates } from "@/lib/hooks/useRealtimeUpdates";
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";

export function RealtimeBadge() {
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const { connected } = useRealtimeUpdates((update) => {
    setUpdateCount((prev) => prev + 1);
    setLastUpdate(update.timestamp);
  });

  return (
    <div className="flex items-center gap-2">
      <Badge variant={connected ? "default" : "secondary"} className="gap-1">
        <Wifi className="h-3 w-3" />
        {connected ? "Tempo real" : "Desconectado"}
      </Badge>
      {updateCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {updateCount} atualização{updateCount !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
