import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏢 ÓRGÃOS CADASTRADOS NO BANCO\n");
  
  const orgaos = await prisma.orgao.findMany({
    orderBy: { sigla: "asc" },
    include: { _count: { select: { lancamentos: true } } }
  });

  if (orgaos.length === 0) {
    console.log("❌ Nenhum órgão cadastrado");
    return;
  }

  console.log(`✅ Total: ${orgaos.length} órgãos\n`);
  console.log("┌──────┬────────────────────────────────────┬─────────┬────────────┐");
  console.log("│ Sigla│ Nome                               │ Status  │ Lançamentos│");
  console.log("├──────┼────────────────────────────────────┼─────────┼────────────┤");

  orgaos.forEach((org) => {
    const sigla = org.sigla.padEnd(5, " ");
    const nome = org.nome.substring(0, 34).padEnd(34, " ");
    const status = org.status.padEnd(7, " ");
    const count = org._count.lancamentos.toString().padStart(10, " ");
    console.log(`│ ${sigla}│ ${nome}│ ${status}│${count}│`);
  });

  console.log("└──────┴────────────────────────────────────┴─────────┴────────────┘");
  
  console.log("\n📋 DETALHES:\n");
  orgaos.forEach((org) => {
    console.log(`${org.sigla}:`);
    console.log(`  ├─ Nome: ${org.nome}`);
    console.log(`  ├─ CNPJ: ${org.cnpj || "(não preenchido)"}`);
    console.log(`  ├─ CEP: ${org.cep || "(não preenchido)"}`);
    console.log(`  ├─ Endereço: ${org.endereco || "(não preenchido)"}`);
    console.log(`  ├─ Número: ${org.numero || "(não preenchido)"}`);
    console.log(`  ├─ Complemento: ${org.complemento || "(não preenchido)"}`);
    console.log(`  ├─ Bairro: ${org.bairro || "(não preenchido)"}`);
    console.log(`  ├─ Cidade: ${org.cidade || "(não preenchido)"}`);
    console.log(`  ├─ Estado: ${org.estado || "(não preenchido)"}`);
    console.log(`  ├─ Cor: ${org.cor || "(não preenchido)"}`);
    console.log(`  ├─ Status: ${org.status}`);
    console.log(`  └─ Lançamentos: ${org._count.lancamentos}`);
    console.log();
  });
}

main().finally(() => prisma.$disconnect());
