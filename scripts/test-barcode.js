const { generateBarcodeNumber } = require("../dist/lib/barcode-generator.js");

const testCases = [
  {
    name: "Teste 1: PATRONAL",
    data: {
      rppsInfo: {
        cnpj: "00743471000190",
        banco: "001",
      },
      orgaoId: 5,
      dataVencimento: new Date("2026-06-25"),
      totalPagamento: 2321.23,
      exercicioAno: 2026,
      competenciaMes: "junho",
      competenciaOrdem: 6,
    },
  },
  {
    name: "Teste 2: SEGURADO",
    data: {
      rppsInfo: {
        cnpj: "00743471000190",
        banco: "001",
      },
      orgaoId: 3,
      dataVencimento: new Date("2026-05-31"),
      totalPagamento: 19219.89,
      exercicioAno: 2026,
      competenciaMes: "maio",
      competenciaOrdem: 5,
    },
  },
];

console.log("🧪 TESTANDO GERAÇÃO DE CÓDIGO DE BARRAS FEBRABAN\n");

testCases.forEach((test) => {
  try {
    const barcode = generateBarcodeNumber(test.data);
    const formatted = barcode
      .slice(0, 5) +
      " " +
      barcode.slice(5, 10) +
      " " +
      barcode.slice(10, 15) +
      " " +
      barcode.slice(15, 20) +
      " " +
      barcode.slice(20, 25) +
      " " +
      barcode.slice(25, 30) +
      " " +
      barcode.slice(30, 35) +
      " " +
      barcode.slice(35, 40) +
      " " +
      barcode.slice(40, 45) +
      " " +
      barcode.slice(45);

    console.log(`✅ ${test.name}`);
    console.log(`   Código: ${barcode}`);
    console.log(`   Formatado: ${formatted}`);
    console.log(`   Tamanho: ${barcode.length} dígitos`);
    console.log();
  } catch (error) {
    console.log(`❌ ${test.name}`);
    console.log(`   Erro: ${error.message}`);
    console.log();
  }
});
