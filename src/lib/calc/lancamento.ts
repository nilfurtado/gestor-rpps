import type { LancamentoStatus } from "@prisma/client";

type DecimalLike = number | string;

interface CalcInput {
  valorRecolher: DecimalLike;
  valorRecolhido: DecimalLike;
  multas?: DecimalLike;
  juros?: DecimalLike;
  acrescimo?: DecimalLike;
  parcelado?: boolean;
}

export interface CalcResult {
  deficit: number;
  deficitBruto: number;
  inadimplencia: number;
  inadimplenciaBruta: number;
  percentualPago: number;
  percentualPagoBruto: number;
  superavit: number;
  superavitBruto: number;
  encargosTotal: number;
  encargosTotalBruto: number;
  valorTotalDevido: number;
  valorTotalDevidoBruto: number;
  valorLiquidoArrecadado: number;
  valorLiquidoArrecadadoBruto: number;
  status: LancamentoStatus;
}

function toNumber(v: DecimalLike): number {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function calcularLancamento(input: CalcInput): CalcResult {
  const valorRecolher = toNumber(input.valorRecolher);
  const valorRecolhido = toNumber(input.valorRecolhido);
  const multas = toNumber(input.multas ?? 0);
  const juros = toNumber(input.juros ?? 0);
  const acrescimo = toNumber(input.acrescimo ?? 0);

  // ─── CÁLCULOS COM ARREDONDAMENTO (toFixed 2) ───

  // Valor Recolhido Efetivo = Valor Recolhido + Acréscimo
  const valorRecolhidoEfetivo = valorRecolhido + acrescimo;

  // Déficit
  const deficit = Math.max(0, valorRecolher - valorRecolhidoEfetivo);
  const deficitBruto = Math.max(0, valorRecolher - valorRecolhidoEfetivo);

  // Inadimplência
  const inadimplenciaBruta = valorRecolher > 0 ? (deficitBruto / valorRecolher) * 100 : 0;
  const inadimplencia = Number(inadimplenciaBruta.toFixed(2));

  // % Pago
  const percentualPagoBruto = valorRecolher > 0 ? (valorRecolhidoEfetivo / valorRecolher) * 100 : 0;
  const percentualPago = Number(percentualPagoBruto.toFixed(2));

  // Superávit
  const superavitBruto = Math.max(0, valorRecolhidoEfetivo - valorRecolher);
  const superavit = Number(superavitBruto.toFixed(2));

  // Encargos Totais
  const encargosTotalBruto = multas + juros;
  const encargosTotal = Number(encargosTotalBruto.toFixed(2));

  // Valor Total Devido
  const valorTotalDevidoBruto = deficitBruto + multas + juros;
  const valorTotalDevido = Number(valorTotalDevidoBruto.toFixed(2));

  // Valor Líquido Arrecadado
  const valorLiquidoArrecadadoBruto = valorRecolhido - multas - juros;
  const valorLiquidoArrecadado = Number(valorLiquidoArrecadadoBruto.toFixed(2));

  // Determinação do status (usando superavit arredondado e valor recolhido efetivo)
  let status: LancamentoStatus;
  if (input.parcelado) {
    status = "PARCELADO";
  } else if (valorRecolher === 0) {
    status = "INADIMPLENTE";
  } else if (superavit > 0) {
    status = "PAGO";
  } else if (valorRecolhidoEfetivo === 0) {
    status = "INADIMPLENTE";
  } else if (valorRecolhidoEfetivo >= valorRecolher) {
    status = "PAGO";
  } else {
    status = "PARCIAL";
  }

  return {
    deficit: Number(deficit.toFixed(2)),
    deficitBruto,
    inadimplencia,
    inadimplenciaBruta,
    percentualPago,
    percentualPagoBruto,
    superavit,
    superavitBruto,
    encargosTotal,
    encargosTotalBruto,
    valorTotalDevido,
    valorTotalDevidoBruto,
    valorLiquidoArrecadado,
    valorLiquidoArrecadadoBruto,
    status,
  };
}

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  PAGO: "Pago",
  PARCIAL: "Parcial",
  INADIMPLENTE: "Inadimplente",
  PARCELADO: "Parcelado",
};
