import { prisma } from "./src/lib/db";

async function main() {
  // Deletar usuário admin que criei
  await prisma.user.deleteMany({
    where: { email: "admin@gestor.local" }
  });

  // Listar todos os usuários
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" }
  });

  console.log("=== USUÁRIOS NO BANCO DE DADOS ===\n");
  if (users.length === 0) {
    console.log("Nenhum usuário encontrado");
  } else {
    users.forEach((u) => {
      console.log(`ID: ${u.id}`);
      console.log(`Nome: ${u.nome}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role: ${u.role}`);
      console.log("---");
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
