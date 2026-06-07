import { NextResponse } from "next/server";
import { pdf, Document, Page } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { currencyToNumber } from "@/components/ui/currency-input";
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

    // Buscar dados de órgão, exercício e competência
    const [orgao, exercicio, competencia] = await Promise.all([
      prisma.orgao.findUnique({ where: { id: orgId } }),
      prisma.exercicio.findUnique({ where: { id: exId } }),
      prisma.competencia.findUnique({ where: { id: cmpId } }),
    ]);

    if (!orgao || !exercicio || !competencia) {
      return NextResponse.json(
        { error: "Dados incompletos (órgão, exercício ou competência não encontrados)" },
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

    const competenciaMes = competencia.mes;
    const exercicioAno = exercicio.ano;
    const competenciaStr = `${competenciaMes}/${exercicioAno}`;
    const emittedBy = session.user.email || "Sistema SANPREV";

    // Renderizar como componente único (uma guia por vez)
    // Se for AMBAS, precisa de duas chamadas à API
    const tipoParaRender: "PATRONAL" | "SEGURADO" =
      tipo === "AMBAS" ? "PATRONAL" : tipo;

    const guiaData: GuiaContribuicaoData = {
      orgaoNome: orgao.nome,
      orgaoCnpj: orgao.cnpj || "",
      orgaoEndereco: orgao.endereco || "",
      orgaoNumero: orgao.numero || "",
      orgaoBairro: orgao.bairro || "",
      orgaoCidade: orgao.cidade || "",
      orgaoEstado: orgao.estado || "",
      orgaoCep: orgao.cep || "",
      competencia: competenciaStr,
      dataVencimento: new Date(
        tipoParaRender === "PATRONAL"
          ? patronalDataVencimento!
          : seguradoDataVencimento!
      ),
      baseCálculo: currencyToNumber(
        tipoParaRender === "PATRONAL"
          ? patronalBaseCálculo
          : seguradoBaseCálculo
      ),
      contribuicaoPatronal: tipoParaRender === "PATRONAL"
        ? currencyToNumber(patronalContribuicao)
        : 0,
      contribuicaoSegurado: tipoParaRender === "SEGURADO"
        ? currencyToNumber(seguradoContribuicao)
        : 0,
      tipo: tipoParaRender,
    };

    const instance = pdf(
      <GuiaContribuicaoDocument
        data={guiaData}
        rpps={rppsInfo}
        logoBase64={logoBase64}
        emittedBy={emittedBy}
      />
    );

    const blob = await instance.toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="guia-${tipoParaRender.toLowerCase()}-${orgao.sigla}-${competenciaStr.replace("/", "-")}.pdf"`,
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
