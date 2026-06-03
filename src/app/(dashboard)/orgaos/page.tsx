import { Building2, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { OrgaosTable } from "./orgaos-table";
import Link from "next/link";

export const metadata = { title: "Órgãos — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function OrgaosPage() {
  const orgaos = await prisma.orgao.findMany({
    orderBy: { sigla: "asc" },
    include: { _count: { select: { lancamentos: true } } },
  });

  return (
    <>
      <PageHeader
        title="Órgãos"
        description="Cadastro dos entes municipais vinculados ao RPPS."
        actions={
          <Link href="/orgaos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo órgão
            </Button>
          </Link>
        }
      />

      <OrgaosTable orgaos={orgaos.map((o) => ({
        id: o.id,
        sigla: o.sigla,
        nome: o.nome,
        cor: o.cor,
        status: o.status,
        lancamentosCount: o._count.lancamentos,
      }))} />
    </>
  );
}
