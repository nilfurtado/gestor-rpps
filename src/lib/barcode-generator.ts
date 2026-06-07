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

// Gerar código de barras visual (formato bancário)
// Usa texto monoespaçado renderizado direto no PDF
export async function generateBarcodeImage(data: {
  orgaoCnpj: string;
  dataVencimento: Date;
  totalPagamento: number;
}): Promise<string> {
  // Retorna vazio para usar fallback de texto no documento
  // O número será exibido como texto monoespaçado no PDF
  return "";
}
