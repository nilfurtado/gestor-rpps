import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { LancamentosClient } from "./lancamentos-client";

export const metadata = { title: "Lançamentos — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const [lancamentos, orgaos, exercicios, competencias] = await Promise.all([
    prisma.folhaPrevidenciaria.findMany({
      include: {
        orgao: { select: { id: true, sigla: true, nome: true, cor: true } },
        exercicio: { select: { id: true, ano: true, status: true } },
        competencia: { select: { id: true, ordem: true, mes: true } },
        acordos: {
          select: { id: true, numero: true, status: true },
          orderBy: { dataAcordo: "desc" },
        },
      },
      orderBy: [
        { exercicio: { ano: "desc" } },
        { competencia: { ordem: "asc" } },
        { orgao: { sigla: "asc" } },
      ],
    }),
    prisma.orgao.findMany({ where: { status: "ATIVO" }, orderBy: { sigla: "asc" } }),
    prisma.exercicio.findMany({ orderBy: { ano: "desc" } }),
    prisma.competencia.findMany({ orderBy: { ordem: "asc" } }),
  ]);

  const rows = lancamentos.map((l) => ({
    id: l.id,
    orgao: { ...l.orgao },
    tipo: l.tipo,
    exercicio: l.exercicio,
    competencia: l.competencia,
    aliquota: Number(l.aliquota),
    valorRecolher: Number(l.valorRecolher),
    valorRecolhido: Number(l.valorRecolhido),
    deficit: Number(l.deficit),
    inadimplencia: Number(l.inadimplencia),
    status: l.status,
    parcelado: l.parcelado,
    dataVencimento: l.dataVencimento ? l.dataVencimento.toISOString() : null,
    acordo: l.acordos[0]
      ? { id: l.acordos[0].id, numero: l.acordos[0].numero }
      : null,
    multas: l.multas ? Number(l.multas) : undefined,
    juros: l.juros ? Number(l.juros) : undefined,
  }));

  return (
    <>
      <PageHeader
        title="Lançamentos"
        description="Folhas previdenciárias por órgão, tipo e competência."
        actions={
          <Button asChild>
            <Link href="/lancamentos/novo">
              <Plus className="h-4 w-4" />
              Novo lançamento
            </Link>
          </Button>
        }
      />

      <LancamentosClient
        lancamentos={rows}
        orgaos={orgaos}
        exercicios={exercicios}
        competencias={competencias}
      />
    </>
  );
}
