import { prisma } from "@/lib/db";

interface AuditParams {
  userId?: string | number | null;
  entityType: "FolhaPrevidenciaria" | "Orgao" | "User" | "Acordo";
  entityId: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:
          params.userId == null
            ? null
            : typeof params.userId === "string"
            ? Number(params.userId)
            : params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        before: (params.before ?? null) as never,
        after: (params.after ?? null) as never,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err);
  }
}
