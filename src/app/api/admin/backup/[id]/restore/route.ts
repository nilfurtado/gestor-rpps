import { auth } from "@/lib/auth";
import { restoreBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    await restoreBackup(params.id);

    logsService.addLog(
      "warn",
      "Backup restaurado",
      { backupId: params.id },
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao restaurar backup",
      { backupId: params.id, error }
    );
    return NextResponse.json(
      { error: "Erro ao restaurar backup" },
      { status: 500 }
    );
  }
}
