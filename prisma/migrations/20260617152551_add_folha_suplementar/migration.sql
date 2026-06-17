-- CreateTable
CREATE TABLE "folhas_suplementares" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "folhaPrevidenciariaId" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "folhaBase" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SEM_MOVIMENTO',
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "folhas_suplementares_folhaPrevidenciariaId_fkey" FOREIGN KEY ("folhaPrevidenciariaId") REFERENCES "folhas_previdenciarias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "folhas_suplementares_folhaPrevidenciariaId_idx" ON "folhas_suplementares"("folhaPrevidenciariaId");

-- CreateIndex
CREATE INDEX "folhas_suplementares_status_idx" ON "folhas_suplementares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "folhas_suplementares_folhaPrevidenciariaId_motivo_key" ON "folhas_suplementares"("folhaPrevidenciariaId", "motivo");
