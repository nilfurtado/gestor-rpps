import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const anos = await prisma.ano.count();
  const usuarios = await prisma.usuario.count();
  const lancamentos = await prisma.lancamento.count();
  
  console.log(`Anos: ${anos}`);
  console.log(`Usuários: ${usuarios}`);
  console.log(`Lançamentos: ${lancamentos}`);
  
  const firstUser = await prisma.usuario.findFirst();
  console.log(`\nPrimeiro usuário:`, firstUser?.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
