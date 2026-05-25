-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrgaoStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "ExercicioStatus" AS ENUM ('ABERTO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "TipoContribuicao" AS ENUM ('PATRONAL', 'SEGURADO');

-- CreateEnum
CREATE TYPE "LancamentoStatus" AS ENUM ('PAGO', 'PARCIAL', 'INADIMPLENTE', 'PARCELADO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GESTOR', 'OPERADOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "TipoDebitoAcordo" AS ENUM ('PATRONAL', 'SEGURADO', 'AMBOS');

-- CreateEnum
CREATE TYPE "FormaGarantia" AS ENUM ('FPM', 'CAUC', 'RECEITAS_PROPRIAS', 'OUTRA');

-- CreateEnum
CREATE TYPE "StatusAcordo" AS ENUM ('VIGENTE', 'QUITADO', 'RESCINDIDO', 'SUSPENSO');

-- CreateTable
CREATE TABLE "orgaos" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "cor" TEXT,
    "status" "OrgaoStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orgaos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercicios" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "status" "ExercicioStatus" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias" (
    "id" SERIAL NOT NULL,
    "mes" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "competencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folhas_previdenciarias" (
    "id" SERIAL NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "tipo" "TipoContribuicao" NOT NULL,
    "exercicioId" INTEGER NOT NULL,
    "competenciaId" INTEGER NOT NULL,
    "aliquota" DECIMAL(65,30) NOT NULL,
    "valorRecolher" DECIMAL(65,30) NOT NULL,
    "valorRecolhido" DECIMAL(65,30) NOT NULL,
    "quantidadeServidores" INTEGER,
    "folhaBase" DECIMAL(65,30),
    "multas" DECIMAL(65,30),
    "juros" DECIMAL(65,30),
    "parcelado" BOOLEAN NOT NULL DEFAULT false,
    "deficit" DECIMAL(65,30) NOT NULL,
    "inadimplencia" DECIMAL(65,30) NOT NULL,
    "status" "LancamentoStatus" NOT NULL,
    "responsavelId" INTEGER,
    "dataVencimento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folhas_previdenciarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituto_rpps" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomeInstituto" TEXT,
    "nomeResponsavel" TEXT,
    "cnpj" TEXT,
    "enderecoCompleto" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "nomeDepartamento" TEXT,
    "responsavelDepartamento" TEXT,
    "logoPath" TEXT,
    "logoData" BYTEA,
    "logoMime" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instituto_rpps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acordos" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "dataAcordo" TIMESTAMP(3) NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "tipoDebito" "TipoDebitoAcordo" NOT NULL,
    "valorOriginal" DECIMAL(65,30) NOT NULL,
    "atualizacaoMonetaria" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "jurosAcordo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "multaAcordo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "valorConsolidado" DECIMAL(65,30) NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(65,30) NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "primeiroVencimento" TIMESTAMP(3) NOT NULL,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "valorPago" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "StatusAcordo" NOT NULL DEFAULT 'VIGENTE',
    "formaGarantia" "FormaGarantia",
    "garantiaDetalhes" TEXT,
    "leiAutorizativa" TEXT,
    "observacoes" TEXT,
    "responsavelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acordos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AcordoLancamentos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AcordoLancamentos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "orgaos_sigla_key" ON "orgaos"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "exercicios_ano_key" ON "exercicios"("ano");

-- CreateIndex
CREATE UNIQUE INDEX "competencias_ordem_key" ON "competencias"("ordem");

-- CreateIndex
CREATE INDEX "folhas_previdenciarias_exercicioId_competenciaId_idx" ON "folhas_previdenciarias"("exercicioId", "competenciaId");

-- CreateIndex
CREATE INDEX "folhas_previdenciarias_status_idx" ON "folhas_previdenciarias"("status");

-- CreateIndex
CREATE UNIQUE INDEX "folhas_previdenciarias_orgaoId_tipo_exercicioId_competencia_key" ON "folhas_previdenciarias"("orgaoId", "tipo", "exercicioId", "competenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "acordos_status_idx" ON "acordos"("status");

-- CreateIndex
CREATE INDEX "acordos_orgaoId_status_idx" ON "acordos"("orgaoId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "acordos_orgaoId_numero_key" ON "acordos"("orgaoId", "numero");

-- CreateIndex
CREATE INDEX "_AcordoLancamentos_B_index" ON "_AcordoLancamentos"("B");

-- AddForeignKey
ALTER TABLE "folhas_previdenciarias" ADD CONSTRAINT "folhas_previdenciarias_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgaos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folhas_previdenciarias" ADD CONSTRAINT "folhas_previdenciarias_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folhas_previdenciarias" ADD CONSTRAINT "folhas_previdenciarias_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folhas_previdenciarias" ADD CONSTRAINT "folhas_previdenciarias_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acordos" ADD CONSTRAINT "acordos_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgaos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acordos" ADD CONSTRAINT "acordos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AcordoLancamentos" ADD CONSTRAINT "_AcordoLancamentos_A_fkey" FOREIGN KEY ("A") REFERENCES "acordos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AcordoLancamentos" ADD CONSTRAINT "_AcordoLancamentos_B_fkey" FOREIGN KEY ("B") REFERENCES "folhas_previdenciarias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

