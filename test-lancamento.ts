import { prisma } from "./src/lib/db";

async function main() {
  try {
    console.log("Testando criação de lançamento...");

    // Dados de teste
    const orgaoId = 1; // SEMAD
    const exercicioId = 16; // 2025
    const competenciaId = 1; // Janeiro
    const userId = 1; // Usuário teste

    console.log(`\nVerificando dados:`);
    const orgao = await prisma.orgao.findUnique({ where: { id: orgaoId } });
    console.log(`Órgão: ${orgao?.sigla ?? "NÃO ENCONTRADO"}`);

    const exercicio = await prisma.exercicio.findUnique({ where: { id: exercicioId } });
    console.log(`Exercício: ${exercicio?.ano ?? "NÃO ENCONTRADO"}`);

    const competencia = await prisma.competencia.findUnique({ where: { id: competenciaId } });
    console.log(`Competência: ${competencia?.mes ?? "NÃO ENCONTRADO"}`);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    console.log(`Usuário: ${user?.nome ?? "NÃO ENCONTRADO"}`);

    if (!orgao || !exercicio || !competencia || !user) {
      console.log("\n❌ Faltam dados necessários!");
      return;
    }

    console.log("\n✓ Todos os dados existem. Criando lançamento...\n");

    const lancamento = await prisma.folhaPrevidenciaria.create({
      data: {
        orgaoId,
        tipo: "PATRONAL",
        exercicioId,
        competenciaId,
        aliquota: 14,
        valorRecolher: 1000,
        valorRecolherCalculado: 1000,
        valorRecolhido: 1000,
        deficit: 0,
        superavit: 0,
        inadimplencia: 0,
        percentualPago: 100,
        encargosTotal: 0,
        valorTotalDevido: 0,
        valorLiquidoArrecadado: 1000,
        status: "PAGO",
        responsavelId: userId,
      },
    });

    console.log("✓ Lançamento criado com sucesso!");
    console.log(`ID: ${lancamento.id}`);
  } catch (error) {
    console.error("❌ Erro ao criar lançamento:");
    console.error(error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
