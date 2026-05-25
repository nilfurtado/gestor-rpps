import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, orgaos, exercicios, competencias, folhas, acordos, rpps, audit] =
    await Promise.all([
      prisma.user.count(),
      prisma.orgao.count(),
      prisma.exercicio.count(),
      prisma.competencia.count(),
      prisma.folhaPrevidenciaria.count(),
      prisma.acordo.count(),
      prisma.institutoRpps.count(),
      prisma.auditLog.count(),
    ]);

  console.log("=== Estado atual do Neon Postgres ===");
  console.log(`Usuários:             ${users}`);
  console.log(`Órgãos:               ${orgaos}`);
  console.log(`Exercícios:           ${exercicios}`);
  console.log(`Competências:         ${competencias}`);
  console.log(`Folhas (lançamentos): ${folhas}`);
  console.log(`Acordos:              ${acordos}`);
  console.log(`InstitutoRpps:        ${rpps}`);
  console.log(`AuditLog:             ${audit}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
