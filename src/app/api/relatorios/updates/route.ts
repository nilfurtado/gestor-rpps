import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Store active SSE connections with timeout cleanup
const connections = new Map<ReadableStreamDefaultController, NodeJS.Timeout>();
const MAX_CONNECTIONS = 50;
const CONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Broadcast update to all connected clients
export function broadcastUpdate(data: {
  type: "lancamento" | "acordo" | "orgao" | "exercicio";
  action: "created" | "updated" | "deleted";
  timestamp: string;
}) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const deadConnections: ReadableStreamDefaultController[] = [];

  connections.forEach((timeout, controller) => {
    try {
      controller.enqueue(message);
    } catch (err) {
      deadConnections.push(controller);
    }
  });

  // Remove dead connections
  deadConnections.forEach((controller) => {
    const timeout = connections.get(controller);
    if (timeout) clearTimeout(timeout);
    connections.delete(controller);
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Limit concurrent connections
  if (connections.size >= MAX_CONNECTIONS) {
    return NextResponse.json({ error: "Too many connections" }, { status: 429 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: "connection",
        status: "connected",
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Set timeout to auto-close stale connections
      const timeout = setTimeout(() => {
        connections.delete(controller);
        try {
          controller.close();
        } catch {}
      }, CONNECTION_TIMEOUT);

      connections.set(controller, timeout);

      // Send keep-alive every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(`: keep-alive\n\n`);
        } catch (err) {
          clearInterval(keepAliveInterval);
          const t = connections.get(controller);
          if (t) clearTimeout(t);
          connections.delete(controller);
        }
      }, 30000);

      // Cleanup on stream close
      return () => {
        clearInterval(keepAliveInterval);
        const t = connections.get(controller);
        if (t) clearTimeout(t);
        connections.delete(controller);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
