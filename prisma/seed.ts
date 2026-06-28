import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rppsData = {
    nomeInstituto: "Santana Previdência",
    nomeResponsavel: "Divisão de Arrecadação",
    cnpj: "00.743.471/0001-90",
    enderecoCompleto: "Av. Getúlio Vargas, 1000 - Centro",
    telefone: "(92) 3215-5000",
    email: "arrecadacao@sanprev.am.gov.br",
    nomeDepartamento: "Divisão de Arrecadação",
    responsavelDepartamento: "Gerente de Arrecadação",
    banco: "001",
    agencia: "3346",
    conta: "18.910",
    tipoConta: "Corrente",
  };

  const rpps = await prisma.institutoRpps.upsert({
    where: { id: 1 },
    update: rppsData,
    create: { id: 1, ...rppsData },
  });

  console.log("✅ RPPS atualizado:", rpps);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
