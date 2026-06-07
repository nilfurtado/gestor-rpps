import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const competencias = await prisma.competencia.findMany({
      orderBy: { ordem: "asc" },
      select: {
        id: true,
        mes: true,
        ordem: true,
      },
    });

    return NextResponse.json(competencias);
  } catch (err) {
    console.error("Erro ao buscar competências:", err);
    return NextResponse.json(
      { error: "Erro ao buscar competências" },
      { status: 500 }
    );
  }
}
