import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { lancamentoId } = await request.json();

    if (!lancamentoId) {
      return NextResponse.json({ error: "lancamentoId obrigatório" }, { status: 400 });
    }

    // Buscar lançamento
    const lancamento = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: lancamentoId },
    });

    if (!lancamento) {
      return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
    }

    // Remover aprovação
    const updated = await prisma.folhaPrevidenciaria.update({
      where: { id: lancamentoId },
      data: {
        justificativaDiferenca: null,
        diferenca_aprovada: false,
        dataAprovacao: null,
        usuarioAprovadorId: null,
        // Recalcular status para PARCIAL (se houver deficit)
        status: lancamento.deficit > 0 ? "PARCIAL" : "PAGO",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aprovação removida com sucesso",
      lancamento: updated,
    });
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("Erro ao desaprovar diferença:", err);
    return NextResponse.json(
      { error: `Erro ao desaprovar: ${err}` },
      { status: 500 }
    );
  }
}
