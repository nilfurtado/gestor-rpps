import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  GuiaContribuicaoDocument,
  type GuiaContribuicaoData,
  type RppsGuiaInfo,
} from "@/lib/pdf/guia-contribuicao-document";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgaoId = searchParams.get("orgaoId");
    const exercicioId = searchParams.get("exercicioId");
    const competenciaId = searchParams.get("competenciaId");
    const tipo = searchParams.get("tipo") as "PATRONAL" | "SEGURADO" | "AMBOS";

    if (!orgaoId || !exercicioId || !competenciaId || !tipo) {
      return NextResponse.json(
        { error: "Parâmetros faltando" },
        { status: 400 }
      );
    }

    const orgId = Number(orgaoId);
    const exId = Number(exercicioId);
    const cmpId = Number(competenciaId);

    // Buscar lançamento
    const lancamento = await prisma.folhaPrevidenciaria.findFirst({
      where: {
        orgaoId: orgId,
        exercicioId: exId,
        competenciaId: cmpId,
        tipo,
      },
      include: {
        orgao: true,
        exercicio: true,
        competencia: true,
      },
    });

    if (!lancamento) {
      return NextResponse.json(
        {
          error: "Lançamento não encontrado para os parâmetros informados",
        },
        { status: 404 }
      );
    }

    // Buscar dados do RPPS
    const rpps = await prisma.institutoRpps.findUnique({
      where: { id: 1 },
    });

    // Buscar logo
    let logoBase64: string | null = null;
    if (rpps?.logoId) {
      const logo = await prisma.arquivo.findUnique({
        where: { id: rpps.logoId },
      });
      if (logo?.conteudo) {
        logoBase64 = logo.conteudo;
      }
    }

    // Calcular contribuição segurado (50% da patronal aprox.)
    const contribuicaoSegurado = Number(lancamento.valorRecolher) * 0.5;

    // Montar data da guia
    const competenciaMes = lancamento.competencia.mes;
    const exercicioAno = lancamento.exercicio.ano;
    const competenciaStr = `${competenciaMes}/${exercicioAno}`;

    // Data de vencimento: 8º dia do mês seguinte
    const mesAtual = lancamento.competencia.ordem;
    const anoVencimento =
      mesAtual === 12 ? exercicioAno + 1 : exercicioAno;
    const mesVencimento = mesAtual === 12 ? 1 : mesAtual + 1;
    const dataVencimento = new Date(anoVencimento, mesVencimento - 1, 8);

    // Montar dados
    const guiaData: GuiaContribuicaoData = {
      orgaoNome: lancamento.orgao.nome,
      orgaoCnpj: lancamento.orgao.cnpj || "",
      orgaoEndereco: lancamento.orgao.endereco || "",
      orgaoNumero: lancamento.orgao.numero || "",
      orgaoBairro: lancamento.orgao.bairro || "",
      orgaoCidade: lancamento.orgao.cidade || "",
      orgaoEstado: lancamento.orgao.estado || "",
      orgaoCep: lancamento.orgao.cep || "",
      competencia: competenciaStr,
      dataVencimento,
      baseCálculo: Number(lancamento.folhaBase),
      contribuicaoPatronal: Number(lancamento.valorRecolher),
      contribuicaoSegurado,
      tipo,
    };

    const rppsInfo: RppsGuiaInfo | null = rpps
      ? {
          nomeInstituto: rpps.nomeInstituto,
          cnpj: rpps.cnpj,
          enderecoCompleto: rpps.enderecoCompleto,
          telefone: rpps.telefone,
          email: rpps.email || undefined,
          portal: rpps.portal || undefined,
          banco: rpps.banco || undefined,
          agencia: rpps.agencia || undefined,
          conta: rpps.conta || undefined,
        }
      : null;

    // Renderizar PDF
    const instance = pdf(
      <GuiaContribuicaoDocument
        data={guiaData}
        rpps={rppsInfo}
        logoBase64={logoBase64}
        emittedBy={session.user.email || "Sistema SANPREV"}
      />
    );

    const blob = await instance.toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="guia-${lancamento.orgao.sigla}-${competenciaStr.replace("/", "-")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Erro ao gerar guia:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro ao gerar guia",
      },
      { status: 500 }
    );
  }
}
