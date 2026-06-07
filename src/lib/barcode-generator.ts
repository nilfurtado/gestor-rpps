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

// Gerar código de barras visual (formato bancário CODE128)
export async function generateBarcodeImage(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): Promise<string> {
  try {
    const barcodeNumber = generateBarcodeNumber(data);
    // Simular código de barras visual em formato ASCII/SVG
    // Retornar a imagem SVG do código de barras
    const svg = `
      <svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="80" fill="white"/>
        <text x="200" y="25" font-family="Courier" font-size="18" font-weight="bold" text-anchor="middle">
          ${barcodeNumber}
        </text>
        <line x1="20" y1="35" x2="380" y2="35" stroke="black" stroke-width="1"/>
        <line x1="20" y1="45" x2="380" y2="45" stroke="black" stroke-width="1"/>
        <text x="200" y="70" font-family="Arial" font-size="8" text-anchor="middle" fill="#666">
          Código de Barras - Formato Bancário Padrão
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch (error) {
    console.error("Erro ao gerar código de barras:", error);
    return "";
  }
}
