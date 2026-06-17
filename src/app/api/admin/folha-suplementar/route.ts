import { NextRequest, NextResponse } from "next/server";
import * as service from "@/lib/folha-suplementar-service";
import { recalcularFolha } from "@/lib/folha-calculo-service";
import { auth } from "@/lib/auth";
import type { CreateFolhaSuplementerInput } from "@/types/folha-suplementar";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const folhaId = request.nextUrl.searchParams.get("folhaId");
    const suplementares = await service.listFolhaSuplementer(
      folhaId ? parseInt(folhaId) : undefined
    );
    return NextResponse.json({ data: suplementares });
  } catch (error) {
    console.error("Erro ao listar suplementares:", error);
    return NextResponse.json(
      { error: "Erro ao listar suplementares" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body: CreateFolhaSuplementerInput = await request.json();

    if (!body.folhaPrevidenciariaId || !body.motivo || body.folhaBase === undefined) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando: folhaPrevidenciariaId, motivo, folhaBase" },
        { status: 400 }
      );
    }

    const suplementar = await service.createFolhaSuplementer(body);

    // Recalcular folha base após criar suplementar
    await recalcularFolha(body.folhaPrevidenciariaId);

    return NextResponse.json({ data: suplementar }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar suplementar:", error);
    return NextResponse.json(
      { error: "Erro ao criar suplementar" },
      { status: 500 }
    );
  }
}
