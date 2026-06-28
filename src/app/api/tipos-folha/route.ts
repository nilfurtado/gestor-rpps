import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTiposFolhaAtivos, createTipoFolhaCustomizado } from "@/lib/tipo-folha-service";

export async function GET() {
  try {
    const data = await getTiposFolhaAtivos();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Erro ao buscar tipos de folha:", error);
    return NextResponse.json(
      { error: "Erro ao buscar tipos de folha" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GESTOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // 2. Parse request body
    const body = await request.json();

    // 3. Validate nome is provided
    if (!body.nome || typeof body.nome !== "string" || !body.nome.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // 4. Call service to create custom tipo
    const tipo = await createTipoFolhaCustomizado(body.nome, body.descricao);

    // 5. Return created tipo
    return NextResponse.json({ data: tipo }, { status: 201 });
  } catch (error) {
    // 6. Handle errors
    const errorMsg = error instanceof Error ? error.message : "Erro ao criar tipo";
    return NextResponse.json(
      { error: errorMsg },
      { status: 400 }
    );
  }
}
