const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function getRppsData() {
  try {
    const rpps = await prisma.institutoRpps.findUnique({
      where: { id: 1 },
    });

    console.log("\n📊 DADOS DO RPPS NO SISTEMA:\n");
    console.log("ID:", rpps?.id);
    console.log("Nome:", rpps?.nomeInstituto);
    console.log("CNPJ:", rpps?.cnpj);
    console.log("Banco:", rpps?.banco);
    console.log("Agência:", rpps?.agencia);
    console.log("Conta:", rpps?.conta);
    console.log("Tipo de Conta:", rpps?.tipoConta);
    console.log("\n");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getRppsData();
