import QRCode from "qrcode";

// Calcular dígito verificador FEBRABAN (módulo 11)
function calculateFebrabanCheckDigit(barcode: string): string {
  try {
    const sequence = "2987654321987654321987654321987654321987654321";
    let sum = 0;

    // Garantir que barcode tem apenas dígitos
    const cleanBarcode = barcode.replace(/\D/g, "");

    if (cleanBarcode.length === 0) {
      return "0";
    }

    for (let i = 0; i < cleanBarcode.length && i < sequence.length; i++) {
      const digit = parseInt(cleanBarcode[i], 10);
      const weight = parseInt(sequence[i], 10);

      if (!isNaN(digit) && !isNaN(weight)) {
        sum += digit * weight;
      }
    }

    const remainder = sum % 11;
    let dv = 0;

    if (remainder === 0) {
      dv = 0;
    } else if (remainder === 1) {
      dv = 0;
    } else {
      dv = 11 - remainder;
    }

    return dv.toString();
  } catch (error) {
    return "0";
  }
}

// Gerar número do código de barras FEBRABAN (47 dígitos)
export function generateBarcodeNumber(data: {
  rppsInfo?: {
    cnpj?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
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

  // CNPJ do RPPS (10 dígitos - extrai primeiros 10 de 14)
  // CNPJ: 00743471000190 → primeiros 10: 0074347100
  const cnpjRaw = data.rppsInfo?.cnpj || "00743471000190"; // Fallback se vazio
  const cnpjLimpo = cnpjRaw.replace(/\D/g, "").padStart(14, "0");
  const cnpj = cnpjLimpo.substring(0, 10);

  if (cnpj === "0000000000") {
    console.warn("⚠️ AVISO: CNPJ está como zeros. rppsInfo:", data.rppsInfo);
  }

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

  // NSR - Para débito automático: [Agência 4][Conta 4][Sequencial 3]
  // Extrai apenas dígitos e pega os primeiros 4
  const agenciaLimpa = (data.rppsInfo?.agencia || "3346-4")
    .replace(/\D/g, "")
    .slice(0, 4)
    .padStart(4, "0");

  const contaLimpa = (data.rppsInfo?.conta || "18.910-3")
    .replace(/\D/g, "")
    .slice(0, 4)
    .padStart(4, "0");

  const competenciaOrdemStr = String(data.competenciaOrdem || 1).padStart(3, "0");

  const nsr = `${agenciaLimpa}${contaLimpa}${competenciaOrdemStr}`;

  console.log("📊 DEBUG DÉBITO AUTOMÁTICO:", {
    agencia: data.rppsInfo?.agencia,
    agenciaLimpa,
    conta: data.rppsInfo?.conta,
    contaLimpa,
    competenciaOrdem: data.competenciaOrdem,
    competenciaOrdemStr,
    nsr,
  });

  // Código de origem (2 dígitos) - 00 padrão
  const codigoOrigem = "00";

  // Montar código sem dígito verificador (46 dígitos)
  const barcodeSemDV = `${banco}0${formaPagamento}${cnpj}${dataVencimento}${valor}${nsr}`;

  // Garantir que tem exatamente 46 dígitos antes de calcular DV
  if (barcodeSemDV.length !== 46) {
    console.warn("⚠️ AVISO: Barcode sem DV tem tamanho incorreto", {
      esperado: 46,
      atual: barcodeSemDV.length,
      barcodeSemDV,
      banco,
      formaPagamento,
      cnpj,
      dataVencimento,
      valor,
      nsr,
    });
  }

  // Calcular dígito verificador
  const dv = calculateFebrabanCheckDigit(barcodeSemDV);

  // Montar código completo (47 dígitos)
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

    if (!barcodeNumber || barcodeNumber.length < 40) {
      console.warn("Código de barras inválido:", barcodeNumber);
      return "";
    }

    // Formatar com espaços (FEBRABAN padrão: 5 + 5 + 5 + 5 + 5 + 5 + 5 + 2)
    const formattedBarcode = `${barcodeNumber.slice(0, 5)} ${barcodeNumber.slice(5, 10)} ${barcodeNumber.slice(10, 15)} ${barcodeNumber.slice(15, 20)} ${barcodeNumber.slice(20, 25)} ${barcodeNumber.slice(25, 30)} ${barcodeNumber.slice(30, 35)} ${barcodeNumber.slice(35, 40)} ${barcodeNumber.slice(40, 45)} ${barcodeNumber.slice(45)}`;

    const qrImage = await QRCode.toDataURL(formattedBarcode, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return qrImage;
  } catch (error) {
    console.error("❌ Erro ao gerar QR code:", error);
    return "";
  }
}
