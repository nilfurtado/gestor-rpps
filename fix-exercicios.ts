import { prisma } from "./src/lib/db";

async function main() {
  console.log("Atualizando status dos exercícios para ABERTO...");

  const updated = await prisma.exercicio.updateMany({
    where: {
      ano: {
        gte: 2010,
        lte: 2025,
      },
    },
    data: {
      status: "ABERTO",
    },
  });

  console.log(`✓ ${updated.count} exercícios atualizados para status ABERTO`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
