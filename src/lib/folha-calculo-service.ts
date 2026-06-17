import type { FolhaPrevidenciaria } from "@prisma/client";

export interface FolhaCalculoResult {
  folhaBase: number;
  folhaSuplementar: number;
  folhaTotal: number;
  valorRecolherCalculado: number;
  deficit: number;
  superavit: number;
  inadimplencia: number;
  percentualPago: number;
}

function toNumber(v: any): number {
  if (typeof v === "number") return v;
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Calcula todos os valores relacionados a uma folha previdenciária,
 * incluindo folhaSuplementar em todas as fórmulas.
 */
export async function calcularFolhaTotal(
  folha: FolhaPrevidenciaria
): Promise<FolhaCalculoResult> {
  const folhaBase = toNumber(folha.folhaBase);
  const folhaSuplementar = toNumber(folha.folhaSuplementar);
  const aliquota = toNumber(folha.aliquota);
  const valorRecolher = toNumber(folha.valorRecolher);
  const valorRecolhido = toNumber(folha.valorRecolhido);

  // NOVO: Calcular folhaTotal
  const folhaTotal = folhaBase + folhaSuplementar;

  // ATUALIZADO: Usar folhaTotal em vez de folhaBase
  const valorRecolherCalculado =
    folhaTotal > 0 ? (folhaTotal * aliquota) / 100 : 0;

  // RECALCULADO: Usar folhaTotal
  const deficit = Math.max(0, valorRecolher - folhaTotal);
  const superavit = Math.max(0, folhaTotal - valorRecolher);

  // RECALCULADO: Usar novo deficit
  const inadimplencia =
    valorRecolher > 0 ? (deficit / valorRecolher) * 100 : 0;

  // RECALCULADO: Usar novo valorRecolherCalculado
  const percentualPago =
    valorRecolherCalculado > 0
      ? (valorRecolhido / valorRecolherCalculado) * 100
      : 0;

  return {
    folhaBase,
    folhaSuplementar,
    folhaTotal,
    valorRecolherCalculado,
    deficit,
    superavit,
    inadimplencia,
    percentualPago,
  };
}
