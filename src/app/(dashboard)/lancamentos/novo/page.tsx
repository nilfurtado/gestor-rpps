import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LancamentoForm } from "./lancamento-form";

export const metadata = { title: "Novo Lançamento — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function NovoLancamentoPage() {
  const [orgaos, exercicios, competencias, existentes] = await Promise.all([
    prisma.orgao.findMany({
      where: { status: "ATIVO" },
      orderBy: { sigla: "asc" },
      select: { id: true, sigla: true, nome: true },
    }),
    prisma.exercicio.findMany({
      where: { status: "ABERTO" },
      orderBy: { ano: "desc" },
      select: { id: true, ano: true },
    }),
    prisma.competencia.findMany({
      orderBy: { ordem: "asc" },
      select: { id: true, ordem: true, mes: true },
    }),
    prisma.folhaPrevidenciaria.findMany({
      select: {
        id: true,
        orgaoId: true,
        tipo: true,
        exercicioId: true,
        competenciaId: true,
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Novo lançamento"
        description="Registre uma folha previdenciária mensal."
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
            existingKeys={existentes}
          />
        </CardContent>
      </Card>
    </>
  );
}
