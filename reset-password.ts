import { prisma } from "./src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("123456", 10);
  
  const user = await prisma.user.update({
    where: { id: 1 },
    data: { passwordHash: hash }
  });

  console.log("✓ Senha do usuário atualizada:");
  console.log(`  Email: ${user.email}`);
  console.log(`  Senha: 123456`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
