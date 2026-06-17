import { auth } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let id: string | null = null;
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const resolved = await params;
    id = resolved.id;
    await restoreBackup(id);

    logsService.addLog(
      "warn",
      "Backup restaurado",
      { backupId: id },
      session.user.email || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao restaurar backup",
      { backupId: id, error }
    );
    return NextResponse.json(
      { error: "Erro ao restaurar backup" },
      { status: 500 }
    );
  }
}
