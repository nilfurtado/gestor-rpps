/**
 * Migra dados do SQLite local (prisma/dev.db) para o Neon Postgres.
 *
 * Uso (PowerShell):
 *   $env:DATABASE_URL="postgres://..."; npx tsx scripts/migrate-sqlite-to-neon.ts
 *
 * Estratégia:
 * - UPSERT por chave única natural (sigla, ano, ordem, email, etc.)
 * - Constrói mapa oldId → newId para FKs (lançamentos, acordos)
 * - Logo: lê de public/rpps-logo.jpg se existir e grava como Bytes na coluna logoData
 */
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const SQLITE_PATH = path.join(process.cwd(), "prisma", "dev.db");
const LOGO_PATH = path.join(process.cwd(), "public", "rpps-logo.jpg");

interface SqlOrgao {
  id: number;
  nome: string;
  sigla: string;
  cor: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
interface SqlExercicio {
  id: number;
  ano: number;
  status: string;
  createdAt: string;
}
interface SqlCompetencia {
  id: number;
  mes: string;
  ordem: number;
}
interface SqlUser {
  id: number;
  email: string;
  nome: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}
interface SqlFolha {
  id: number;
  orgaoId: number;
  tipo: string;
  exercicioId: number;
  competenciaId: number;
  aliquota: number;
  valorRecolher: number;
  valorRecolhido: number;
  quantidadeServidores: number | null;
  folhaBase: number | null;
  multas: number | null;
  juros: number | null;
  parcelado: number;
  deficit: number;
  inadimplencia: number;
  status: string;
  responsavelId: number | null;
  dataVencimento: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
}
interface SqlAcordo {
  id: number;
  numero: string;
  dataAcordo: string;
  orgaoId: number;
  tipoDebito: string;
  valorOriginal: number;
  atualizacaoMonetaria: number;
  jurosAcordo: number;
  multaAcordo: number;
  valorConsolidado: number;
  numeroParcelas: number;
  valorParcela: number;
  diaVencimento: number;
  primeiroVencimento: string;
  parcelasPagas: number;
  valorPago: number;
  status: string;
  formaGarantia: string | null;
  garantiaDetalhes: string | null;
  leiAutorizativa: string | null;
  observacoes: string | null;
  responsavelId: number;
  createdAt: string;
  updatedAt: string;
}
interface SqlAcordoLanc {
  A: number; // Acordo id
  B: number; // Folha id
}
interface SqlRpps {
  id: number;
  nomeInstituto: string | null;
  nomeResponsavel: string | null;
  cnpj: string | null;
  enderecoCompleto: string | null;
  telefone: string | null;
  email: string | null;
  nomeDepartamento: string | null;
  responsavelDepartamento: string | null;
  logoPath: string | null;
  updatedAt: string;
}

const prisma = new PrismaClient();

async function main() {
  if (!fs.existsSync(SQLITE_PATH)) {
    throw new Error(`SQLite não encontrado em ${SQLITE_PATH}`);
  }
  if (!process.env.DATABASE_URL?.includes("neon.tech")) {
    throw new Error(
      "DATABASE_URL precisa apontar para o Neon. Defina $env:DATABASE_URL antes de rodar."
    );
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log(`> SQLite aberto: ${SQLITE_PATH}`);

  // ─────────────────────────────────────────────────────────────
  // 1. Órgãos
  // ─────────────────────────────────────────────────────────────
  const orgaos = sqlite.prepare(`SELECT * FROM orgaos`).all() as SqlOrgao[];
  const orgaoIdMap = new Map<number, number>();
  console.log(`\n> Migrando ${orgaos.length} órgão(s)...`);
  for (const o of orgaos) {
    const result = await prisma.orgao.upsert({
      where: { sigla: o.sigla },
      update: { nome: o.nome, cor: o.cor, status: o.status as "ATIVO" | "INATIVO" },
      create: {
        nome: o.nome,
        sigla: o.sigla,
        cor: o.cor,
        status: o.status as "ATIVO" | "INATIVO",
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      },
    });
    orgaoIdMap.set(o.id, result.id);
    console.log(`  ✓ ${o.sigla} (SQLite id ${o.id} → Neon id ${result.id})`);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Exercícios
  // ─────────────────────────────────────────────────────────────
  const exercicios = sqlite.prepare(`SELECT * FROM exercicios`).all() as SqlExercicio[];
  const exercicioIdMap = new Map<number, number>();
  console.log(`\n> Migrando ${exercicios.length} exercício(s)...`);
  for (const e of exercicios) {
    const result = await prisma.exercicio.upsert({
      where: { ano: e.ano },
      update: { status: e.status as "ABERTO" | "ENCERRADO" },
      create: {
        ano: e.ano,
        status: e.status as "ABERTO" | "ENCERRADO",
        createdAt: new Date(e.createdAt),
      },
    });
    exercicioIdMap.set(e.id, result.id);
  }
  console.log(`  ✓ ${exercicios.length} exercícios sincronizados`);

  // ─────────────────────────────────────────────────────────────
  // 3. Competências
  // ─────────────────────────────────────────────────────────────
  const competencias = sqlite.prepare(`SELECT * FROM competencias`).all() as SqlCompetencia[];
  const competenciaIdMap = new Map<number, number>();
  console.log(`\n> Migrando ${competencias.length} competência(s)...`);
  for (const c of competencias) {
    const result = await prisma.competencia.upsert({
      where: { ordem: c.ordem },
      update: { mes: c.mes },
      create: { mes: c.mes, ordem: c.ordem },
    });
    competenciaIdMap.set(c.id, result.id);
  }
  console.log(`  ✓ ${competencias.length} competências sincronizadas`);

  // ─────────────────────────────────────────────────────────────
  // 4. Usuários
  // ─────────────────────────────────────────────────────────────
  const users = sqlite.prepare(`SELECT * FROM users`).all() as SqlUser[];
  const userIdMap = new Map<number, number>();
  console.log(`\n> Migrando ${users.length} usuário(s)...`);
  for (const u of users) {
    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        nome: u.nome,
        role: u.role as "GESTOR" | "OPERADOR" | "AUDITOR",
        passwordHash: u.passwordHash,
      },
      create: {
        email: u.email,
        nome: u.nome,
        passwordHash: u.passwordHash,
        role: u.role as "GESTOR" | "OPERADOR" | "AUDITOR",
        createdAt: new Date(u.createdAt),
      },
    });
    userIdMap.set(u.id, result.id);
    console.log(`  ✓ ${u.email} → ${u.role}`);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. InstitutoRpps + logo
  // ─────────────────────────────────────────────────────────────
  const rppsRows = sqlite.prepare(`SELECT * FROM instituto_rpps`).all() as SqlRpps[];
  if (rppsRows.length > 0) {
    const r = rppsRows[0];
    let logoData: Buffer | null = null;
    let logoMime: string | null = null;
    if (fs.existsSync(LOGO_PATH)) {
      logoData = fs.readFileSync(LOGO_PATH);
      logoMime = LOGO_PATH.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    }
    console.log(`\n> Migrando dados institucionais do RPPS...`);
    await prisma.institutoRpps.upsert({
      where: { id: 1 },
      update: {
        nomeInstituto: r.nomeInstituto,
        nomeResponsavel: r.nomeResponsavel,
        cnpj: r.cnpj,
        enderecoCompleto: r.enderecoCompleto,
        telefone: r.telefone,
        email: r.email,
        nomeDepartamento: r.nomeDepartamento,
        responsavelDepartamento: r.responsavelDepartamento,
        logoPath: logoData ? "/api/rpps/logo" : r.logoPath,
        logoData,
        logoMime,
      },
      create: {
        id: 1,
        nomeInstituto: r.nomeInstituto,
        nomeResponsavel: r.nomeResponsavel,
        cnpj: r.cnpj,
        enderecoCompleto: r.enderecoCompleto,
        telefone: r.telefone,
        email: r.email,
        nomeDepartamento: r.nomeDepartamento,
        responsavelDepartamento: r.responsavelDepartamento,
        logoPath: logoData ? "/api/rpps/logo" : r.logoPath,
        logoData,
        logoMime,
      },
    });
    console.log(
      `  ✓ Instituto: ${r.nomeInstituto ?? "(sem nome)"} | Logo: ${
        logoData ? `${(logoData.length / 1024).toFixed(1)} KB` : "(nenhuma)"
      }`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Folhas previdenciárias
  // ─────────────────────────────────────────────────────────────
  const folhas = sqlite
    .prepare(`SELECT * FROM folhas_previdenciarias`)
    .all() as SqlFolha[];
  const folhaIdMap = new Map<number, number>();
  console.log(`\n> Migrando ${folhas.length} lançamento(s)...`);
  let folhaOk = 0;
  let folhaSkip = 0;
  for (const f of folhas) {
    const newOrgao = orgaoIdMap.get(f.orgaoId);
    const newExer = exercicioIdMap.get(f.exercicioId);
    const newComp = competenciaIdMap.get(f.competenciaId);
    if (!newOrgao || !newExer || !newComp) {
      console.log(
        `  ⚠ Pulando folha ${f.id} (FK perdida: orgao=${f.orgaoId}, exer=${f.exercicioId}, comp=${f.competenciaId})`
      );
      folhaSkip++;
      continue;
    }
    const result = await prisma.folhaPrevidenciaria.upsert({
      where: {
        orgaoId_tipo_exercicioId_competenciaId: {
          orgaoId: newOrgao,
          tipo: f.tipo as "PATRONAL" | "SEGURADO",
          exercicioId: newExer,
          competenciaId: newComp,
        },
      },
      update: {
        aliquota: f.aliquota,
        valorRecolher: f.valorRecolher,
        valorRecolhido: f.valorRecolhido,
        quantidadeServidores: f.quantidadeServidores,
        folhaBase: f.folhaBase,
        multas: f.multas,
        juros: f.juros,
        parcelado: f.parcelado === 1,
        deficit: f.deficit,
        inadimplencia: f.inadimplencia,
        status: f.status as "PAGO" | "PARCIAL" | "INADIMPLENTE" | "PARCELADO",
        responsavelId: f.responsavelId ? userIdMap.get(f.responsavelId) ?? null : null,
        dataVencimento: f.dataVencimento ? new Date(f.dataVencimento) : null,
        observacoes: f.observacoes,
      },
      create: {
        orgaoId: newOrgao,
        tipo: f.tipo as "PATRONAL" | "SEGURADO",
        exercicioId: newExer,
        competenciaId: newComp,
        aliquota: f.aliquota,
        valorRecolher: f.valorRecolher,
        valorRecolhido: f.valorRecolhido,
        quantidadeServidores: f.quantidadeServidores,
        folhaBase: f.folhaBase,
        multas: f.multas,
        juros: f.juros,
        parcelado: f.parcelado === 1,
        deficit: f.deficit,
        inadimplencia: f.inadimplencia,
        status: f.status as "PAGO" | "PARCIAL" | "INADIMPLENTE" | "PARCELADO",
        responsavelId: f.responsavelId ? userIdMap.get(f.responsavelId) ?? null : null,
        dataVencimento: f.dataVencimento ? new Date(f.dataVencimento) : null,
        observacoes: f.observacoes,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt),
      },
    });
    folhaIdMap.set(f.id, result.id);
    folhaOk++;
  }
  console.log(`  ✓ ${folhaOk} migrado(s), ${folhaSkip} pulado(s)`);

  // ─────────────────────────────────────────────────────────────
  // 7. Acordos
  // ─────────────────────────────────────────────────────────────
  // Verifica se tabela existe (pode não existir se DB local for antigo)
  const acordosTableExists = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='acordos'`
    )
    .get();
  const acordoIdMap = new Map<number, number>();
  if (acordosTableExists) {
    const acordos = sqlite.prepare(`SELECT * FROM acordos`).all() as SqlAcordo[];
    console.log(`\n> Migrando ${acordos.length} acordo(s)...`);
    let acordoOk = 0;
    for (const a of acordos) {
      const newOrgao = orgaoIdMap.get(a.orgaoId);
      const newResp = userIdMap.get(a.responsavelId);
      if (!newOrgao || !newResp) {
        console.log(`  ⚠ Pulando acordo ${a.numero} (FK perdida)`);
        continue;
      }
      const result = await prisma.acordo.upsert({
        where: {
          orgaoId_numero: { orgaoId: newOrgao, numero: a.numero },
        },
        update: {
          dataAcordo: new Date(a.dataAcordo),
          tipoDebito: a.tipoDebito as "PATRONAL" | "SEGURADO" | "AMBOS",
          valorOriginal: a.valorOriginal,
          atualizacaoMonetaria: a.atualizacaoMonetaria,
          jurosAcordo: a.jurosAcordo,
          multaAcordo: a.multaAcordo,
          valorConsolidado: a.valorConsolidado,
          numeroParcelas: a.numeroParcelas,
          valorParcela: a.valorParcela,
          diaVencimento: a.diaVencimento,
          primeiroVencimento: new Date(a.primeiroVencimento),
          parcelasPagas: a.parcelasPagas,
          valorPago: a.valorPago,
          status: a.status as "VIGENTE" | "QUITADO" | "RESCINDIDO" | "SUSPENSO",
          formaGarantia:
            (a.formaGarantia as
              | "FPM"
              | "CAUC"
              | "RECEITAS_PROPRIAS"
              | "OUTRA"
              | null) ?? null,
          garantiaDetalhes: a.garantiaDetalhes,
          leiAutorizativa: a.leiAutorizativa,
          observacoes: a.observacoes,
        },
        create: {
          numero: a.numero,
          dataAcordo: new Date(a.dataAcordo),
          orgaoId: newOrgao,
          tipoDebito: a.tipoDebito as "PATRONAL" | "SEGURADO" | "AMBOS",
          valorOriginal: a.valorOriginal,
          atualizacaoMonetaria: a.atualizacaoMonetaria,
          jurosAcordo: a.jurosAcordo,
          multaAcordo: a.multaAcordo,
          valorConsolidado: a.valorConsolidado,
          numeroParcelas: a.numeroParcelas,
          valorParcela: a.valorParcela,
          diaVencimento: a.diaVencimento,
          primeiroVencimento: new Date(a.primeiroVencimento),
          parcelasPagas: a.parcelasPagas,
          valorPago: a.valorPago,
          status: a.status as "VIGENTE" | "QUITADO" | "RESCINDIDO" | "SUSPENSO",
          formaGarantia:
            (a.formaGarantia as
              | "FPM"
              | "CAUC"
              | "RECEITAS_PROPRIAS"
              | "OUTRA"
              | null) ?? null,
          garantiaDetalhes: a.garantiaDetalhes,
          leiAutorizativa: a.leiAutorizativa,
          observacoes: a.observacoes,
          responsavelId: newResp,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        },
      });
      acordoIdMap.set(a.id, result.id);
      acordoOk++;
      console.log(`  ✓ Acordo ${a.numero}`);
    }
    console.log(`  ✓ ${acordoOk} acordo(s) migrados`);

    // ─────────────────────────────────────────────────────────────
    // 8. Vínculos Acordo <-> Folha
    // ─────────────────────────────────────────────────────────────
    const joinTableExists = sqlite
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='_AcordoLancamentos'`
      )
      .get();
    if (joinTableExists) {
      const links = sqlite
        .prepare(`SELECT A, B FROM _AcordoLancamentos`)
        .all() as SqlAcordoLanc[];
      console.log(`\n> Migrando ${links.length} vínculo(s) acordo-lançamento...`);
      let linkOk = 0;
      for (const l of links) {
        const newAcordo = acordoIdMap.get(l.A);
        const newFolha = folhaIdMap.get(l.B);
        if (!newAcordo || !newFolha) {
          console.log(`  ⚠ Pulando vínculo (${l.A}, ${l.B}) — FK perdida`);
          continue;
        }
        await prisma.acordo.update({
          where: { id: newAcordo },
          data: { lancamentos: { connect: { id: newFolha } } },
        });
        linkOk++;
      }
      console.log(`  ✓ ${linkOk} vínculo(s) restaurados`);
    }
  } else {
    console.log(`\n> Tabela 'acordos' não existe no SQLite (DB anterior à criação do módulo).`);
  }

  sqlite.close();

  // ─────────────────────────────────────────────────────────────
  // Verificação final
  // ─────────────────────────────────────────────────────────────
  const [u, o, e, c, f, a, ar] = await Promise.all([
    prisma.user.count(),
    prisma.orgao.count(),
    prisma.exercicio.count(),
    prisma.competencia.count(),
    prisma.folhaPrevidenciaria.count(),
    prisma.acordo.count(),
    prisma.institutoRpps.count(),
  ]);
  console.log("\n=== Resumo final no Neon ===");
  console.log(`Usuários:     ${u}`);
  console.log(`Órgãos:       ${o}`);
  console.log(`Exercícios:   ${e}`);
  console.log(`Competências: ${c}`);
  console.log(`Lançamentos:  ${f}`);
  console.log(`Acordos:      ${a}`);
  console.log(`Instituto:    ${ar}`);
}

main()
  .catch((e) => {
    console.error("\n❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
