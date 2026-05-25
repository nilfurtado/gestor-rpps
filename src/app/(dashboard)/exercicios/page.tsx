import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { ExerciciosPanel } from "./exercicios-panel";

export const metadata = { title: "Exercícios — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function ExerciciosPage() {
  const exercicios = await prisma.exercicio.findMany({
    orderBy: { ano: "desc" },
    include: { _count: { select: { lancamentos: true } } },
  });

  const rows = exercicios.map((e) => ({
    id: e.id,
    ano: e.ano,
    status: e.status,
    lancamentosCount: e._count.lancamentos,
  }));

  return (
    <>
      <PageHeader
        title="Anos de Exercício"
        description="Gerencie os exercícios fiscais cadastrados no sistema."
      />
      <ExerciciosPanel exercicios={rows} />
    </>
  );
}
