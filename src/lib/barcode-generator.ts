import JsBarcode from "jsbarcode";
import { createCanvas } from "canvas";

export function generateBarcodeImage(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): string {
  // Formatar dados para código de barras
  // Formato simplificado: CNPJ + Data + Valor (últimos 10 dígitos)
  const cnpj = data.orgaoCnpj.replace(/\D/g, "").slice(0, 14);
  const vencimento = data.dataVencimento.toLocaleDateString("pt-BR").replace(/\D/g, "");
  const valor = Math.floor(data.totalPagamento * 100)
    .toString()
    .padStart(10, "0")
    .slice(-10);

  const barcodeValue = `${cnpj}${vencimento}${valor}`;

  try {
    // Criar canvas
    const canvas = createCanvas(400, 100);

    // Gerar código de barras no canvas
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
    });

    // Converter para data URL
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Erro ao gerar código de barras:", error);
    // Retornar placeholder se houver erro
    return "";
  }
}

// Função para gerar apenas o número do código de barras (para exibição)
export function generateBarcodeNumber(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): string {
  const cnpj = data.orgaoCnpj.replace(/\D/g, "").slice(0, 14);
  const vencimento = data.dataVencimento.toLocaleDateString("pt-BR").replace(/\D/g, "");
  const valor = Math.floor(data.totalPagamento * 100)
    .toString()
    .padStart(10, "0")
    .slice(-10);

  return `${cnpj}${vencimento}${valor}`;
}
