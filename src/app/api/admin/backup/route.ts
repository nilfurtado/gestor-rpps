import { auth } from "@/lib/auth";
import { listBackups, createBackup } from "@/lib/backup-service";
import { logsService } from "@/lib/logs-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const backups = await listBackups();

    logsService.addLog("info", "Listou backups", {
      count: backups.length,
    });

    return NextResponse.json({ backups });
  } catch (error) {
    logsService.addLog("error", "Erro ao listar backups", { error });
    return NextResponse.json(
      { error: "Erro ao listar backups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const { description } = await request.json();

    const backup = await createBackup(description);

    logsService.addLog(
      "info",
      "Backup criado com sucesso",
      { backupId: backup.id, size: backup.size, description },
      session.user.email || undefined
    );

    return NextResponse.json({ backup });
  } catch (error) {
    logsService.addLog("error", "Erro ao criar backup", { error });
    return NextResponse.json(
      { error: "Erro ao criar backup" },
      { status: 500 }
    );
  }
}
