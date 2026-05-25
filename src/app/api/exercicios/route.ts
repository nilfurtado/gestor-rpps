import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageExercicios, forbidden } from "@/lib/permissions";

const createSchema = z.object({
  ano: z.coerce
    .number()
    .int()
    .min(2000, "Ano deve ser >= 2000")
    .max(2100, "Ano inválido"),
  status: z.enum(["ABERTO", "ENCERRADO"]).default("ABERTO"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exercicios = await prisma.exercicio.findMany({
    orderBy: { ano: "desc" },
    include: { _count: { select: { lancamentos: true } } },
  });
  return NextResponse.json(exercicios);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageExercicios(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const exists = await prisma.exercicio.findUnique({ where: { ano: parsed.data.ano } });
  if (exists) {
    return NextResponse.json(
      { error: `Exercício ${parsed.data.ano} já está cadastrado.` },
      { status: 409 }
    );
  }

  const created = await prisma.exercicio.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
