import QRCode from "qrcode";

// Calcular dígito verificador FEBRABAN (módulo 11)
function calculateFebrabanCheckDigit(barcode: string): string {
  const sequence = "2987654321987654321987654321987654321987654321";
  let sum = 0;

  try {
    for (let i = 0; i < barcode.length && i < sequence.length; i++) {
      const digit = parseInt(barcode[i], 10);
      const weight = parseInt(sequence[i], 10);

      if (isNaN(digit) || isNaN(weight)) {
        console.error(`Erro ao calcular DV: posição ${i}, barcode[${i}]=${barcode[i]}, sequence[${i}]=${sequence[i]}`);
        return "0"; // Fallback
      }

      sum += digit * weight;
    }

    const remainder = sum % 11;
    const digit = remainder === 0 ? 0 : remainder === 1 ? 0 : 11 - remainder;

    return digit.toString();
  } catch (error) {
    console.error("Erro ao calcular dígito verificador:", error, { barcode });
    return "0"; // Fallback seguro
  }
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
  const orgaoIdStr = String(data.orgaoId || 0).padStart(5, "0");
  const anoStr = String(data.exercicioAno || 0).slice(-2).padStart(2, "0");
  // competenciaMes pode vir como string "janeiro" ou número "1"
  let mesNum = "01";
  if (typeof data.competenciaMes === "string") {
    const mesMap: Record<string, string> = {
      janeiro: "01", fevereiro: "02", março: "03", abril: "04",
      maio: "05", junho: "06", julho: "07", agosto: "08",
      setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
    };
    mesNum = mesMap[data.competenciaMes.toLowerCase()] || "01";
  } else {
    mesNum = String(data.competenciaMes || 1).padStart(2, "0");
  }
  const ordemStr = String(data.competenciaOrdem || 1).padStart(2, "0");
  const nsr = `${orgaoIdStr}${anoStr}${mesNum}${ordemStr}`;

  // Código de origem (2 dígitos) - 00 padrão
  const codigoOrigem = "00";

  // Montar código sem dígito verificador
  const barcodeSemDV = `${banco}0${formaPagamento}${cnpj}${dataVencimento}${valor}${nsr}`;

  console.log("📊 BARCODE GERADO:", {
    banco,
    formaPagamento,
    cnpj,
    dataVencimento,
    valor,
    nsr,
    barcodeSemDV,
    barcodeSemDVLength: barcodeSemDV.length,
  });

  // Calcular dígito verificador
  const dv = calculateFebrabanCheckDigit(barcodeSemDV);

  console.log("📊 DÍGITO VERIFICADOR:", dv);

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
