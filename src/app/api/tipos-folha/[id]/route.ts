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
    const { ativo, nome, descricao, obrigatorio, cor } = body;

    // Validações
    if (nome && !nome.trim()) {
      return NextResponse.json({ error: "Nome não pode estar vazio" }, { status: 400 });
    }

    const tipo = await prisma.tipoFolha.findUnique({ where: { id: tipoId } });
    if (!tipo) {
      return NextResponse.json({ error: "Tipo não encontrado" }, { status: 404 });
    }

    // Não permitir desativar tipo obrigatório se ele tem lançamentos
    if (ativo === false && (obrigatorio !== false || tipo.obrigatorio)) {
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

    // Não permitir remover obrigatório de tipos built-in
    if (obrigatorio === false && !tipo.customizado && tipo.obrigatorio) {
      return NextResponse.json(
        { error: "Não é possível remover a obrigatoriedade de tipos built-in" },
        { status: 400 }
      );
    }

    // Construir objeto de update
    const dataUpdate: Record<string, unknown> = {};
    if (ativo !== undefined) dataUpdate.ativo = ativo;
    if (nome !== undefined) dataUpdate.nome = nome.trim();
    if (descricao !== undefined) dataUpdate.descricao = descricao ? descricao.trim() : null;
    if (obrigatorio !== undefined) dataUpdate.obrigatorio = obrigatorio;
    if (cor !== undefined) dataUpdate.cor = cor;

    const updated = await prisma.tipoFolha.update({
      where: { id: tipoId },
      data: dataUpdate,
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
