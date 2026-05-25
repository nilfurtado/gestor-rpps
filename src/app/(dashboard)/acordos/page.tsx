import Link from "next/link";
import { Handshake, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { AcordosClient } from "./acordos-client";

export const metadata = { title: "Acordos — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function AcordosPage() {
  const [acordos, orgaos] = await Promise.all([
    prisma.acordo.findMany({
      include: {
        orgao: { select: { id: true, sigla: true, nome: true } },
        lancamentos: { select: { id: true } },
      },
      orderBy: [{ dataAcordo: "desc" }, { id: "desc" }],
    }),
    prisma.orgao.findMany({ orderBy: { sigla: "asc" } }),
  ]);

  const rows = acordos.map((a) => ({
    id: a.id,
    numero: a.numero,
    orgao: a.orgao,
    tipoDebito: a.tipoDebito,
    dataAcordo: a.dataAcordo.toISOString(),
    valorConsolidado: Number(a.valorConsolidado),
    valorPago: Number(a.valorPago),
    numeroParcelas: a.numeroParcelas,
    parcelasPagas: a.parcelasPagas,
    status: a.status,
    lancamentoCount: a.lancamentos.length,
  }));

  return (
    <>
      <PageHeader
        title="Acordos / Parcelamentos"
        description="Termos formais de parcelamento de débitos previdenciários por órgão devedor."
        actions={
          <Button asChild>
            <Link href="/acordos/novo">
              <Plus className="h-4 w-4" />
              Novo acordo
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <Handshake className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nenhum acordo cadastrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie um termo de parcelamento vinculando lançamentos inadimplentes a um órgão devedor.
          </p>
          <Button asChild className="mt-4">
            <Link href="/acordos/novo">
              <Plus className="h-4 w-4" />
              Novo acordo
            </Link>
          </Button>
        </div>
      ) : (
        <AcordosClient acordos={rows} orgaos={orgaos} />
      )}
    </>
  );
}
