import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { acordoSchema } from "@/lib/schemas";
import { recordAudit } from "@/lib/audit";
import { canManageAcordos, forbidden } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const orgaoId = url.searchParams.get("orgaoId");
  const status = url.searchParams.get("status");
  const tipoDebito = url.searchParams.get("tipoDebito");

  const where: Prisma.AcordoWhereInput = {
    ...(orgaoId ? { orgaoId: Number(orgaoId) } : {}),
    ...(status && ["VIGENTE", "QUITADO", "RESCINDIDO", "SUSPENSO"].includes(status)
      ? { status: status as Prisma.AcordoWhereInput["status"] }
      : {}),
    ...(tipoDebito && ["PATRONAL", "SEGURADO", "AMBOS"].includes(tipoDebito)
      ? { tipoDebito: tipoDebito as Prisma.AcordoWhereInput["tipoDebito"] }
      : {}),
  };

  const data = await prisma.acordo.findMany({
    where,
    include: {
      orgao: { select: { id: true, sigla: true, nome: true } },
      lancamentos: {
        select: {
          id: true,
          tipo: true,
          competencia: { select: { mes: true, ordem: true } },
          exercicio: { select: { ano: true } },
          deficit: true,
        },
      },
    },
    orderBy: [{ dataAcordo: "desc" }, { id: "desc" }],
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAcordos(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = acordoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dup = await prisma.acordo.findUnique({
    where: {
      orgaoId_numero: { orgaoId: parsed.data.orgaoId, numero: parsed.data.numero },
    },
  });
  if (dup) {
    return NextResponse.json(
      { error: `Já existe acordo com número ${parsed.data.numero} para este órgão.` },
      { status: 409 }
    );
  }

  const lancamentos = await prisma.folhaPrevidenciaria.findMany({
    where: { id: { in: parsed.data.lancamentoIds } },
    include: { exercicio: true },
  });
  if (lancamentos.length !== parsed.data.lancamentoIds.length) {
    return NextResponse.json(
      { error: "Algum lançamento informado não existe." },
      { status: 400 }
    );
  }
  const todosDoOrgao = lancamentos.every((l) => l.orgaoId === parsed.data.orgaoId);
  if (!todosDoOrgao) {
    return NextResponse.json(
      { error: "Todos os lançamentos devem pertencer ao órgão devedor selecionado." },
      { status: 400 }
    );
  }
  const exercicioEncerrado = lancamentos.find((l) => l.exercicio.status === "ENCERRADO");
  if (exercicioEncerrado) {
    return NextResponse.json(
      {
        error: `Lançamento de exercício encerrado (${exercicioEncerrado.exercicio.ano}) não pode ser vinculado.`,
      },
      { status: 409 }
    );
  }

  // valorOriginal: usa o informado pelo usuário; se ausente, soma os déficits dos lançamentos vinculados
  const valorOriginal =
    parsed.data.valorOriginal ??
    lancamentos.reduce((s, l) => s + Number(l.deficit), 0);
  const valorConsolidado =
    valorOriginal +
    parsed.data.atualizacaoMonetaria +
    parsed.data.jurosAcordo +
    parsed.data.multaAcordo;

  const created = await prisma.$transaction(async (tx) => {
    const acordo = await tx.acordo.create({
      data: {
        numero: parsed.data.numero,
        dataAcordo: parsed.data.dataAcordo,
        orgaoId: parsed.data.orgaoId,
        tipoDebito: parsed.data.tipoDebito,
        valorOriginal,
        atualizacaoMonetaria: parsed.data.atualizacaoMonetaria,
        jurosAcordo: parsed.data.jurosAcordo,
        multaAcordo: parsed.data.multaAcordo,
        valorConsolidado,
        numeroParcelas: parsed.data.numeroParcelas,
        valorParcela: parsed.data.valorParcela,
        diaVencimento: parsed.data.diaVencimento,
        primeiroVencimento: parsed.data.primeiroVencimento,
        formaGarantia: parsed.data.formaGarantia ?? null,
        garantiaDetalhes: parsed.data.garantiaDetalhes,
        leiAutorizativa: parsed.data.leiAutorizativa,
        observacoes: parsed.data.observacoes,
        responsavelId: Number(session.user.id),
        lancamentos: { connect: parsed.data.lancamentoIds.map((id) => ({ id })) },
      },
      include: { orgao: true, lancamentos: true },
    });

    await tx.folhaPrevidenciaria.updateMany({
      where: { id: { in: parsed.data.lancamentoIds } },
      data: { parcelado: true, status: "PARCELADO" },
    });

    return acordo;
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "Acordo",
    entityId: created.id,
    action: "CREATE",
    after: created,
  });

  return NextResponse.json(created, { status: 201 });
}
