-- CreateTable
CREATE TABLE "orgaos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "cnpj" TEXT,
    "cep" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "exercicios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ano" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "competencias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mes" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "folhas_previdenciarias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orgaoId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "exercicioId" INTEGER NOT NULL,
    "competenciaId" INTEGER NOT NULL,
    "aliquota" DECIMAL NOT NULL,
    "valorRecolher" DECIMAL NOT NULL,
    "valorRecolherCalculado" DECIMAL NOT NULL DEFAULT 0,
    "valorRecolhido" DECIMAL NOT NULL,
    "quantidadeServidores" INTEGER,
    "folhaBase" DECIMAL,
    "multas" DECIMAL DEFAULT 0,
    "juros" DECIMAL DEFAULT 0,
    "acrescimo" DECIMAL DEFAULT 0,
    "parcelado" BOOLEAN NOT NULL DEFAULT false,
    "deficit" DECIMAL NOT NULL,
    "superavit" DECIMAL NOT NULL DEFAULT 0,
    "inadimplencia" DECIMAL NOT NULL,
    "percentualPago" DECIMAL NOT NULL DEFAULT 0,
    "valorTotalDevido" DECIMAL NOT NULL DEFAULT 0,
    "encargosTotal" DECIMAL NOT NULL DEFAULT 0,
    "valorLiquidoArrecadado" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "responsavelId" INTEGER,
    "dataVencimento" DATETIME,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "folhas_previdenciarias_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgaos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERADOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "instituto_rpps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomeInstituto" TEXT,
    "nomeResponsavel" TEXT,
    "cnpj" TEXT,
    "enderecoCompleto" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "nomeDepartamento" TEXT,
    "responsavelDepartamento" TEXT,
    "logoPath" TEXT,
    "logoData" BLOB,
    "logoMime" TEXT,
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipoConta" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "acordos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "dataAcordo" DATETIME NOT NULL,
    "orgaoId" INTEGER NOT NULL,
    "tipoDebito" TEXT NOT NULL,
    "valorOriginal" DECIMAL NOT NULL,
    "atualizacaoMonetaria" DECIMAL NOT NULL DEFAULT 0,
    "jurosAcordo" DECIMAL NOT NULL DEFAULT 0,
    "multaAcordo" DECIMAL NOT NULL DEFAULT 0,
    "valorConsolidado" DECIMAL NOT NULL,
    "numeroParcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "primeiroVencimento" DATETIME NOT NULL,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "valorPago" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "formaGarantia" TEXT,
    "garantiaDetalhes" TEXT,
    "leiAutorizativa" TEXT,
    "observacoes" TEXT,
    "responsavelId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "acordos_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgaos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "acordos_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AcordoLancamentos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_AcordoLancamentos_A_fkey" FOREIGN KEY ("A") REFERENCES "acordos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AcordoLancamentos_B_fkey" FOREIGN KEY ("B") REFERENCES "folhas_previdenciarias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "folhas_previdenciarias_orgaoId_tipo_exercicioId_competenciaId_key" ON "folhas_previdenciarias"("orgaoId", "tipo", "exercicioId", "competenciaId");

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
CREATE UNIQUE INDEX "_AcordoLancamentos_AB_unique" ON "_AcordoLancamentos"("A", "B");

-- CreateIndex
CREATE INDEX "_AcordoLancamentos_B_index" ON "_AcordoLancamentos"("B");
