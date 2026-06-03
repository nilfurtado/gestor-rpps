import { prisma } from "./src/lib/db";

async function main() {
  const rpps = await prisma.institutoRpps.findUnique({
    where: { id: 1 },
  });
  
  if (rpps) {
    console.log("✓ Dados do RPPS encontrados:");
    console.log(JSON.stringify(rpps, null, 2));
  } else {
    console.log("✗ Nenhum dado de RPPS salvo ainda");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
