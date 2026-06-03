import type { LancamentoStatus } from "@prisma/client";

type DecimalLike = number | string;

interface CalcInput {
  valorRecolher: DecimalLike;
  valorRecolhido: DecimalLike;
  multas?: DecimalLike;
  juros?: DecimalLike;
  parcelado?: boolean;
}

export interface CalcResult {
  deficit: number;
  inadimplencia: number;
  percentualPago: number;
  superavit: number;
  encargosTotal: number;
  valorTotalDevido: number;
  valorLiquidoArrecadado: number;
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

  // Cálculos de déficit e inadimplência
  const deficit = Math.max(0, valorRecolher - valorRecolhido);
  const inadimplencia =
    valorRecolher > 0 ? Number(((deficit / valorRecolher) * 100).toFixed(2)) : 0;

  // Cálculo de percentual pago
  const percentualPago =
    valorRecolher > 0 ? Number(((valorRecolhido / valorRecolher) * 100).toFixed(2)) : 0;

  // Cálculo de superávit
  const superavit = Math.max(0, valorRecolhido - valorRecolher);

  // Encargos totais
  const encargosTotal = Number((multas + juros).toFixed(2));

  // Valor total devido
  const valorTotalDevido = Number((deficit + multas + juros).toFixed(2));

  // Valor líquido arrecadado
  const valorLiquidoArrecadado = Number((valorRecolhido - multas - juros).toFixed(2));

  // Determinação do status
  let status: LancamentoStatus;
  if (input.parcelado) {
    status = "PARCELADO";
  } else if (valorRecolher === 0) {
    status = "INADIMPLENTE";
  } else if (superavit > 0) {
    status = "PAGO";
  } else if (valorRecolhido === 0) {
    status = "INADIMPLENTE";
  } else if (valorRecolhido >= valorRecolher) {
    status = "PAGO";
  } else {
    status = "PARCIAL";
  }

  return {
    deficit: Number(deficit.toFixed(2)),
    inadimplencia,
    percentualPago,
    superavit: Number(superavit.toFixed(2)),
    encargosTotal,
    valorTotalDevido,
    valorLiquidoArrecadado,
    status,
  };
}

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  PAGO: "Pago",
  PARCIAL: "Parcial",
  INADIMPLENTE: "Inadimplente",
  PARCELADO: "Parcelado",
};
