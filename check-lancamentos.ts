import { prisma } from "@/lib/db";

async function main() {
  const lancamentos = await prisma.lancamento.findMany({
    include: {
      orgao: { select: { sigla: true } },
      exercicio: { select: { ano: true } },
      competencia: { select: { mes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(`\n📊 LANÇAMENTOS (últimos 10):\n`);
  lancamentos.forEach((l) => {
    console.log(`
  ${l.orgao.sigla} • ${l.competencia.mes} ${l.exercicio.ano} • ${l.tipo}
  Recolher: ${l.valorRecolher} | Recolhido: ${l.valorRecolhido}
  Multas: ${l.multas} | Juros: ${l.juros}
  Status: ${l.status} | Parcelado: ${l.parcelado}
  ─────────────────────────────────────────`);
  });

  console.log(`\nTotal: ${await prisma.lancamento.count()} lançamentos no banco`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
