import { NextRequest, NextResponse } from "next/server";
import * as service from "@/lib/folha-suplementar-service";
import { recalcularFolha } from "@/lib/folha-calculo-service";
import { auth } from "@/lib/auth";
import type { UpdateFolhaSuplementerInput } from "@/types/folha-suplementar";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const suplementar = await service.getFolhaSuplementer(id);

    if (!suplementar) {
      return NextResponse.json(
        { error: "Suplementar não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: suplementar });
  } catch (error) {
    console.error("Erro ao obter suplementar:", error);
    return NextResponse.json(
      { error: "Erro ao obter suplementar" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const body: UpdateFolhaSuplementerInput = await request.json();

    const suplementar = await service.getFolhaSuplementer(id);
    if (!suplementar) {
      return NextResponse.json(
        { error: "Suplementar não encontrada" },
        { status: 404 }
      );
    }

    const atualizada = await service.updateFolhaSuplementer(id, body);

    // Recalcular folha após editar suplementar
    await recalcularFolha(suplementar.folhaPrevidenciariaId);

    return NextResponse.json({ data: atualizada });
  } catch (error) {
    console.error("Erro ao atualizar suplementar:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar suplementar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID inválido" },
        { status: 400 }
      );
    }

    const suplementar = await service.getFolhaSuplementer(id);
    if (!suplementar) {
      return NextResponse.json(
        { error: "Suplementar não encontrada" },
        { status: 404 }
      );
    }

    await service.deleteFolhaSuplementer(id);

    // Recalcular folha após deletar suplementar
    await recalcularFolha(suplementar.folhaPrevidenciariaId);

    return NextResponse.json({ message: "Suplementar deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar suplementar:", error);
    return NextResponse.json(
      { error: "Erro ao deletar suplementar" },
      { status: 500 }
    );
  }
}
