import { auth } from "@/lib/auth";
import { deleteBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
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

    await deleteBackup(params.id);

    logsService.addLog(
      "info",
      "Backup deletado",
      { backupId: params.id },
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logsService.addLog(
      "error",
      "Erro ao deletar backup",
      { backupId: params.id, error }
    );
    return NextResponse.json(
      { error: "Erro ao deletar backup" },
      { status: 500 }
    );
  }
}
