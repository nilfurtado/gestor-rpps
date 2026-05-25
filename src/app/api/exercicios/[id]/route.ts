import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageExercicios, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  status: z.enum(["ABERTO", "ENCERRADO"]),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageExercicios(session.user.role)) return forbidden();

  const { id } = await params;
  const exercicioId = Number(id);
  if (!Number.isInteger(exercicioId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const exercicio = await prisma.exercicio.findUnique({ where: { id: exercicioId } });
  if (!exercicio) return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });

  const updated = await prisma.exercicio.update({
    where: { id: exercicioId },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageExercicios(session.user.role)) return forbidden();

  const { id } = await params;
  const exercicioId = Number(id);
  if (!Number.isInteger(exercicioId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const count = await prisma.folhaPrevidenciaria.count({ where: { exercicioId } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Não é possível excluir: há ${count} lançamento(s) vinculado(s) a este exercício.` },
      { status: 409 }
    );
  }

  const exercicio = await prisma.exercicio.findUnique({ where: { id: exercicioId } });
  if (!exercicio) return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });

  await prisma.exercicio.delete({ where: { id: exercicioId } });
  return NextResponse.json({ ok: true });
}
