import { prisma } from "./src/lib/db";

async function main() {
  const lancamentos = await prisma.folhaPrevidenciaria.findMany({
    take: 10,
    include: {
      orgao: { select: { nome: true, sigla: true } },
      exercicio: { select: { ano: true } },
      competencia: { select: { mes: true } },
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`\n📊 Total de lançamentos no banco: ${await prisma.folhaPrevidenciaria.count()}`);
  console.log(`\n📋 Últimos 10 lançamentos:\n`);
  
  if (lancamentos.length === 0) {
    console.log("✗ Nenhum lançamento encontrado");
  } else {
    lancamentos.forEach((l, i) => {
      console.log(`${i + 1}. ${l.orgao?.sigla} - ${l.competencia?.mes}/${l.exercicio?.ano}`);
      console.log(`   Status: ${l.status} | Valor: ${l.valorArrecadado}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
