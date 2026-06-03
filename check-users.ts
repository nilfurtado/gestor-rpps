import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Buscando usuários no banco...\n");
  
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("❌ Nenhum usuário cadastrado no banco de dados");
    console.log("\n📝 Para criar um usuário, use:");
    console.log("   npm run seed");
  } else {
    console.log("✅ Usuários encontrados:\n");
    users.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Nome: ${user.nome}`);
      console.log(`Role: ${user.role}`);
      console.log(`---`);
    });
  }
}

main().finally(() => prisma.$disconnect());
