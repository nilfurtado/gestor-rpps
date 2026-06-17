import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { lancamentoSchema } from "@/lib/schemas";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { recordAudit } from "@/lib/audit";
import { canManageLancamentos, forbidden } from "@/lib/permissions";
import { broadcastUpdate } from "@/app/api/relatorios/updates/route";

export async function GET() {
  return NextResponse.json([], { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLancamentos(session.user.role)) return forbidden();

    const body = await req.json();
  const parsed = lancamentoSchema.safeParse(body);

  if (!parsed.success) {
    console.error("❌ Validação falhou:", parsed.error.flatten());
    parsed.error.issues.forEach((issue) => {
      console.error(`   Campo: ${issue.path.join('.')} | ${issue.message}`);
    });
  }

  const data = parsed.success ? parsed.data : body;

  // Converter string dataVencimento para Date se for string
  if (typeof data.dataVencimento === 'string') {
    data.dataVencimento = data.dataVencimento ? new Date(data.dataVencimento) : null;
  }

  const exercicio = await prisma.exercicio.findUnique({
    where: { id: data.exercicioId },
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

  const competencia = await prisma.competencia.findUnique({
    where: { id: data.competenciaId },
  });
  if (!competencia) {
    return NextResponse.json({ error: "Competência inexistente." }, { status: 400 });
  }

  const currentMonth = new Date().getMonth() + 1;
  const isRetroativo = exercicio.ano < new Date().getFullYear() ||
    (exercicio.ano === new Date().getFullYear() && competencia.ordem < currentMonth);
  if (isRetroativo && competencia.ordem < 1) {
    return NextResponse.json(
      { error: "Não é permitido lançar em período muito retroativo (> 12 meses)." },
      { status: 400 }
    );
  }

  const dup = await prisma.folhaPrevidenciaria.findUnique({
    where: {
      orgaoId_tipo_exercicioId_competenciaId: {
        orgaoId: data.orgaoId,
        tipo: data.tipo,
        exercicioId: data.exercicioId,
        competenciaId: data.competenciaId,
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

  const calc = calcularLancamento({
    ...data,
    diferenca_aprovada: data.diferenca_aprovada ?? false,
  });

  const created = await prisma.folhaPrevidenciaria.create({
    data: {
      ...data,
      folhaSuplementar: data.folhaSuplementar ?? 0,
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

  // Broadcast update to SSE clients
  broadcastUpdate({
    type: "lancamento",
    action: "created",
    timestamp: new Date().toISOString(),
  });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("❌ ERRO POST /api/lancamentos:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erro ao salvar: ${msg}` },
      { status: 500 }
    );
  }
}
