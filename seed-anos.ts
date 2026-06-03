import { prisma } from "./src/lib/db";

async function main() {
  console.log("Criando anos de 2010 a 2025...");

  for (let ano = 2010; ano <= 2025; ano++) {
    const existing = await prisma.exercicio.findUnique({
      where: { ano },
    });

    if (!existing) {
      await prisma.exercicio.create({
        data: {
          ano,
          status: "ABERTO",
        },
      });
      console.log(`✓ Ano ${ano} criado`);
    } else {
      console.log(`• Ano ${ano} já existe`);
    }
  }

  console.log("✓ Concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
