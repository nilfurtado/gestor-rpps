import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { orgaoSchema } from "@/lib/schemas";
import { recordAudit } from "@/lib/audit";
import { canManageOrgaos, forbidden } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgaos = await prisma.orgao.findMany({
    orderBy: { sigla: "asc" },
    include: { _count: { select: { lancamentos: true } } },
  });
  return NextResponse.json(orgaos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageOrgaos(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = orgaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const exists = await prisma.orgao.findUnique({ where: { sigla: parsed.data.sigla } });
  if (exists) {
    return NextResponse.json(
      { error: `Já existe um órgão com a sigla ${parsed.data.sigla}.` },
      { status: 409 }
    );
  }

  const created = await prisma.orgao.create({ data: parsed.data });
  await recordAudit({
    userId: session.user.id,
    entityType: "Orgao",
    entityId: created.id,
    action: "CREATE",
    after: created,
  });
  return NextResponse.json(created, { status: 201 });
}
