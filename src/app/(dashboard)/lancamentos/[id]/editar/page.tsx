import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  LancamentoForm,
  type LancamentoInitial,
} from "../../novo/lancamento-form";

export const metadata = { title: "Editar Lançamento — Santana Previdência" };
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

// Decodifica slug como: "sigla-mes-ano" → busca no banco
async function buscarLancamentoPorSlug(slug: string) {
  const partes = slug.split("-");
  if (partes.length < 3) return null;

  const ano = Number(partes[partes.length - 1]);
  const sigla = partes.slice(0, -2).join("-").toUpperCase();
  const mesSlug = partes[partes.length - 2];

  const meses: Record<string, string> = {
    janeiro: "Janeiro",
    fevereiro: "Fevereiro",
    marco: "Março",
    abril: "Abril",
    maio: "Maio",
    junho: "Junho",
    julho: "Julho",
    agosto: "Agosto",
    setembro: "Setembro",
    outubro: "Outubro",
    novembro: "Novembro",
    dezembro: "Dezembro",
  };

  const mes = meses[mesSlug];
  if (!mes || isNaN(ano)) return null;

  return await prisma.folhaPrevidenciaria.findFirst({
    where: {
      orgao: { sigla },
      competencia: { mes },
      exercicio: { ano },
    },
    include: { orgao: true, exercicio: true, competencia: true },
  });
}

export default async function EditarLancamentoPage({ params }: Ctx) {
  const { id: slug } = await params;

  const [lancamento, orgaos, exercicios, competencias] = await Promise.all([
    buscarLancamentoPorSlug(slug),
    prisma.orgao.findMany({
      orderBy: { sigla: "asc" },
      select: { id: true, sigla: true, nome: true },
    }),
    prisma.exercicio.findMany({
      orderBy: { ano: "desc" },
      select: { id: true, ano: true },
    }),
    prisma.competencia.findMany({
      orderBy: { ordem: "asc" },
      select: { id: true, ordem: true, mes: true },
    }),
  ]);

  if (!lancamento) notFound();

  const initial: LancamentoInitial = {
    id: lancamento.id,
    orgaoId: lancamento.orgaoId,
    tipo: lancamento.tipo,
    exercicioId: lancamento.exercicioId,
    competenciaId: lancamento.competenciaId,
    aliquota: Number(lancamento.aliquota),
    valorRecolher: Number(lancamento.valorRecolher),
    valorRecolhido: Number(lancamento.valorRecolhido),
    quantidadeServidores: lancamento.quantidadeServidores,
    folhaBase: lancamento.folhaBase != null ? Number(lancamento.folhaBase) : null,
    folhaSuplementar: lancamento.folhaSuplementar != null ? Number(lancamento.folhaSuplementar) : null,
    multas: lancamento.multas != null ? Number(lancamento.multas) : null,
    juros: lancamento.juros != null ? Number(lancamento.juros) : null,
    parcelado: lancamento.parcelado,
    acrescimo: lancamento.acrescimo != null ? Number(lancamento.acrescimo) : 0,
    dataVencimento: lancamento.dataVencimento
      ? lancamento.dataVencimento.toISOString()
      : null,
    observacoes: lancamento.observacoes,
    justificativaDiferenca: lancamento.justificativaDiferenca,
    diferenca_aprovada: lancamento.diferenca_aprovada,
    dataAprovacao: lancamento.dataAprovacao
      ? lancamento.dataAprovacao.toISOString()
      : null,
  };

  return (
    <>
      <PageHeader
        title="Editar lançamento"
        description={`${lancamento.orgao.sigla} · ${lancamento.competencia.mes} · ${lancamento.exercicio.ano} · ${lancamento.tipo === "PATRONAL" ? "Patronal" : "Segurado"}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/lancamentos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <LancamentoForm
            orgaos={orgaos}
            exercicios={exercicios}
            competencias={competencias}
            initial={initial}
          />
        </CardContent>
      </Card>
    </>
  );
}
