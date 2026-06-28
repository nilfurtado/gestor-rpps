import { NextResponse } from "next/server";
import { getTiposFolhaAtivos } from "@/lib/tipo-folha-service";

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
