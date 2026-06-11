import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularLancamento } from "@/lib/calc/lancamento";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lancamentoId, motivo, detalhe } = await request.json();

    if (!lancamentoId || !motivo) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID de usuário inválido" }, { status: 400 });
    }

    // Buscar lançamento antes de atualizar
    const lancamentoAntes = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: Number(lancamentoId) },
    });

    if (!lancamentoAntes) {
      return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
    }

    // Recalcular deficit com diferença_aprovada = true
    const calc = calcularLancamento({
      valorRecolher: lancamentoAntes.valorRecolher,
      valorRecolhido: lancamentoAntes.valorRecolhido,
      acrescimo: lancamentoAntes.acrescimo,
      diferenca_aprovada: true, // ← Key: aprovado agora
    });

    console.log("Aprovando diferença:");
    console.log(`  valorRecolher: ${lancamentoAntes.valorRecolher}`);
    console.log(`  valorRecolhido: ${lancamentoAntes.valorRecolhido}`);
    console.log(`  acrescimo: ${lancamentoAntes.acrescimo}`);
    console.log(`  deficit calculado: ${calc.deficit}`);

    // Atualizar lançamento com aprovação e deficit recalculado
    const lancamento = await prisma.folhaPrevidenciaria.update({
      where: { id: Number(lancamentoId) },
      data: {
        justificativaDiferenca: `${motivo}: ${detalhe}`,
        diferenca_aprovada: true,
        dataAprovacao: new Date(),
        usuarioAprovadorId: userId,
        status: "PAGO", // Marca como PAGO quando aprovado
        deficit: calc.deficit, // ← Deficit recalculado (será 0)
        inadimplencia: calc.inadimplencia,
      },
    });

    console.log(`  deficit salvo no banco: ${lancamento.deficit}`);

    return NextResponse.json({
      success: true,
      message: "Diferença aprovada com sucesso",
      lancamento,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("Erro ao aprovar diferença:", err);
    return NextResponse.json(
      { error: `Erro ao processar aprovação: ${err}` },
      { status: 500 }
    );
  }
}
