/**
 * Marca a migração 0_init como já aplicada no Neon Postgres
 * (a tabela já foi criada via prisma db push antes da introdução do Prisma Migrate).
 *
 * Uso (PowerShell):
 *   $env:DATABASE_URL="..."; npx tsx scripts/baseline-migration.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(process.cwd(), "prisma", "migrations", "0_init", "migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const checksum = crypto.createHash("sha256").update(sql).digest("hex");
  const id = crypto.randomUUID();
  const now = new Date();

  // Cria tabela _prisma_migrations se não existir
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" varchar(36) NOT NULL,
      "checksum" varchar(64) NOT NULL,
      "finished_at" timestamptz,
      "migration_name" varchar(255) NOT NULL,
      "logs" text,
      "rolled_back_at" timestamptz,
      "started_at" timestamptz NOT NULL DEFAULT now(),
      "applied_steps_count" integer NOT NULL DEFAULT 0,
      PRIMARY KEY ("id")
    );
  `);

  // Verifica se já tem registro pra 0_init
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "_prisma_migrations" WHERE migration_name = '0_init' LIMIT 1`
  );
  if (existing.length > 0) {
    console.log("✓ Migração 0_init já está registrada como aplicada.");
    return;
  }

  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count) VALUES ($1, $2, $3, $4, $5, $6)`,
    id,
    checksum,
    "0_init",
    now,
    now,
    1
  );

  console.log(`✓ Migração 0_init marcada como aplicada.`);
  console.log(`  id:       ${id}`);
  console.log(`  checksum: ${checksum.slice(0, 16)}...`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
