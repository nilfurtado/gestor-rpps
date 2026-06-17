import { auth } from "@/lib/auth";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";
import type { LogLevel } from "@/types/backup";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get("level") as LogLevel | null;
    const search = searchParams.get("search");
    const days = parseInt(searchParams.get("days") || "7");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = logsService.getLogs({
      level: level || undefined,
      search: search || undefined,
      startDate,
    });

    const stats = logsService.getStats();

    return NextResponse.json({ logs, stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar logs" },
      { status: 500 }
    );
  }
}
