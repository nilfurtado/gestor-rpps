const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const tiposFolha = [
  {
    nome: "Base",
    descricao: "Folha de pagamento base mensal dos servidores",
    ordem: 1,
    obrigatorio: true,
    customizado: false,
    ativo: true,
  },
  {
    nome: "Suplementar",
    descricao: "Folha suplementar (horas extras, gratificações, adicionais)",
    ordem: 2,
    obrigatorio: false,
    customizado: false,
    ativo: true,
  },
  {
    nome: "Complementar",
    descricao: "Folha complementar para correções ou ajustes de competências anteriores",
    ordem: 3,
    obrigatorio: false,
    customizado: false,
    ativo: true,
  },
  {
    nome: "13º Salário",
    descricao: "Folha do décimo terceiro salário (primeira e segunda parcelas)",
    ordem: 4,
    obrigatorio: false,
    customizado: false,
    ativo: true,
  },
  {
    nome: "Rescisão",
    descricao: "Folha de verbas rescisórias de servidores exonerados ou aposentados",
    ordem: 5,
    obrigatorio: false,
    customizado: false,
    ativo: true,
  },
  {
    nome: "Retroativa",
    descricao: "Folha de pagamentos retroativos referentes a períodos anteriores",
    ordem: 6,
    obrigatorio: false,
    customizado: false,
    ativo: true,
  },
];

async function seedTiposFolha() {
  console.log("Iniciando seed de tipos de folha...\n");

  let criados = 0;
  let existentes = 0;

  for (const tipo of tiposFolha) {
    try {
      const result = await prisma.tipoFolha.upsert({
        where: { nome: tipo.nome },
        update: {
          descricao: tipo.descricao,
          ordem: tipo.ordem,
          obrigatorio: tipo.obrigatorio,
          customizado: tipo.customizado,
          ativo: tipo.ativo,
        },
        create: tipo,
      });

      const isNew = result.createdAt.getTime() === result.updatedAt.getTime();
      if (isNew) {
        console.log(`  [CRIADO] ${tipo.nome} (ordem ${tipo.ordem})`);
        criados++;
      } else {
        console.log(`  [ATUALIZADO] ${tipo.nome} (ordem ${tipo.ordem})`);
        existentes++;
      }
    } catch (error) {
      console.error(`  [ERRO] ${tipo.nome}: ${error.message}`);
    }
  }

  console.log(`\nResultado:`);
  console.log(`  Criados:     ${criados}`);
  console.log(`  Atualizados: ${existentes}`);
  console.log(`  Total:       ${criados + existentes} de ${tiposFolha.length}`);

  const todos = await prisma.tipoFolha.findMany({ orderBy: { ordem: "asc" } });
  console.log(`\nTipos de folha no banco (${todos.length}):`);
  todos.forEach((t) => {
    const flags = [];
    if (t.obrigatorio) flags.push("OBRIGATORIO");
    if (t.customizado) flags.push("CUSTOMIZADO");
    if (!t.ativo) flags.push("INATIVO");
    console.log(`  ${t.ordem}. ${t.nome}${flags.length ? " [" + flags.join(", ") + "]" : ""}`);
  });
}

seedTiposFolha()
  .catch((e) => {
    console.error("Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
