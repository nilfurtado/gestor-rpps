import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { lancamentoSchema } from "@/lib/schemas";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { recordAudit } from "@/lib/audit";
import { canManageLancamentos, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageLancamentos(session.user.role)) return forbidden();

  const { id } = await params;
  const lid = Number(id);
  if (!Number.isInteger(lid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.folhaPrevidenciaria.findUnique({
    where: { id: lid },
    include: { exercicio: true },
  });
  if (!before) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  if (before.exercicio.status === "ENCERRADO") {
    return NextResponse.json(
      { error: `Exercício ${before.exercicio.ano} está encerrado. Edição bloqueada.` },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = lancamentoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const merged = {
    valorRecolher: parsed.data.valorRecolher ?? Number(before.valorRecolher),
    valorRecolhido: parsed.data.valorRecolhido ?? Number(before.valorRecolhido),
    parcelado: parsed.data.parcelado ?? before.parcelado,
  };
  const calc = calcularLancamento(merged);

  const updated = await prisma.folhaPrevidenciaria.update({
    where: { id: lid },
    data: {
      ...parsed.data,
      deficit: calc.deficit,
      inadimplencia: calc.inadimplencia,
      status: calc.status,
    },
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "FolhaPrevidenciaria",
    entityId: lid,
    action: "UPDATE",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageLancamentos(session.user.role)) return forbidden();

  const { id } = await params;
  const lid = Number(id);
  if (!Number.isInteger(lid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.folhaPrevidenciaria.findUnique({
    where: { id: lid },
    include: { exercicio: true },
  });
  if (!before) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  if (before.exercicio.status === "ENCERRADO") {
    return NextResponse.json(
      { error: `Exercício ${before.exercicio.ano} está encerrado. Exclusão bloqueada.` },
      { status: 409 }
    );
  }

  await prisma.folhaPrevidenciaria.delete({ where: { id: lid } });
  await recordAudit({
    userId: session.user.id,
    entityType: "FolhaPrevidenciaria",
    entityId: lid,
    action: "DELETE",
    before,
  });
  return NextResponse.json({ ok: true });
}
