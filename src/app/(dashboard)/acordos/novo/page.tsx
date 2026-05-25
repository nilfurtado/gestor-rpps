import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AcordoForm } from "./acordo-form";

export const metadata = { title: "Novo Acordo — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function NovoAcordoPage() {
  const orgaos = await prisma.orgao.findMany({
    where: { status: "ATIVO" },
    orderBy: { sigla: "asc" },
    select: { id: true, sigla: true, nome: true },
  });

  return (
    <>
      <PageHeader
        title="Novo acordo"
        description="Registre um Termo de Parcelamento vinculando lançamentos inadimplentes."
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
          <AcordoForm orgaos={orgaos} />
        </CardContent>
      </Card>
    </>
  );
}
