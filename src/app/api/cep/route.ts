import { NextRequest, NextResponse } from "next/server";
import { buscarEnderecoPorCep } from "@/lib/cep";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep");

  if (!cep) {
    return NextResponse.json({ error: "CEP é obrigatório" }, { status: 400 });
  }

  const endereco = await buscarEnderecoPorCep(cep);

  if (!endereco) {
    return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
  }

  return NextResponse.json(endereco);
}
