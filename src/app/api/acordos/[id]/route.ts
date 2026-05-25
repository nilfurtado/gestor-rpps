import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { acordoUpdateSchema } from "@/lib/schemas";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { recordAudit } from "@/lib/audit";
import { canManageAcordos, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const aid = Number(id);
  if (!Number.isInteger(aid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const acordo = await prisma.acordo.findUnique({
    where: { id: aid },
    include: {
      orgao: true,
      lancamentos: {
        include: {
          competencia: { select: { id: true, mes: true, ordem: true } },
          exercicio: { select: { id: true, ano: true } },
        },
      },
    },
  });
  if (!acordo) return NextResponse.json({ error: "Acordo não encontrado" }, { status: 404 });
  return NextResponse.json(acordo);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAcordos(session.user.role)) return forbidden();

  const { id } = await params;
  const aid = Number(id);
  if (!Number.isInteger(aid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.acordo.findUnique({
    where: { id: aid },
    include: { lancamentos: true },
  });
  if (!before) return NextResponse.json({ error: "Acordo não encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = acordoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validação falhou", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Recalcular valor consolidado se algum componente mudou
  const valorOriginal =
    parsed.data.valorOriginal ?? Number(before.valorOriginal);
  const atualizacao =
    parsed.data.atualizacaoMonetaria ?? Number(before.atualizacaoMonetaria);
  const juros = parsed.data.jurosAcordo ?? Number(before.jurosAcordo);
  const multa = parsed.data.multaAcordo ?? Number(before.multaAcordo);
  const valorConsolidado = valorOriginal + atualizacao + juros + multa;

  const newStatus = parsed.data.status ?? before.status;
  const statusMudouParaInativo =
    newStatus !== before.status &&
    (newStatus === "RESCINDIDO" || newStatus === "SUSPENSO");
  const statusMudouParaVigente =
    newStatus !== before.status && newStatus === "VIGENTE";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedAcordo = await tx.acordo.update({
      where: { id: aid },
      data: {
        numero: parsed.data.numero,
        dataAcordo: parsed.data.dataAcordo,
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
        status: newStatus,
        parcelasPagas: parsed.data.parcelasPagas,
        valorPago: parsed.data.valorPago,
      },
      include: { lancamentos: true, orgao: true },
    });

    // Se o acordo deixou de estar vigente, devolve os lançamentos pra status calculado
    if (statusMudouParaInativo) {
      for (const l of before.lancamentos) {
        const calc = calcularLancamento({
          valorRecolher: Number(l.valorRecolher),
          valorRecolhido: Number(l.valorRecolhido),
          parcelado: false,
        });
        await tx.folhaPrevidenciaria.update({
          where: { id: l.id },
          data: {
            parcelado: false,
            status: calc.status,
          },
        });
      }
    }

    // Se voltou a vigente, marca os lançamentos como PARCELADO novamente
    if (statusMudouParaVigente) {
      await tx.folhaPrevidenciaria.updateMany({
        where: { id: { in: before.lancamentos.map((l) => l.id) } },
        data: { parcelado: true, status: "PARCELADO" },
      });
    }

    return updatedAcordo;
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "Acordo",
    entityId: aid,
    action: "UPDATE",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageAcordos(session.user.role)) return forbidden();

  const { id } = await params;
  const aid = Number(id);
  if (!Number.isInteger(aid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.acordo.findUnique({
    where: { id: aid },
    include: { lancamentos: true },
  });
  if (!before) return NextResponse.json({ error: "Acordo não encontrado" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Devolve lançamentos a status calculado
    for (const l of before.lancamentos) {
      const calc = calcularLancamento({
        valorRecolher: Number(l.valorRecolher),
        valorRecolhido: Number(l.valorRecolhido),
        parcelado: false,
      });
      await tx.folhaPrevidenciaria.update({
        where: { id: l.id },
        data: { parcelado: false, status: calc.status },
      });
    }
    await tx.acordo.delete({ where: { id: aid } });
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "Acordo",
    entityId: aid,
    action: "DELETE",
    before,
  });

  return NextResponse.json({ ok: true });
}
