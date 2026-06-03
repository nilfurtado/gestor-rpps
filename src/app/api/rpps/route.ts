import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const rpps = await prisma.institutoRpps.findUnique({
      where: { id: 1 },
    });

    return NextResponse.json(rpps || {});
  } catch (error) {
    console.error("Erro ao buscar dados do RPPS:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do RPPS" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const rpps = await prisma.institutoRpps.upsert({
      where: { id: 1 },
      create: {
        nomeInstituto: body.nomeInstituto,
        nomeResponsavel: body.nomeResponsavel,
        cnpj: body.cnpj,
        enderecoCompleto: body.enderecoCompleto,
        telefone: body.telefone,
        email: body.email,
        nomeDepartamento: body.nomeDepartamento,
        responsavelDepartamento: body.responsavelDepartamento,
        banco: body.banco,
        agencia: body.agencia,
        conta: body.conta,
        tipoConta: body.tipoConta,
      },
      update: {
        nomeInstituto: body.nomeInstituto,
        nomeResponsavel: body.nomeResponsavel,
        cnpj: body.cnpj,
        enderecoCompleto: body.enderecoCompleto,
        telefone: body.telefone,
        email: body.email,
        nomeDepartamento: body.nomeDepartamento,
        responsavelDepartamento: body.responsavelDepartamento,
        banco: body.banco,
        agencia: body.agencia,
        conta: body.conta,
        tipoConta: body.tipoConta,
      },
    });

    return NextResponse.json(rpps);
  } catch (error) {
    console.error("Erro ao salvar dados do RPPS:", error);
    return NextResponse.json(
      { error: "Erro ao salvar dados do RPPS" },
      { status: 500 }
    );
  }
}
