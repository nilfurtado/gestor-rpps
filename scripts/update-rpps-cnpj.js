const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateRpps() {
  try {
    const result = await prisma.institutoRpps.upsert({
      where: { id: 1 },
      update: {
        cnpj: "00743471000190", // Sem formatação
      },
      create: {
        id: 1,
        cnpj: "00743471000190",
        nomeInstituto: "SANPREV",
        banco: "001",
      },
    });

    console.log("✅ RPPS atualizado com sucesso!");
    console.log("ID:", result.id);
    console.log("CNPJ:", result.cnpj);
    console.log("Nome:", result.nomeInstituto);
    console.log("Banco:", result.banco);
  } catch (error) {
    console.error("❌ Erro ao atualizar RPPS:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRpps();
