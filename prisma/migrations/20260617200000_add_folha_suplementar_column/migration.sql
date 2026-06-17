-- AlterTable: Add folhaSuplementar column to folhas_previdenciarias
ALTER TABLE "folhas_previdenciarias" ADD COLUMN "folhaSuplementar" DECIMAL DEFAULT 0;
