const { generateBarcodeNumber } = require("../dist/lib/barcode-generator.js");

console.log("\n🧪 TESTANDO DÉBITO AUTOMÁTICO\n");

const testData = {
  rppsInfo: {
    cnpj: "00743471000190",
    banco: "001",
    agencia: "3346-4",
    conta: "18.910-3",
  },
  orgaoId: 5,
  dataVencimento: new Date("2026-06-25"),
  totalPagamento: 2121.31,
  exercicioAno: 2026,
  competenciaMes: "junho",
  competenciaOrdem: 6,
};

try {
  console.log("📊 Dados de entrada:");
  console.log("  Agência:", testData.rppsInfo.agencia);
  console.log("  Conta:", testData.rppsInfo.conta);
  console.log("  Competência ordem:", testData.competenciaOrdem);
  console.log("");

  const barcode = generateBarcodeNumber(testData);

  console.log("📊 Código gerado:");
  console.log("  Barcode:", barcode);
  console.log("  Tamanho:", barcode.length, "dígitos");
  console.log("");

  // Quebrar para análise
  console.log("📊 Estrutura:");
  console.log("  Banco (3):", barcode.slice(0, 3));
  console.log("  DV (1):", barcode.slice(3, 4));
  console.log("  Forma (4):", barcode.slice(4, 8));
  console.log("  CNPJ (10):", barcode.slice(8, 18));
  console.log("  Data (8):", barcode.slice(18, 26));
  console.log("  Valor (10):", barcode.slice(26, 36));
  console.log("  NSR (11):", barcode.slice(36, 47), "← DEVERIA TER 3346189100X");
  console.log("  Origem (2):", barcode.slice(47, 49));
  console.log("");
} catch (error) {
  console.error("❌ Erro:", error.message);
}
