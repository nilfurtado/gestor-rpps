import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AcordoForm, type AcordoInitial } from "../../novo/acordo-form";

export const metadata = { title: "Editar Acordo — Santana Previdência" };
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export default async function EditarAcordoPage({ params }: Ctx) {
  const { id } = await params;
  const aid = Number(id);
  if (!Number.isInteger(aid)) notFound();

  const [acordo, orgaos] = await Promise.all([
    prisma.acordo.findUnique({
      where: { id: aid },
      include: {
        orgao: true,
        lancamentos: {
          include: {
            competencia: { select: { mes: true, ordem: true } },
            exercicio: { select: { ano: true } },
          },
        },
      },
    }),
    prisma.orgao.findMany({
      orderBy: { sigla: "asc" },
      select: { id: true, sigla: true, nome: true },
    }),
  ]);

  if (!acordo) notFound();

  const initial: AcordoInitial = {
    id: acordo.id,
    numero: acordo.numero,
    dataAcordo: acordo.dataAcordo.toISOString(),
    orgaoId: acordo.orgaoId,
    tipoDebito: acordo.tipoDebito,
    valorOriginal: Number(acordo.valorOriginal),
    atualizacaoMonetaria: Number(acordo.atualizacaoMonetaria),
    jurosAcordo: Number(acordo.jurosAcordo),
    multaAcordo: Number(acordo.multaAcordo),
    valorConsolidado: Number(acordo.valorConsolidado),
    numeroParcelas: acordo.numeroParcelas,
    valorParcela: Number(acordo.valorParcela),
    diaVencimento: acordo.diaVencimento,
    primeiroVencimento: acordo.primeiroVencimento.toISOString(),
    parcelasPagas: acordo.parcelasPagas,
    valorPago: Number(acordo.valorPago),
    status: acordo.status,
    formaGarantia: acordo.formaGarantia,
    garantiaDetalhes: acordo.garantiaDetalhes,
    leiAutorizativa: acordo.leiAutorizativa,
    observacoes: acordo.observacoes,
    lancamentos: acordo.lancamentos.map((l) => ({
      id: l.id,
      tipo: l.tipo,
      competencia: { mes: l.competencia.mes, ordem: l.competencia.ordem },
      exercicio: { ano: l.exercicio.ano },
      deficit: Number(l.deficit),
    })),
  };

  return (
    <>
      <PageHeader
        title={`Acordo ${acordo.numero}`}
        description={`${acordo.orgao.sigla} · ${acordo.tipoDebito === "PATRONAL" ? "Patronal" : acordo.tipoDebito === "SEGURADO" ? "Segurado" : "Ambos"} · ${acordo.numeroParcelas} parcelas`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/acordos">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <AcordoForm orgaos={orgaos} initial={initial} />
        </CardContent>
      </Card>
    </>
  );
}
