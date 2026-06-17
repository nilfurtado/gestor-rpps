import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { lancamentoSchema } from "@/lib/schemas";
import { calcularLancamento } from "@/lib/calc/lancamento";
import { recordAudit } from "@/lib/audit";
import { canManageLancamentos, forbidden } from "@/lib/permissions";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET() {
  return NextResponse.json(null, { status: 200 });
}

export async function PATCH(req: Request, { params }: Ctx) {
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
      { error: `Exercício ${before.exercicio.ano} está encerrado. Edição bloqueada.` },
      { status: 409 }
    );
  }

  const body = await req.json();

  console.log("PATCH body recebido:", JSON.stringify(body, null, 2));

  // Preparar dados para salvar
  const dataToUpdate: any = {};

  // Copiar todos os campos que vieram no body
  if (body.aliquota !== undefined) dataToUpdate.aliquota = Number(body.aliquota);
  if (body.valorRecolher !== undefined) dataToUpdate.valorRecolher = Number(body.valorRecolher);
  if (body.valorRecolhido !== undefined) dataToUpdate.valorRecolhido = Number(body.valorRecolhido);
  if (body.quantidadeServidores !== undefined) dataToUpdate.quantidadeServidores = body.quantidadeServidores ? Number(body.quantidadeServidores) : null;
  if (body.folhaBase !== undefined) dataToUpdate.folhaBase = body.folhaBase ? Number(body.folhaBase) : null;
  if (body.folhaSuplementar !== undefined) dataToUpdate.folhaSuplementar = body.folhaSuplementar ? Number(body.folhaSuplementar) : null;
  if (body.multas !== undefined) dataToUpdate.multas = body.multas ? Number(body.multas) : null;
  if (body.juros !== undefined) dataToUpdate.juros = body.juros ? Number(body.juros) : null;
  if (body.acrescimo !== undefined) dataToUpdate.acrescimo = Number(body.acrescimo);
  if (body.acrescimo_tipo !== undefined) dataToUpdate.acrescimo_tipo = body.acrescimo_tipo;
  if (body.parcelado !== undefined) dataToUpdate.parcelado = Boolean(body.parcelado);
  if (body.dataVencimento !== undefined) dataToUpdate.dataVencimento = body.dataVencimento ? new Date(body.dataVencimento) : null;
  if (body.observacoes !== undefined) dataToUpdate.observacoes = body.observacoes;
  if (body.justificativaDiferenca !== undefined) dataToUpdate.justificativaDiferenca = body.justificativaDiferenca;
  if (body.diferenca_aprovada !== undefined) dataToUpdate.diferenca_aprovada = Boolean(body.diferenca_aprovada);
  if (body.dataAprovacao !== undefined) dataToUpdate.dataAprovacao = body.dataAprovacao ? new Date(body.dataAprovacao) : null;

  // Se foi aprovado, forçar status PAGO
  const isAprovado = body.diferenca_aprovada ?? before.diferenca_aprovada;

  if (isAprovado) {
    dataToUpdate.status = "PAGO";
  } else {
    // Recalcular apenas se mudou valores relevantes
    const needsRecalc = body.valorRecolher !== undefined || body.valorRecolhido !== undefined || body.parcelado !== undefined;

    if (needsRecalc) {
      const merged = {
        valorRecolher: Number(body.valorRecolher ?? before.valorRecolher),
        valorRecolhido: Number(body.valorRecolhido ?? before.valorRecolhido),
        parcelado: Boolean(body.parcelado ?? before.parcelado),
        acrescimo: Number(body.acrescimo ?? before.acrescimo),
        diferenca_aprovada: Boolean(body.diferenca_aprovada ?? before.diferenca_aprovada),
      };
      const calc = calcularLancamento(merged);
      dataToUpdate.deficit = calc.deficit;
      dataToUpdate.inadimplencia = calc.inadimplencia;
      dataToUpdate.status = calc.status;
    }
  }

  const updated = await prisma.folhaPrevidenciaria.update({
    where: { id: lid },
    data: dataToUpdate,
  });

  await recordAudit({
    userId: session.user.id,
    entityType: "FolhaPrevidenciaria",
    entityId: lid,
    action: "UPDATE",
    before,
    after: updated,
  });

  return NextResponse.json(updated);
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
