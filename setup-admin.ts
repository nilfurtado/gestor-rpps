import { prisma } from "./src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@gestor.local" },
    update: { passwordHash: hash, role: "GESTOR" },
    create: {
      email: "admin@gestor.local",
      nome: "Administrador",
      passwordHash: hash,
      role: "GESTOR",
    },
  });

  console.log("✓ Usuário admin configurado:");
  console.log(`  Email: admin@gestor.local`);
  console.log(`  Senha: admin123`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
