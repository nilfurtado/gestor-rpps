import { prisma } from "./src/lib/db";

async function main() {
  const exercicios = await prisma.exercicio.findMany({
    orderBy: { ano: "desc" },
  });

  console.log(`Total de exercícios: ${exercicios.length}`);
  console.log("Exercícios:");
  exercicios.forEach((e) => {
    console.log(`  ${e.ano} - Status: ${e.status}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
