import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const competencias = [
  { ordem: 1, mes: "Janeiro" },
  { ordem: 2, mes: "Fevereiro" },
  { ordem: 3, mes: "Março" },
  { ordem: 4, mes: "Abril" },
  { ordem: 5, mes: "Maio" },
  { ordem: 6, mes: "Junho" },
  { ordem: 7, mes: "Julho" },
  { ordem: 8, mes: "Agosto" },
  { ordem: 9, mes: "Setembro" },
  { ordem: 10, mes: "Outubro" },
  { ordem: 11, mes: "Novembro" },
  { ordem: 12, mes: "Dezembro" },
];

async function main() {
  console.log("🌱 Inserindo competências...");

  for (const comp of competencias) {
    const existing = await prisma.competencia.findUnique({
      where: { ordem: comp.ordem },
    });

    if (!existing) {
      await prisma.competencia.create({
        data: comp,
      });
      console.log(`✅ ${comp.mes} (${comp.ordem})`);
    } else {
      console.log(`⏭️  ${comp.mes} já existe`);
    }
  }

  console.log("\n✨ Competências inseridas com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
