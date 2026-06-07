import QRCode from "qrcode";

// Gerar número do código de barras para exibição
export function generateBarcodeNumber(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): string {
  // Formato: CNPJ (14) + Data DDMMAA (6) + Valor em centavos (10)
  const cnpj = data.orgaoCnpj.replace(/\D/g, "").slice(0, 14);
  const dia = String(data.dataVencimento.getDate()).padStart(2, "0");
  const mes = String(data.dataVencimento.getMonth() + 1).padStart(2, "0");
  const ano = String(data.dataVencimento.getFullYear()).slice(-2);
  const vencimento = `${dia}${mes}${ano}`;
  const valor = Math.floor(data.totalPagamento * 100)
    .toString()
    .padStart(10, "0")
    .slice(-10);

  return `${cnpj}${vencimento}${valor}`;
}

// Gerar QR code como imagem PNG base64
export async function generateBarcodeImage(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): Promise<string> {
  try {
    const barcodeNumber = generateBarcodeNumber(data);
    const qrImage = await QRCode.toDataURL(barcodeNumber, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 150,
    });
    return qrImage;
  } catch (error) {
    console.error("Erro ao gerar QR code:", error);
    return "";
  }
}
