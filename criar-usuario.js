// Script para criar/atualizar o usuario admin diretamente no banco
// Uso: node criar-usuario.js
// Ou para credenciais customizadas: node criar-usuario.js meuusuario minhasenha

const { execSync } = require("child_process");
const path = require("path");

const usuario = process.argv[2] || "admin";
const senha = process.argv[3] || "admin123";
const nome = process.argv[4] || "Administrador SANPREV";

console.log("\n=== Criando usuario SANPREV ===");
console.log(`  Usuario: ${usuario}`);
console.log(`  Senha:   ${senha}`);
console.log(`  Nome:    ${nome}`);
console.log("");

// Usar tsx para executar o script inline com Prisma
const script = `
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("${senha}", 10);
  const user = await prisma.user.upsert({
    where: { email: "${usuario}" },
    update: { passwordHash: hash, nome: "${nome}" },
    create: {
      email: "${usuario}",
      nome: "${nome}",
      passwordHash: hash,
    },
  });
  console.log("Usuario criado/atualizado com sucesso:");
  console.log("  ID:       " + user.id);
  console.log("  Usuario:  " + user.email);
  console.log("  Nome:     " + user.nome);
  console.log("");
  console.log("Acesse o sistema com:");
  console.log("  Usuario: ${usuario}");
  console.log("  Senha:   ${senha}");
  await prisma.\$disconnect();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  if (e.message.includes("connect")) {
    console.error("");
    console.error("O banco de dados nao esta rodando!");
    console.error("Inicie o MariaDB/MySQL primeiro.");
  }
  process.exit(1);
});
`;

const tmpFile = path.join(__dirname, "_criar_user_tmp.ts");
require("fs").writeFileSync(tmpFile, script);

try {
  execSync(`npx tsx "${tmpFile}"`, {
    stdio: "inherit",
    cwd: __dirname,
  });
} finally {
  require("fs").unlinkSync(tmpFile);
}
