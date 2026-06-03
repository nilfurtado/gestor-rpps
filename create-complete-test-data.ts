import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n📊 Criando dados de teste completos...\n");

  // 1. Criar órgãos
  console.log("1️⃣ Criando órgãos...");
  const orgaosData = [
    { nome: "Prefeitura Municipal", sigla: "PM", cnpj: "12.345.678/0001-00" },
    { nome: "Câmara Municipal", sigla: "CM", cnpj: "12.345.679/0001-00" },
    { nome: "Secretaria de Educação", sigla: "SEDU", cnpj: "12.345.680/0001-00" },
    { nome: "Secretaria de Saúde", sigla: "SSAU", cnpj: "12.345.681/0001-00" },
    { nome: "Guarda Municipal", sigla: "GM", cnpj: "12.345.682/0001-00" },
  ];

  let orgCount = 0;
  for (const orgData of orgaosData) {
    try {
      await prisma.orgao.create({ data: orgData });
      orgCount++;
    } catch (e) {}
  }
  console.log(`✓ ${orgCount} órgãos criados`);

  // 2. Buscar dados
  const allOrgaos = await prisma.orgao.findMany();
  const exercicios = await prisma.exercicio.findMany({ orderBy: { ano: 'desc' }, take: 2 });
  const competencias = await prisma.competencia.findMany();
  const usuario = await prisma.usuario.findFirst();

  if (!allOrgaos.length || !exercicios.length || !competencias.length || !usuario) {
    console.log("❌ Dados base incompletos");
    return;
  }

  // 3. Criar lançamentos
  console.log("\n2️⃣ Criando lançamentos...");
  let created = 0;

  for (const orgao of allOrgaos.slice(0, 5)) {
    for (const exercicio of exercicios) {
      for (const tipo of ["PATRONAL", "SEGURADO"]) {
        for (const competencia of competencias.slice(0, 6)) {
          const folhaBase = Math.random() * 500000 + 100000;
          const aliquota = tipo === "PATRONAL" ? 11 : 8.5;
          const valorRecolher = Number((folhaBase * aliquota / 100).toFixed(2));
          const rand = Math.random();
          const valorRecolhido = rand > 0.15 ? Number((valorRecolher * (rand * 0.85)).toFixed(2)) : 0;
          const multas = valorRecolhido > 0 && Math.random() > 0.75 ? Number((valorRecolher * 0.05).toFixed(2)) : 0;
          const juros = valorRecolhido > 0 && Math.random() > 0.85 ? Number((valorRecolher * 0.03).toFixed(2)) : 0;

          try {
            await prisma.folhaPrevidenciaria.create({
              data: {
                orgaoId: orgao.id,
                tipo: tipo as "PATRONAL" | "SEGURADO",
                exercicioId: exercicio.id,
                competenciaId: competencia.id,
                aliquota,
                folhaBase,
                valorRecolher,
                valorRecolhido,
                multas: multas || undefined,
                juros: juros || undefined,
                parcelado: Math.random() > 0.85,
                dataVencimento: new Date(exercicio.ano, competencia.ordem, 15),
                responsavelId: usuario.id,
                deficit: Math.max(0, Number((valorRecolher - valorRecolhido).toFixed(2))),
                inadimplencia: valorRecolher > 0 
                  ? Number((((valorRecolher - valorRecolhido) / valorRecolher) * 100).toFixed(2))
                  : 0,
                status: valorRecolhido === 0 ? "INADIMPLENTE" : valorRecolhido >= valorRecolher ? "PAGO" : "PARCIAL",
              },
            });
            created++;
          } catch (e) {}
        }
      }
    }
  }

  console.log(`✓ ${created} lançamentos criados`);

  const total = await prisma.folhaPrevidenciaria.count();
  const stats = await prisma.folhaPrevidenciaria.aggregate({
    _sum: { valorRecolher: true, valorRecolhido: true, deficit: true },
  });

  console.log(`\n📊 Estatísticas:`);
  console.log(`  Total: ${total} lançamentos`);
  console.log(`  Recolher: R$ ${(stats._sum.valorRecolher || 0).toLocaleString('pt-BR')}`);
  console.log(`  Recolhido: R$ ${(stats._sum.valorRecolhido || 0).toLocaleString('pt-BR')}`);
  console.log(`  Déficit: R$ ${(stats._sum.deficit || 0).toLocaleString('pt-BR')}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
