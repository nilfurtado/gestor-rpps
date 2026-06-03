import { prisma } from "./src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Criando usuários...");

  // Criar usuários com IDs 2, 3, 4
  for (let i = 2; i <= 4; i++) {
    const existing = await prisma.user.findUnique({ where: { id: i } });

    if (!existing) {
      const hash = await bcrypt.hash("senha123", 10);
      await prisma.user.create({
        data: {
          id: i,
          email: `usuario${i}@example.com`,
          nome: `Usuário ${i}`,
          passwordHash: hash,
          role: "OPERADOR",
        },
      });
      console.log(`✓ Usuário ${i} criado`);
    }
  }

  const users = await prisma.user.findMany();
  console.log(`\nTotal de usuários: ${users.length}`);
  users.forEach((u) => console.log(`  ${u.id}: ${u.nome} (${u.email})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
