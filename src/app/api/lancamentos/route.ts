import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { lancamentoSchema } from "@/lib/schemas";
import { canManageLancamentos, forbidden } from "@/lib/permissions";
import { broadcastUpdate } from "@/app/api/relatorios/updates/route";
import { createLancamento } from "@/lib/lancamento-service";
import type { CreateLancamentoInput } from "@/lib/lancamento-service";

export async function GET() {
  return NextResponse.json([], { status: 200 });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLancamentos(session.user.role)) return forbidden();

    const body = await req.json();
    const parsed = lancamentoSchema.safeParse(body);

    if (!parsed.success) {
      console.error("❌ Validação falhou:", parsed.error.flatten());
      parsed.error.issues.forEach((issue) => {
        console.error(`   Campo: ${issue.path.join(".")} | ${issue.message}`);
      });
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verificações de existência e duplicata antes de chamar o service
    const exercicio = await prisma.exercicio.findUnique({
      where: { id: data.exercicioId },
    });
    if (!exercicio) {
      return NextResponse.json({ error: "Exercício inexistente." }, { status: 400 });
    }
    if (exercicio.status === "ENCERRADO") {
      return NextResponse.json(
        { error: `Exercício ${exercicio.ano} está encerrado. Edição bloqueada.` },
        { status: 409 }
      );
    }

    const competencia = await prisma.competencia.findUnique({
      where: { id: data.competenciaId },
    });
    if (!competencia) {
      return NextResponse.json({ error: "Competência inexistente." }, { status: 400 });
    }

    const dup = await prisma.folhaPrevidenciaria.findUnique({
      where: {
        orgaoId_tipo_exercicioId_competenciaId: {
          orgaoId: data.orgaoId,
          tipo: data.tipo,
          exercicioId: data.exercicioId,
          competenciaId: data.competenciaId,
        },
      },
    });
    if (dup) {
      return NextResponse.json(
        {
          error:
            "Já existe lançamento desta competência para este órgão e tipo. Edite o registro existente.",
        },
        { status: 409 }
      );
    }

    // Delegar ao service que calcula folhas dinâmicas e persiste tudo
    const input: CreateLancamentoInput = {
      orgaoId: data.orgaoId,
      tipo: data.tipo,
      exercicioId: data.exercicioId,
      competenciaId: data.competenciaId,
      aliquota: data.aliquota,
      valorRecolher: data.valorRecolher,
      valorRecolhido: data.valorRecolhido ?? 0,
      quantidadeServidores: data.quantidadeServidores,
      folhaBase: data.folhaBase,
      folhaSuplementar: data.folhaSuplementar ?? 0,
      multas: data.multas,
      juros: data.juros,
      acrescimo: data.acrescimo ?? 0,
      parcelado: data.parcelado ?? false,
      dataVencimento: data.dataVencimento,
      observacoes: data.observacoes,
      justificativaDiferenca: data.justificativaDiferenca,
      diferenca_aprovada: data.diferenca_aprovada ?? false,
      dataAprovacao: data.dataAprovacao,
      folhas: data.folhas ?? [],
    };

    const lancamento = await createLancamento(input, Number(session.user.id));

    // Broadcast update to SSE clients
    broadcastUpdate({
      type: "lancamento",
      action: "created",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        data: {
          ...lancamento,
          folhas: lancamento.folhas,
          folhaTotal: lancamento.folhaTotal,
          totalARecolher: lancamento.totalARecolher,
          totalRecolhido: lancamento.totalRecolhido,
          deficitTotal: lancamento.deficitTotal,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ ERRO POST /api/lancamentos:", error);
    const msg = error instanceof Error ? error.message : String(error);
    // Retornar 400 para erros de validação de negócio (Folha Base obrigatória, etc.)
    const isBusiness =
      msg.includes("obrigatória") ||
      msg.includes("não encontrado") ||
      msg.includes("TipoFolha");
    return NextResponse.json(
      { error: isBusiness ? msg : `Erro ao salvar: ${msg}` },
      { status: isBusiness ? 400 : 500 }
    );
  }
}
