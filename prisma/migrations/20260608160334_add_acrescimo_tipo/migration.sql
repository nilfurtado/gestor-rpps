-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_folhas_previdenciarias" (
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
    "acrescimo_tipo" TEXT NOT NULL DEFAULT 'QUITADO',
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
INSERT INTO "new_folhas_previdenciarias" ("acrescimo", "aliquota", "competenciaId", "createdAt", "dataVencimento", "deficit", "encargosTotal", "exercicioId", "folhaBase", "id", "inadimplencia", "juros", "multas", "observacoes", "orgaoId", "parcelado", "percentualPago", "quantidadeServidores", "responsavelId", "status", "superavit", "tipo", "updatedAt", "valorLiquidoArrecadado", "valorRecolher", "valorRecolherCalculado", "valorRecolhido", "valorTotalDevido") SELECT "acrescimo", "aliquota", "competenciaId", "createdAt", "dataVencimento", "deficit", "encargosTotal", "exercicioId", "folhaBase", "id", "inadimplencia", "juros", "multas", "observacoes", "orgaoId", "parcelado", "percentualPago", "quantidadeServidores", "responsavelId", "status", "superavit", "tipo", "updatedAt", "valorLiquidoArrecadado", "valorRecolher", "valorRecolherCalculado", "valorRecolhido", "valorTotalDevido" FROM "folhas_previdenciarias";
DROP TABLE "folhas_previdenciarias";
ALTER TABLE "new_folhas_previdenciarias" RENAME TO "folhas_previdenciarias";
CREATE INDEX "folhas_previdenciarias_exercicioId_competenciaId_idx" ON "folhas_previdenciarias"("exercicioId", "competenciaId");
CREATE INDEX "folhas_previdenciarias_status_idx" ON "folhas_previdenciarias"("status");
CREATE UNIQUE INDEX "folhas_previdenciarias_orgaoId_tipo_exercicioId_competenciaId_key" ON "folhas_previdenciarias"("orgaoId", "tipo", "exercicioId", "competenciaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
