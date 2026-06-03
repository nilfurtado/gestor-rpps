import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 TESTE: Salvando lançamento (FolhaPrevidenciaria)");

  // Dados de teste
  const testData = {
    orgaoId: 1,
    tipo: "PATRONAL" as const,
    exercicioId: 1,
    competenciaId: 1,
    aliquota: 14,
    valorRecolher: 1000,
    valorRecolhido: 800,
    quantidadeServidores: 100,
    folhaBase: 7142.86,
    multas: 50,
    juros: 25,
    parcelado: false,
    dataVencimento: new Date(),
    deficit: 200,
    inadimplencia: 20,
    status: "PARCIAL" as const,
  };

  try {
    console.log("\n📝 Dados a salvar:");
    console.log(JSON.stringify(testData, null, 2));

    // Verificar se órgão existe
    const orgao = await prisma.orgao.findUnique({ where: { id: 1 } });
    if (!orgao) {
      console.log("\n❌ Órgão ID 1 não existe");
      return;
    }
    console.log(`\n✅ Órgão encontrado: ${orgao.sigla}`);

    // Criar lançamento
    const lancamento = await prisma.folhaPrevidenciaria.create({
      data: testData,
    });

    console.log(`\n✅ Lançamento criado com sucesso!`);
    console.log(`ID: ${lancamento.id}`);
    console.log(`Órgão: ${lancamento.orgaoId}`);
    console.log(`Valor a Recolher: ${lancamento.valorRecolher}`);
    console.log(`Valor Recolhido: ${lancamento.valorRecolhido}`);
    console.log(`Deficit: ${lancamento.deficit}`);
    console.log(`Status: ${lancamento.status}`);
    console.log(`Criado em: ${lancamento.createdAt}`);

    // Verificar se foi salvo mesmo
    const verificacao = await prisma.folhaPrevidenciaria.findUnique({
      where: { id: lancamento.id },
    });

    if (verificacao) {
      console.log(`\n✅ CONFIRMADO: Lançamento salvo e recuperado do banco!`);
    } else {
      console.log(`\n❌ ERRO: Lançamento não foi encontrado após criar`);
    }

    // Listar últimos lançamentos
    const ultimos = await prisma.folhaPrevidenciaria.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    console.log(`\n📊 Últimos 3 lançamentos no banco:`);
    ultimos.forEach((l, i) => {
      console.log(`${i + 1}. ID ${l.id}: Recolher ${l.valorRecolher} / Recolhido ${l.valorRecolhido} (${l.status})`);
    });
  } catch (err) {
    console.error(`\n❌ ERRO ao salvar:`, err);
  }
}

main().finally(() => prisma.$disconnect());
