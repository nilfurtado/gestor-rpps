import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { SupplementarClient } from "./suplementar-client";

export const metadata = { title: "Folhas Suplementares — Santana Previdência" };
export const dynamic = "force-dynamic";

export default async function SupplementarPage() {
  const [suplementares, folhas] = await Promise.all([
    prisma.folhaSupplementar.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.folhaPrevidenciaria.findMany({
      select: {
        id: true,
        tipo: true,
        orgao: { select: { sigla: true } },
        exercicio: { select: { ano: true } },
        competencia: { select: { mes: true } },
      },
      orderBy: [
        { exercicio: { ano: "desc" } },
        { competencia: { ordem: "asc" } },
        { orgao: { sigla: "asc" } },
      ],
    }),
  ]);

  const suplementaresRows = suplementares.map((s) => ({
    id: s.id,
    folhaPrevidenciariaId: s.folhaPrevidenciariaId,
    motivo: s.motivo as "RESCISAO" | "COMPLEMENTACAO" | "FERIAS" | "OUTRO",
    descricao: s.descricao ?? null,
    folhaBase: Number(s.folhaBase),
    status: s.status,
    observacoes: s.observacoes ?? null,
    createdAt: s.createdAt.toISOString(),
  }));

  const folhasOptions = folhas.map((f) => ({
    id: f.id,
    label: [
      f.orgao.sigla,
      f.competencia.mes,
      String(f.exercicio.ano),
      f.tipo === "PATRONAL" ? "Patronal" : "Segurado",
    ].join(" · "),
  }));

  return (
    <>
      <PageHeader
        title="Folhas Suplementares"
        description="Lançamentos adicionais vinculados às folhas previdenciárias."
      />
      <SupplementarClient
        initialSupplementares={suplementaresRows}
        folhas={folhasOptions}
      />
    </>
  );
}
