import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

p.orgao.create({ 
  data: { nome: "Prefeitura Municipal", sigla: "PM", cnpj: "12.345.678/0001-00" }
}).then(() => console.log("✓ PM")).catch(() => {});

p.orgao.create({
  data: { nome: "Câmara Municipal", sigla: "CM", cnpj: "12.345.679/0001-00" }
}).then(() => console.log("✓ CM")).catch(() => {});

p.orgao.create({
  data: { nome: "Secretaria de Educação", sigla: "SEDU", cnpj: "12.345.680/0001-00" }
}).then(() => console.log("✓ SEDU")).catch(() => {});

setTimeout(async () => {
  const orgs = await p.orgao.findMany({ take: 5 });
  const exs = await p.exercicio.findMany({ orderBy: { ano: 'desc' }, take: 2 });
  const cms = await p.competencia.findMany();
  const usr = await p.usuario.findMany({ take: 1 });

  if (!orgs.length || !exs.length || !cms.length || !usr.length) {
    console.log("❌ Missing data");
    process.exit(1);
  }

  let ct = 0;
  for (const org of orgs) {
    for (const ex of exs) {
      for (const tp of ["PATRONAL", "SEGURADO"]) {
        for (const cm of cms.slice(0, 4)) {
          const fb = Math.random() * 500000 + 100000;
          const al = tp === "PATRONAL" ? 11 : 8.5;
          const vr = Number((fb * al / 100).toFixed(2));
          const vrec = Number((vr * Math.random() * 0.8).toFixed(2));
          const def = Number((Math.max(0, vr - vrec)).toFixed(2));
          const ina = vr > 0 ? Number(((def / vr) * 100).toFixed(2)) : 0;

          p.folhaPrevidenciaria.create({
            data: {
              orgaoId: org.id,
              tipo: tp as "PATRONAL" | "SEGURADO",
              exercicioId: ex.id,
              competenciaId: cm.id,
              aliquota: al,
              folhaBase: fb,
              valorRecolher: vr,
              valorRecolhido: vrec,
              deficit: def,
              inadimplencia: ina,
              status: vrec === 0 ? "INADIMPLENTE" : vrec >= vr ? "PAGO" : "PARCIAL",
              responsavelId: usr[0].id,
            }
          }).then(() => { ct++; }).catch(() => {});
        }
      }
    }
  }

  setTimeout(() => {
    console.log(`\n✅ ${ct} lançamentos criados`);
    process.exit(0);
  }, 2000);
}, 1000);
