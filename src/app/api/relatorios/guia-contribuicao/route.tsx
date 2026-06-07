import { NextResponse } from "next/server";
import { pdf, Document, Page } from "@react-pdf/renderer";
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
    const tipo = searchParams.get("tipo") as "PATRONAL" | "SEGURADO" | "AMBAS";
    const patronalDataVencimento = searchParams.get("patronalDataVencimento");
    const patronalBaseCálculo = searchParams.get("patronalBaseCálculo");
    const patronalContribuicao = searchParams.get("patronalContribuicao");
    const seguradoDataVencimento = searchParams.get("seguradoDataVencimento");
    const seguradoBaseCálculo = searchParams.get("seguradoBaseCálculo");
    const seguradoContribuicao = searchParams.get("seguradoContribuicao");

    if (!orgaoId || !exercicioId || !competenciaId || !tipo) {
      return NextResponse.json(
        { error: "Parâmetros faltando" },
        { status: 400 }
      );
    }

    // Validar conforme tipo
    if (
      (tipo === "PATRONAL" || tipo === "AMBAS") &&
      (!patronalDataVencimento || !patronalBaseCálculo || !patronalContribuicao)
    ) {
      return NextResponse.json(
        { error: "Dados de Patronal incompletos" },
        { status: 400 }
      );
    }

    if (
      (tipo === "SEGURADO" || tipo === "AMBAS") &&
      (!seguradoDataVencimento || !seguradoBaseCálculo || !seguradoContribuicao)
    ) {
      return NextResponse.json(
        { error: "Dados de Segurado incompletos" },
        { status: 400 }
      );
    }

    const orgId = Number(orgaoId);
    const exId = Number(exercicioId);
    const cmpId = Number(competenciaId);

    // Buscar lançamento (apenas para dados de órgão, exercício, competência)
    const lancamento = await prisma.folhaPrevidenciaria.findFirst({
      where: {
        orgaoId: orgId,
        exercicioId: exId,
        competenciaId: cmpId,
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

    const competenciaMes = lancamento.competencia.mes;
    const exercicioAno = lancamento.exercicio.ano;
    const competenciaStr = `${competenciaMes}/${exercicioAno}`;
    const emittedBy = session.user.email || "Sistema SANPREV";

    // Criar documento com uma ou múltiplas páginas
    const pages: React.ReactElement[] = [];

    // Adicionar guia PATRONAL se selecionada
    if (tipo === "PATRONAL" || tipo === "AMBAS") {
      const patronalData: GuiaContribuicaoData = {
        orgaoNome: lancamento.orgao.nome,
        orgaoCnpj: lancamento.orgao.cnpj || "",
        orgaoEndereco: lancamento.orgao.endereco || "",
        orgaoNumero: lancamento.orgao.numero || "",
        orgaoBairro: lancamento.orgao.bairro || "",
        orgaoCidade: lancamento.orgao.cidade || "",
        orgaoEstado: lancamento.orgao.estado || "",
        orgaoCep: lancamento.orgao.cep || "",
        competencia: competenciaStr,
        dataVencimento: new Date(patronalDataVencimento!),
        baseCálculo: Number(patronalBaseCálculo),
        contribuicaoPatronal: Number(patronalContribuicao),
        contribuicaoSegurado: 0,
        tipo: "PATRONAL",
      };

      pages.push(
        <GuiaContribuicaoDocument
          key="patronal"
          data={patronalData}
          rpps={rppsInfo}
          logoBase64={logoBase64}
          emittedBy={emittedBy}
        />
      );
    }

    // Adicionar guia SEGURADO se selecionada
    if (tipo === "SEGURADO" || tipo === "AMBAS") {
      const seguradoData: GuiaContribuicaoData = {
        orgaoNome: lancamento.orgao.nome,
        orgaoCnpj: lancamento.orgao.cnpj || "",
        orgaoEndereco: lancamento.orgao.endereco || "",
        orgaoNumero: lancamento.orgao.numero || "",
        orgaoBairro: lancamento.orgao.bairro || "",
        orgaoCidade: lancamento.orgao.cidade || "",
        orgaoEstado: lancamento.orgao.estado || "",
        orgaoCep: lancamento.orgao.cep || "",
        competencia: competenciaStr,
        dataVencimento: new Date(seguradoDataVencimento!),
        baseCálculo: Number(seguradoBaseCálculo),
        contribuicaoPatronal: 0,
        contribuicaoSegurado: Number(seguradoContribuicao),
        tipo: "SEGURADO",
      };

      pages.push(
        <GuiaContribuicaoDocument
          key="segurado"
          data={seguradoData}
          rpps={rppsInfo}
          logoBase64={logoBase64}
          emittedBy={emittedBy}
        />
      );
    }

    // Criar documento PDF único com múltiplas páginas
    const instance = pdf(
      <Document title="Guia de Contribuição">
        {pages}
      </Document>
    );

    const blob = await instance.toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="guia-${tipo.toLowerCase()}-${lancamento.orgao.sigla}-${competenciaStr.replace("/", "-")}.pdf"`,
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
