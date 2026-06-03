import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🌱 Populando Lançamentos de Teste...\n");

  const orgaos = await prisma.orgao.findMany({ take: 5 });
  const exercicios = await prisma.exercicio.findMany({ orderBy: { ano: 'desc' }, take: 3 });
  const competencias = await prisma.competencia.findMany({ orderBy: { ordem: 'asc' } });
  const usuarios = await prisma.usuario.findMany({ take: 1 });

  if (!orgaos.length || !exercicios.length || !competencias.length || !usuarios.length) {
    console.log("❌ Dados base não encontrados.");
    return;
  }

  const usuario = usuarios[0];
  let created = 0;

  for (const orgao of orgaos) {
    for (const exercicio of exercicios.slice(0, 2)) {
      for (const tipo of ["PATRONAL", "SEGURADO"]) {
        for (const competencia of competencias.slice(0, 3)) {
          const folhaBase = Math.random() * 500000 + 100000;
          const aliquota = tipo === "PATRONAL" ? 11 : 8.5;
          const valorRecolher = Number((folhaBase * aliquota / 100).toFixed(2));
          const pagtoPercentual = Math.random();
          const valorRecolhido = pagtoPercentual > 0.2 
            ? Number((valorRecolher * (Math.random() * 0.8 + 0.2)).toFixed(2))
            : 0;
          const multas = valorRecolhido > 0 && Math.random() > 0.7 ? Number((valorRecolher * 0.1).toFixed(2)) : 0;
          const juros = valorRecolhido > 0 && Math.random() > 0.8 ? Number((valorRecolher * 0.05).toFixed(2)) : 0;

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
                parcelado: Math.random() > 0.8,
                dataVencimento: new Date(exercicio.ano, competencia.ordem, 15),
                observacoes: null,
                responsavelId: usuario.id,
                deficit: Math.max(0, Number((valorRecolher - valorRecolhido).toFixed(2))),
                inadimplencia: valorRecolher > 0 
                  ? Number((((valorRecolher - valorRecolhido) / valorRecolher) * 100).toFixed(2))
                  : 0,
                status: valorRecolhido === 0 ? "INADIMPLENTE" : valorRecolhido >= valorRecolher ? "PAGO" : "PARCIAL",
              },
            });
            created++;
          } catch (e: any) {
            if (!e.message.includes("Unique constraint")) {
              console.log(`⚠ Erro: ${e.message.split('\n')[0]}`);
            }
          }
        }
      }
    }
  }

  console.log(`✅ ${created} lançamentos criados!\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
