import { NextResponse } from "next/server";
import { pdf, Document, Page } from "@react-pdf/renderer";
import React from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { currencyToNumber } from "@/lib/format-currency";
import { generateBarcodeImage } from "@/lib/barcode-generator";
import {
  GuiaContribuicaoDocument,
  GuiaContribuicaoPage,
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
    if (rpps?.logoData) {
      // Converter Bytes para Base64 (sem prefixo data URI)
      const buffer = Buffer.from(rpps.logoData);
      logoBase64 = buffer.toString("base64");
    }

    const rppsInfo: RppsGuiaInfo | null = rpps
      ? {
          nomeInstituto: rpps.nomeInstituto,
          cnpj: rpps.cnpj || "00743471000190", // Fallback direto
          enderecoCompleto: rpps.enderecoCompleto,
          telefone: rpps.telefone,
          email: rpps.email || undefined,
          portal: rpps.portal || undefined,
          banco: rpps.banco || "001", // Fallback direto
          agencia: rpps.agencia || undefined,
          conta: rpps.conta || undefined,
        }
      : {
          nomeInstituto: "SANPREV",
          cnpj: "00743471000190", // Fallback se rpps for null
          enderecoCompleto: undefined,
          telefone: undefined,
          email: undefined,
          portal: undefined,
          banco: "001",
          agencia: undefined,
          conta: undefined,
        };

    console.log("📊 RPPS DEBUG:", {
      rpps: rpps ? { id: rpps.id, cnpj: rpps.cnpj, banco: rpps.banco } : null,
      rppsInfo,
    });

    const competenciaMes = competencia.mes;
    const exercicioAno = exercicio.ano;
    const competenciaStr = `${competenciaMes}/${exercicioAno}`;
    const emittedBy = session.user.email || "Sistema SANPREV";

    // Renderizar guias conforme tipo
    const isBothTypes = tipo === "AMBAS";
    const tiposParaRender: ("PATRONAL" | "SEGURADO")[] = isBothTypes
      ? ["PATRONAL", "SEGURADO"]
      : [tipo];

    // Gerar barcodes para todos os tipos
    const barcodeImages: Record<"PATRONAL" | "SEGURADO", string> = {};
    for (const tipoParaRender of tiposParaRender) {
      const totalPagamento =
        tipoParaRender === "PATRONAL"
          ? currencyToNumber(patronalContribuicao)
          : currencyToNumber(seguradoContribuicao) || 0;

      barcodeImages[tipoParaRender] = await generateBarcodeImage({
        rppsInfo,
        orgaoId: orgId,
        dataVencimento: new Date(
          tipoParaRender === "PATRONAL"
            ? patronalDataVencimento!
            : seguradoDataVencimento!
        ),
        totalPagamento,
        exercicioAno: exercicioAno,
        competenciaMes: competenciaMes,
        competenciaOrdem: competencia.ordem,
      });
    }

    // Criar documento com múltiplas páginas se necessário
    const renderDocument = () => {
      if (isBothTypes) {
        return (
          <Document title="Guia de Contribuição Previdenciária" author={rppsInfo?.nomeInstituto || "SANPREV"}>
            {tiposParaRender.map((tipoParaRender, index) => {
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

              return (
                <GuiaContribuicaoPage
                  key={index}
                  data={guiaData}
                  rpps={rppsInfo}
                  logoBase64={logoBase64}
                  emittedBy={emittedBy}
                  qrCodeImage={barcodeImages[tipoParaRender]}
                />
              );
            })}
          </Document>
        );
      } else {
        const tipoParaRender = tipo;
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

        return (
          <GuiaContribuicaoDocument
            data={guiaData}
            rpps={rppsInfo}
            logoBase64={logoBase64}
            emittedBy={emittedBy}
            qrCodeImage={barcodeImages[tipoParaRender]}
          />
        );
      }
    };

    const instance = pdf(renderDocument());

    const blob = await instance.toBlob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    const fileName =
      tipo === "AMBAS"
        ? `guia-ambas-${orgao.sigla}-${competenciaStr.replace("/", "-")}.pdf`
        : `guia-${tipo.toLowerCase()}-${orgao.sigla}-${competenciaStr.replace("/", "-")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
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
