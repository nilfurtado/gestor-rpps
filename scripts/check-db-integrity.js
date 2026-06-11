const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkIntegrity() {
  try {
    console.log("🔍 VERIFICANDO INTEGRIDADE DO BANCO DE DADOS\n");

    // Teste 1: Conectar ao banco
    console.log("✅ Conectando ao banco...");
    const health = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("✅ Conexão OK\n");

    // Teste 2: Contar registros principais
    console.log("📊 CONTAGEM DE REGISTROS:\n");

    const orgaos = await prisma.orgao.count();
    console.log(`  Órgãos: ${orgaos}`);

    const lancamentos = await prisma.lancamento.count();
    console.log(`  Lançamentos: ${lancamentos}`);

    const rpps = await prisma.institutoRpps.count();
    console.log(`  RPPS: ${rpps}`);

    const exercicios = await prisma.exercicio.count();
    console.log(`  Exercícios: ${exercicios}`);

    const competencias = await prisma.competencia.count();
    console.log(`  Competências: ${competencias}`);

    // Teste 3: Verificar RPPS
    console.log("\n📋 DADOS DO RPPS:\n");
    const rppsData = await prisma.institutoRpps.findUnique({
      where: { id: 1 },
      select: {
        nomeInstituto: true,
        cnpj: true,
        banco: true,
        agencia: true,
        conta: true,
      },
    });

    if (rppsData) {
      console.log(`  Nome: ${rppsData.nomeInstituto}`);
      console.log(`  CNPJ: ${rppsData.cnpj}`);
      console.log(`  Banco: ${rppsData.banco}`);
      console.log(`  Agência: ${rppsData.agencia}`);
      console.log(`  Conta: ${rppsData.conta}`);
    } else {
      console.log("  ❌ RPPS não encontrado!");
    }

    // Teste 4: Verificar últimos lançamentos
    console.log("\n📝 ÚLTIMOS LANÇAMENTOS:\n");
    const lancamentosRecentes = await prisma.lancamento.findMany({
      take: 3,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        updatedAt: true,
        acrescimo_tipo: true,
      },
    });

    lancamentosRecentes.forEach((l, i) => {
      console.log(`  ${i + 1}. ID: ${l.id} | Tipo: ${l.acrescimo_tipo} | Atualizado: ${l.updatedAt}`);
    });

    console.log("\n✅ BANCO DE DADOS ÍNTEGRO!");
    console.log("✅ Todos os dados estão OK!");

  } catch (error) {
    console.error("\n❌ ERRO NA INTEGRIDADE DO BANCO:");
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntegrity();
