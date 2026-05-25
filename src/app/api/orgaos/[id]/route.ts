import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgaoSchema } from "@/lib/schemas";
import { recordAudit } from "@/lib/audit";
import { canManageOrgaos, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageOrgaos(session.user.role)) return forbidden();

  const { id } = await params;
  const orgaoId = Number(id);
  if (!Number.isInteger(orgaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.orgao.findUnique({ where: { id: orgaoId } });
  if (!before) return NextResponse.json({ error: "Órgão não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = orgaoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.sigla && parsed.data.sigla !== before.sigla) {
    const conflict = await prisma.orgao.findUnique({
      where: { sigla: parsed.data.sigla },
    });
    if (conflict) {
      return NextResponse.json(
        { error: `Sigla ${parsed.data.sigla} já está em uso.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.orgao.update({
    where: { id: orgaoId },
    data: parsed.data,
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "Orgao",
    entityId: orgaoId,
    action: "UPDATE",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageOrgaos(session.user.role)) return forbidden();

  const { id } = await params;
  const orgaoId = Number(id);
  if (!Number.isInteger(orgaoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const count = await prisma.folhaPrevidenciaria.count({ where: { orgaoId } });
  if (count > 0) {
    return NextResponse.json(
      {
        error: `Não é possível excluir: há ${count} lançamento(s) vinculado(s) a este órgão.`,
      },
      { status: 409 }
    );
  }

  const before = await prisma.orgao.findUnique({ where: { id: orgaoId } });
  if (!before) return NextResponse.json({ error: "Órgão não encontrado" }, { status: 404 });

  await prisma.orgao.delete({ where: { id: orgaoId } });
  await recordAudit({
    userId: session.user.id,
    entityType: "Orgao",
    entityId: orgaoId,
    action: "DELETE",
    before,
  });
  return NextResponse.json({ ok: true });
}
