import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageLancamentos, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLancamentos(session.user.role)) return forbidden();

    const { id } = await params;
    const tipoId = Number(id);
    if (!Number.isInteger(tipoId) || tipoId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const { ativo } = body;

    // Não permitir desativar tipo obrigatório se ele tem lançamentos
    if (ativo === false) {
      const tipo = await prisma.tipoFolha.findUnique({ where: { id: tipoId } });
      if (tipo?.obrigatorio) {
        const temLancamentos = await prisma.lancamentoFolha.count({
          where: { tipoFolhaId: tipoId },
        });
        if (temLancamentos > 0) {
          return NextResponse.json(
            { error: "Não é possível desativar um tipo obrigatório com lançamentos" },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.tipoFolha.update({
      where: { id: tipoId },
      data: { ativo },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar tipo folha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLancamentos(session.user.role)) return forbidden();

    const { id } = await params;
    const tipoId = Number(id);
    if (!Number.isInteger(tipoId) || tipoId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Verificar se é customizado
    const tipo = await prisma.tipoFolha.findUnique({
      where: { id: tipoId },
    });

    if (!tipo) {
      return NextResponse.json({ error: "Tipo não encontrado" }, { status: 404 });
    }

    if (!tipo.customizado) {
      return NextResponse.json(
        { error: "Não é possível deletar tipos built-in" },
        { status: 400 }
      );
    }

    // Verificar se tem lançamentos
    const temLancamentos = await prisma.lancamentoFolha.count({
      where: { tipoFolhaId: tipoId },
    });

    if (temLancamentos > 0) {
      return NextResponse.json(
        { error: `Não é possível deletar: ${temLancamentos} lançamentos usando este tipo` },
        { status: 400 }
      );
    }

    await prisma.tipoFolha.delete({
      where: { id: tipoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar tipo folha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
