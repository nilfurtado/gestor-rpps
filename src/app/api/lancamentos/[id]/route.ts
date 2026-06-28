import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { canManageLancamentos, forbidden } from "@/lib/permissions";
import { updateLancamento } from "@/lib/lancamento-service";
import type { UpdateLancamentoInput } from "@/lib/lancamento-service";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const lid = Number(id);
    if (!Number.isInteger(lid) || lid <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const lancamento = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: lid },
      include: {
        folhas: {
          include: { tipoFolha: true },
          orderBy: { tipoFolhaId: "asc" },
        },
      },
    });

    if (!lancamento) {
      return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: lancamento });
  } catch (error) {
    console.error("Erro ao buscar lançamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageLancamentos(session.user.role)) return forbidden();

    const { id } = await params;
    const lid = Number(id);
    if (!Number.isInteger(lid) || lid <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    console.log("PATCH body recebido:", JSON.stringify(body, null, 2));

    // Montar input para o service — apenas campos presentes no body
    const input: UpdateLancamentoInput = {};

    if (body.aliquota !== undefined) input.aliquota = Number(body.aliquota);
    if (body.valorRecolher !== undefined) input.valorRecolher = Number(body.valorRecolher);
    if (body.valorRecolhido !== undefined) input.valorRecolhido = Number(body.valorRecolhido);
    if (body.quantidadeServidores !== undefined)
      input.quantidadeServidores = body.quantidadeServidores ? Number(body.quantidadeServidores) : null;
    if (body.folhaBase !== undefined)
      input.folhaBase = body.folhaBase ? Number(body.folhaBase) : null;
    if (body.folhaSuplementar !== undefined)
      input.folhaSuplementar = body.folhaSuplementar != null ? Number(body.folhaSuplementar) : 0;
    if (body.multas !== undefined)
      input.multas = body.multas ? Number(body.multas) : null;
    if (body.juros !== undefined)
      input.juros = body.juros ? Number(body.juros) : null;
    if (body.acrescimo !== undefined) input.acrescimo = Number(body.acrescimo);
    if (body.acrescimo_tipo !== undefined) input.acrescimo_tipo = body.acrescimo_tipo;
    if (body.parcelado !== undefined) input.parcelado = Boolean(body.parcelado);
    if (body.dataVencimento !== undefined)
      input.dataVencimento = body.dataVencimento ? new Date(body.dataVencimento) : null;
    if (body.observacoes !== undefined) input.observacoes = body.observacoes;
    if (body.justificativaDiferenca !== undefined)
      input.justificativaDiferenca = body.justificativaDiferenca;
    if (body.diferenca_aprovada !== undefined)
      input.diferenca_aprovada = Boolean(body.diferenca_aprovada);
    if (body.dataAprovacao !== undefined)
      input.dataAprovacao = body.dataAprovacao ? new Date(body.dataAprovacao) : null;
    // Folhas dinâmicas — se fornecidas, service substitui completamente
    if (body.folhas !== undefined) input.folhas = body.folhas;

    const lancamento = await updateLancamento(lid, input, Number(session.user.id));

    return NextResponse.json({
      data: {
        ...lancamento,
        folhas: lancamento.folhas,
        folhaTotal: lancamento.folhaTotal,
        totalARecolher: lancamento.totalARecolher,
        totalRecolhido: lancamento.totalRecolhido,
        deficitTotal: lancamento.deficitTotal,
      },
    });
  } catch (error) {
    console.error("❌ ERRO PATCH /api/lancamentos/[id]:", error);
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes("não encontrado")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes("encerrado")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    const isBusiness =
      msg.includes("obrigatória") ||
      msg.includes("TipoFolha") ||
      msg.includes("não encontrado");
    return NextResponse.json(
      { error: isBusiness ? msg : `Erro ao atualizar: ${msg}` },
      { status: isBusiness ? 400 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageLancamentos(session.user.role)) return forbidden();

  const { id } = await params;
  const lid = Number(id);
  if (!Number.isInteger(lid)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const before = await prisma.folhaPrevidenciaria.findUnique({
    where: { id: lid },
    include: { exercicio: true },
  });
  if (!before) return NextResponse.json({ error: "Lançamento não encontrado" }, { status: 404 });
  if (before.exercicio.status === "ENCERRADO") {
    return NextResponse.json(
      { error: `Exercício ${before.exercicio.ano} está encerrado. Exclusão bloqueada.` },
      { status: 409 }
    );
  }

  await prisma.folhaPrevidenciaria.delete({ where: { id: lid } });
  await recordAudit({
    userId: session.user.id,
    entityType: "FolhaPrevidenciaria",
    entityId: lid,
    action: "DELETE",
    before,
  });
  return NextResponse.json({ ok: true });
}
