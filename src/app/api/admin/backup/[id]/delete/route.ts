import { auth } from "@/lib/auth";
import { deleteBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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
    await deleteBackup(id);

    logsService.addLog(
      "info",
      "Backup deletado",
      { backupId: id },
      session.user.email || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao deletar backup",
      { backupId: id, error }
    );
    return NextResponse.json(
      { error: "Erro ao deletar backup" },
      { status: 500 }
    );
  }
}
