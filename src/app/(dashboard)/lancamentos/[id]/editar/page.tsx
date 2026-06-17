import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileStack, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import { MOTIVOS_SUPLEMENTO } from "@/types/folha-suplementar";
import {
  LancamentoForm,
  type LancamentoInitial,
} from "../../novo/lancamento-form";

export const metadata = { title: "Editar Lançamento — Santana Previdência" };
export const dynamic = "force-dynamic";

interface Ctx {
  params: Promise<{ id: string }>;
}

export default async function EditarLancamentoPage({ params }: Ctx) {
  const { id } = await params;
  const lid = Number(id);
  if (!Number.isInteger(lid)) notFound();

  const [lancamento, orgaos, exercicios, competencias] = await Promise.all([
    prisma.folhaPrevidenciaria.findUnique({
      where: { id: lid },
      include: {
        orgao: true,
        exercicio: true,
        competencia: true,
        folhasSupplementares: {
          orderBy: { createdAt: "asc" },
          select: { id: true, motivo: true, descricao: true, folhaBase: true, status: true },
        },
      },
    }),
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

      {/* Folhas Suplementares */}
      {(() => {
        const folhaBase = lancamento.folhaBase != null ? Number(lancamento.folhaBase) : 0;
        const suplementares = lancamento.folhasSupplementares;
        const totalSuplemental = suplementares.reduce((sum, s) => sum + Number(s.folhaBase), 0);
        const folhaTotal = folhaBase + totalSuplemental;
        const aliquota = Number(lancamento.aliquota);
        const valorRecolherCalculado = (folhaTotal * aliquota) / 100;

        const STATUS_LABELS: Record<string, string> = {
          PAGO: "Pago",
          PARCIAL: "Parcial",
          INADIMPLENTE: "Inadimplente",
          PARCELADO: "Parcelado",
          SEM_MOVIMENTO: "Sem Movimento",
          RECOLHIMENTO_A_MAIOR: "Recolhimento a Maior",
          LANCADO: "Lançado",
        };

        return (
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileStack className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-base">Folhas Suplementares</h3>
                  {suplementares.length > 0 && (
                    <Badge variant="secondary">{suplementares.length}</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/lancamentos/suplementar?folhaId=${lancamento.id}`}>
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Link>
                </Button>
              </div>

              {/* Resumo de valores */}
              {lancamento.folhaBase != null && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-lg border bg-muted/30 p-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Folha Base</div>
                    <div className="text-sm font-semibold tabular-nums">{formatBRL(folhaBase)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Suplementar</div>
                    <div className="text-sm font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                      {formatBRL(totalSuplemental)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Total</div>
                    <div className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                      {formatBRL(folhaTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">
                      A recolher ({aliquota}%)
                    </div>
                    <div className="text-sm font-semibold tabular-nums">
                      {formatBRL(valorRecolherCalculado)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela ou estado vazio */}
              {suplementares.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground gap-1">
                  <FileStack className="h-8 w-8 opacity-30" />
                  <span>Nenhuma folha suplementar registrada</span>
                  <Link
                    href={`/lancamentos/suplementar?folhaId=${lancamento.id}`}
                    className="text-primary hover:underline underline-offset-2 text-xs mt-1"
                  >
                    + Adicionar primeira suplementar
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-9 px-3">Motivo</TableHead>
                      <TableHead className="h-9 px-3">Descrição</TableHead>
                      <TableHead className="h-9 px-3 text-right">Valor</TableHead>
                      <TableHead className="h-9 px-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suplementares.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="px-3 py-2 text-sm font-medium">
                          {MOTIVOS_SUPLEMENTO[s.motivo as keyof typeof MOTIVOS_SUPLEMENTO] ?? s.motivo}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                          {s.descricao ?? "—"}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right tabular-nums text-sm font-semibold">
                          {formatBRL(Number(s.folhaBase))}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm">
                          {STATUS_LABELS[s.status] ?? s.status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </>
  );
}
