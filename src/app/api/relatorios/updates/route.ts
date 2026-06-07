import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Store active SSE connections
const connections = new Set<ReadableStreamDefaultController>();

// Broadcast update to all connected clients
export function broadcastUpdate(data: {
  type: "lancamento" | "acordo" | "orgao" | "exercicio";
  action: "created" | "updated" | "deleted";
  timestamp: string;
}) {
  const message = `data: ${JSON.stringify(data)}\n\n`;

  connections.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (err) {
      connections.delete(controller);
    }
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add connection to set
      connections.add(controller);

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({
        type: "connection",
        status: "connected",
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Handle client disconnect
      const onClose = () => {
        connections.delete(controller);
      };

      // Send keep-alive every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(`: keep-alive\n\n`);
        } catch (err) {
          clearInterval(keepAliveInterval);
          onClose();
        }
      }, 30000);

      // Cleanup on stream close
      return () => {
        clearInterval(keepAliveInterval);
        onClose();
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
