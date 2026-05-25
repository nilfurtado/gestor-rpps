import type { LancamentoStatus } from "@prisma/client";

type DecimalLike = number | string;

interface CalcInput {
  valorRecolher: DecimalLike;
  valorRecolhido: DecimalLike;
  parcelado?: boolean;
}

export interface CalcResult {
  deficit: number;
  inadimplencia: number;
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

  const deficit = Math.max(0, valorRecolher - valorRecolhido);

  const inadimplencia =
    valorRecolher > 0 ? Number(((deficit / valorRecolher) * 100).toFixed(2)) : 0;

  let status: LancamentoStatus;
  if (input.parcelado) {
    status = "PARCELADO";
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
    status,
  };
}

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  PAGO: "Pago",
  PARCIAL: "Parcial",
  INADIMPLENTE: "Inadimplente",
  PARCELADO: "Parcelado",
};
