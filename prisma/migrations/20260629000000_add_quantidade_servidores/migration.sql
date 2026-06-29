-- AddColumn: Add quantidadeServidores to folhas_previdenciarias if not exists
PRAGMA foreign_keys=OFF;

-- Check if column exists and add it
CREATE TEMPORARY TABLE folhas_previdenciarias_backup AS SELECT * FROM folhas_previdenciarias;

DROP TABLE folhas_previdenciarias;

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
    "acrescimo_tipo" TEXT NOT NULL DEFAULT 'QUITADO',
    "parcelado" BOOLEAN NOT NULL DEFAULT 0,
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
    "justificativaDiferenca" TEXT,
    "diferenca_aprovada" BOOLEAN NOT NULL DEFAULT 0,
    "dataAprovacao" DATETIME,
    "usuarioAprovadorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "folhaSuplementar" DECIMAL DEFAULT 0,
    "numeroGuia" TEXT,
    "dataEmissao" DATETIME,
    "folhaTotal" DECIMAL DEFAULT 0,
    "totalARecolher" DECIMAL DEFAULT 0,
    "totalRecolhido" DECIMAL DEFAULT 0,
    "deficitTotal" DECIMAL DEFAULT 0,
    CONSTRAINT "folhas_previdenciarias_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_usuarioAprovadorId_fkey" FOREIGN KEY ("usuarioAprovadorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "competencias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_exercicioId_fkey" FOREIGN KEY ("exercicioId") REFERENCES "exercicios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "folhas_previdenciarias_orgaoId_fkey" FOREIGN KEY ("orgaoId") REFERENCES "orgaos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO folhas_previdenciarias
SELECT * FROM folhas_previdenciarias_backup;

DROP TABLE folhas_previdenciarias_backup;

CREATE UNIQUE INDEX "folhas_previdenciarias_numeroGuia_key" ON "folhas_previdenciarias"("numeroGuia");
CREATE UNIQUE INDEX "folhas_previdenciarias_orgaoId_tipo_exercicioId_competenciaId_key" ON "folhas_previdenciarias"("orgaoId", "tipo", "exercicioId", "competenciaId");
CREATE INDEX "folhas_previdenciarias_exercicioId_competenciaId_idx" ON "folhas_previdenciarias"("exercicioId", "competenciaId");
CREATE INDEX "folhas_previdenciarias_status_idx" ON "folhas_previdenciarias"("status");

PRAGMA foreign_keys=ON;
