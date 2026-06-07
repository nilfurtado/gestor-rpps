import { useEffect, useRef, useCallback } from "react";

export type UpdateType = "lancamento" | "acordo" | "orgao" | "exercicio";
export type UpdateAction = "created" | "updated" | "deleted";

export interface RealtimeUpdate {
  type: UpdateType;
  action: UpdateAction;
  timestamp: string;
}

export function useRealtimeUpdates(
  onUpdate: (update: RealtimeUpdate) => void,
  enabled: boolean = true
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("/api/relatorios/updates");

      eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "connection") {
            onUpdate(data);
          }
        } catch (err) {
          console.error("Error parsing SSE message:", err);
        }
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();
        eventSourceRef.current = null;
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      });

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Error connecting to SSE:", err);
    }
  }, [enabled, onUpdate]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return { connected: !!eventSourceRef.current, disconnect };
}
