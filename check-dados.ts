import { prisma } from "./src/lib/db";

async function main() {
  const [orgaos, exercicios, competencias] = await Promise.all([
    prisma.orgao.findMany({ where: { status: "ATIVO" } }),
    prisma.exercicio.findMany({ where: { status: "ABERTO" } }),
    prisma.competencia.findMany(),
  ]);

  console.log(`\n📦 ÓRGÃOS (ATIVO): ${orgaos.length}`);
  orgaos.forEach((o) => console.log(`  ${o.id}: ${o.sigla} - ${o.nome}`));

  console.log(`\n📅 EXERCÍCIOS (ABERTO): ${exercicios.length}`);
  exercicios.forEach((e) => console.log(`  ${e.id}: ${e.ano}`));

  console.log(`\n📋 COMPETÊNCIAS: ${competencias.length}`);
  competencias.forEach((c) => console.log(`  ${c.id}: ${c.mes}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
