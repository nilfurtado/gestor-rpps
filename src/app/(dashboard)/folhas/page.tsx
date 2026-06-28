import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { FolhasClient } from "./folhas-client";

export const metadata = { title: "Tipos de Folhas — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function FolhasPage() {
  const [tiposFolha, lancamentosCounts] = await Promise.all([
    prisma.tipoFolha.findMany({
      orderBy: { ordem: "asc" },
    }),
    prisma.lancamentoFolha.groupBy({
      by: ["tipoFolhaId"],
      _count: true,
    }),
  ]);

  const countMap = new Map(
    lancamentosCounts.map((item) => [item.tipoFolhaId, item._count])
  );

  const tiposComCount = tiposFolha.map((tipo) => ({
    ...tipo,
    lancamentosCount: countMap.get(tipo.id) || 0,
  }));

  return (
    <>
      <PageHeader
        title="Tipos de Folhas"
        description="Gerenciar tipos de folhas de pagamento e contribuições"
        actions={
          <Button asChild>
            <div className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </div>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <FolhasClient tiposFolha={tiposComCount} />
        </CardContent>
      </Card>
    </>
  );
}
