import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { lancamentoSchema } from "@/lib/schemas";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { recordAudit } from "@/lib/audit";
import { canManageLancamentos, forbidden } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const orgaoId = url.searchParams.get("orgaoId");
  const exercicioId = url.searchParams.get("exercicioId");
  const competenciaId = url.searchParams.get("competenciaId");
  const tipo = url.searchParams.get("tipo");
  const status = url.searchParams.get("status");

  const where: Prisma.FolhaPrevidenciariaWhereInput = {
    ...(orgaoId ? { orgaoId: Number(orgaoId) } : {}),
    ...(exercicioId ? { exercicioId: Number(exercicioId) } : {}),
    ...(competenciaId ? { competenciaId: Number(competenciaId) } : {}),
    ...(tipo === "PATRONAL" || tipo === "SEGURADO" ? { tipo } : {}),
    ...(status &&
    ["PAGO", "PARCIAL", "INADIMPLENTE", "PARCELADO"].includes(status)
      ? { status: status as Prisma.FolhaPrevidenciariaWhereInput["status"] }
      : {}),
  };

  const data = await prisma.folhaPrevidenciaria.findMany({
    where,
    include: {
      orgao: { select: { id: true, sigla: true, nome: true } },
      exercicio: { select: { id: true, ano: true, status: true } },
      competencia: { select: { id: true, ordem: true, mes: true } },
    },
    orderBy: [
      { exercicio: { ano: "desc" } },
      { competencia: { ordem: "asc" } },
      { orgao: { sigla: "asc" } },
    ],
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageLancamentos(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = lancamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const exercicio = await prisma.exercicio.findUnique({
    where: { id: parsed.data.exercicioId },
  });
  if (!exercicio) {
    return NextResponse.json({ error: "Exercício inexistente." }, { status: 400 });
  }
  if (exercicio.status === "ENCERRADO") {
    return NextResponse.json(
      { error: `Exercício ${exercicio.ano} está encerrado. Edição bloqueada.` },
      { status: 409 }
    );
  }

  const dup = await prisma.folhaPrevidenciaria.findUnique({
    where: {
      orgaoId_tipo_exercicioId_competenciaId: {
        orgaoId: parsed.data.orgaoId,
        tipo: parsed.data.tipo,
        exercicioId: parsed.data.exercicioId,
        competenciaId: parsed.data.competenciaId,
      },
    },
  });
  if (dup) {
    return NextResponse.json(
      {
        error:
          "Já existe lançamento desta competência para este órgão e tipo. Edite o registro existente.",
      },
      { status: 409 }
    );
  }

  const calc = calcularLancamento(parsed.data);

  const created = await prisma.folhaPrevidenciaria.create({
    data: {
      ...parsed.data,
      responsavelId: Number(session.user.id),
      deficit: calc.deficit,
      inadimplencia: calc.inadimplencia,
      status: calc.status,
    },
    include: {
      orgao: true,
      exercicio: true,
      competencia: true,
    },
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "FolhaPrevidenciaria",
    entityId: created.id,
    action: "CREATE",
    after: created,
  });

  return NextResponse.json(created, { status: 201 });
}
