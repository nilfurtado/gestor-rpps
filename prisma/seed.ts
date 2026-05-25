import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ORGAOS = [
  { sigla: "SEMAD", nome: "Secretaria Municipal de Administração" },
  { sigla: "CMS", nome: "Câmara Municipal de Santana" },
  { sigla: "SEME", nome: "Secretaria Municipal de Educação" },
  { sigla: "STTRANS", nome: "Superintendência de Trânsito e Transporte" },
  { sigla: "SEMSA", nome: "Secretaria Municipal de Saúde" },
];

const COMPETENCIAS = [
  { ordem: 1, mes: "Janeiro" },
  { ordem: 2, mes: "Fevereiro" },
  { ordem: 3, mes: "Março" },
  { ordem: 4, mes: "Abril" },
  { ordem: 5, mes: "Maio" },
  { ordem: 6, mes: "Junho" },
  { ordem: 7, mes: "Julho" },
  { ordem: 8, mes: "Agosto" },
  { ordem: 9, mes: "Setembro" },
  { ordem: 10, mes: "Outubro" },
  { ordem: 11, mes: "Novembro" },
  { ordem: 12, mes: "Dezembro" },
  { ordem: 13, mes: "13º Salário" },
];

async function ensureExercicios() {
  const anoAtual = new Date().getFullYear();

  for (let ano = 2010; ano <= anoAtual; ano++) {
    const status = ano < anoAtual ? "ENCERRADO" : "ABERTO";
    await prisma.exercicio.upsert({
      where: { ano },
      update: {},
      create: { ano, status },
    });
  }

  // Encerrar exercícios futuros criados indevidamente
  await prisma.exercicio.updateMany({
    where: { ano: { gt: anoAtual } },
    data: { status: "ENCERRADO" },
  });

  console.log(`> Exercícios cadastrados: 2010 a ${anoAtual}`);
  console.log(`  (${anoAtual} = ABERTO, demais = ENCERRADO)`);
}

async function main() {
  console.log("> Seeding órgãos...");
  for (const o of ORGAOS) {
    await prisma.orgao.upsert({
      where: { sigla: o.sigla },
      update: { nome: o.nome },
      create: { ...o, status: "ATIVO" },
    });
  }

  console.log("> Seeding competências...");
  for (const c of COMPETENCIAS) {
    await prisma.competencia.upsert({
      where: { ordem: c.ordem },
      update: { mes: c.mes },
      create: c,
    });
  }

  console.log("> Seeding exercícios (2010 a próximo ano)...");
  await ensureExercicios();

  const gestorEmail = process.env.SEED_ADMIN_EMAIL ?? "gestor";
  const gestorPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(gestorPassword, 10);

  console.log(`> Seeding usuário gestor (${gestorEmail})...`);
  await prisma.user.upsert({
    where: { email: gestorEmail },
    update: { passwordHash, nome: "Gestor Santana Previdência", role: "GESTOR" },
    create: {
      email: gestorEmail,
      nome: "Gestor Santana Previdência",
      passwordHash,
      role: "GESTOR",
    },
  });

  console.log("Seed concluído. Credenciais:");
  console.log(`   usuário: ${gestorEmail}`);
  console.log(`   senha:   ${gestorPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
