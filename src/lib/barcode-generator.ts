import QRCode from "qrcode";

// Calcular dígito verificador FEBRABAN (módulo 11)
function calculateFebrabanCheckDigit(barcode: string): string {
  const sequence = "2987654321987654321987654321987654321987654321";
  let sum = 0;

  for (let i = 0; i < barcode.length; i++) {
    sum += parseInt(barcode[i]) * parseInt(sequence[i]);
  }

  const remainder = sum % 11;
  const digit = remainder === 0 ? 0 : remainder === 1 ? 0 : 11 - remainder;

  return digit.toString();
}

// Gerar número do código de barras FEBRABAN (47 dígitos)
export function generateBarcodeNumber(data: {
  rppsInfo?: {
    cnpj?: string;
    banco?: string;
  } | null;
  orgaoId: number;
  dataVencimento: Date;
  totalPagamento: number;
  exercicioAno: number;
  competenciaMes: string;
  competenciaOrdem: number;
}): string {
  // Banco (3 dígitos) - padrão Banco do Brasil
  const banco = data.rppsInfo?.banco ? String(data.rppsInfo.banco).padStart(3, "0") : "001";

  // Forma de pagamento (2 dígitos) - 0100 para INSS
  const formaPagamento = "0100";

  // CNPJ do RPPS (10 dígitos - sem formatação)
  const cnpj = (data.rppsInfo?.cnpj || "").replace(/\D/g, "").slice(0, 14).slice(-10).padStart(10, "0");

  // Data de vencimento (8 dígitos - DDMMAAAA)
  const dia = String(data.dataVencimento.getDate()).padStart(2, "0");
  const mes = String(data.dataVencimento.getMonth() + 1).padStart(2, "0");
  const ano = String(data.dataVencimento.getFullYear());
  const dataVencimento = `${dia}${mes}${ano}`;

  // Valor (10 dígitos - com 2 casas decimais, sem separador)
  const valor = Math.floor(data.totalPagamento * 100)
    .toString()
    .padStart(10, "0")
    .slice(-10);

  // NSR - Número Sequencial (11 dígitos)
  // Formato: [OrgãoID 5dig][Ano 2dig][Mês 2dig][Ordem 2dig]
  const orgaoIdStr = String(data.orgaoId).padStart(5, "0");
  const anoStr = String(data.exercicioAno).slice(-2);
  const mesNum = String(parseInt(data.competenciaMes) || 1).padStart(2, "0");
  const ordemStr = String(data.competenciaOrdem).padStart(2, "0");
  const nsr = `${orgaoIdStr}${anoStr}${mesNum}${ordemStr}`;

  // Código de origem (2 dígitos) - 00 padrão
  const codigoOrigem = "00";

  // Montar código sem dígito verificador
  const barcodeSemDV = `${banco}0${formaPagamento}${cnpj}${dataVencimento}${valor}${nsr}`;

  // Calcular dígito verificador
  const dv = calculateFebrabanCheckDigit(barcodeSemDV);

  // Montar código completo
  const barcodeCompleto = `${banco}${dv}${formaPagamento}${cnpj}${dataVencimento}${valor}${nsr}${codigoOrigem}`;

  return barcodeCompleto;
}

// Gerar QR code como imagem PNG base64
export async function generateBarcodeImage(data: {
  rppsInfo?: {
    cnpj?: string;
    banco?: string;
  } | null;
  orgaoId: number;
  dataVencimento: Date;
  totalPagamento: number;
  exercicioAno: number;
  competenciaMes: string;
  competenciaOrdem: number;
}): Promise<string> {
  try {
    const barcodeNumber = generateBarcodeNumber(data);

    // Formatar com espaços (FEBRABAN padrão: 5 + 5 + 5 + 5 + 5 + 5 + 5 + 2)
    const formattedBarcode = `${barcodeNumber.slice(0, 5)} ${barcodeNumber.slice(5, 10)} ${barcodeNumber.slice(10, 15)} ${barcodeNumber.slice(15, 20)} ${barcodeNumber.slice(20, 25)} ${barcodeNumber.slice(25, 30)} ${barcodeNumber.slice(30, 35)} ${barcodeNumber.slice(35, 40)} ${barcodeNumber.slice(40, 45)} ${barcodeNumber.slice(45)}`;

    const qrImage = await QRCode.toDataURL(formattedBarcode, {
      errorCorrectionLevel: "M",
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
