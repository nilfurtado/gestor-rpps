import { auth } from "@/lib/auth";
import { analyzeSystemState, generateAutoDescription } from "@/lib/system-analysis-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const state = await analyzeSystemState();
    const suggestion = generateAutoDescription(state);

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Erro ao gerar sugestão:", error);
    // Em caso de erro, retorna sugestão padrão
    return NextResponse.json({ suggestion: "SISTEMA-OK" }, { status: 200 });
  }
}
