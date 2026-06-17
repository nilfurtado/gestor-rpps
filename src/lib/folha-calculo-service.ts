import { prisma } from "@/lib/db";
import { getTotalSuplementerFolha } from "./folha-suplementar-service";
import { Decimal } from "@prisma/client/runtime/library";

export async function calcularFolhaTotal(folhaId: number): Promise<{
  folhaBase: Decimal;
  folhaSuplementar: Decimal;
  folhaTotal: Decimal;
  valorRecolherCalculado: Decimal;
}> {
  const folha = await prisma.folhaPrevidenciaria.findUnique({
    where: { id: folhaId },
  });

  if (!folha) {
    throw new Error("Folha não encontrada");
  }

  const folhaSuplementar = await getTotalSuplementerFolha(folhaId);

  const folhaBase = folha.folhaBase || new Decimal(0);
  const folhaTotal = folhaBase.plus(folhaSuplementar);
  const valorRecolherCalculado = folhaTotal.times(folha.aliquota).dividedBy(100);

  return {
    folhaBase,
    folhaSuplementar,
    folhaTotal,
    valorRecolherCalculado,
  };
}

export async function recalcularFolha(folhaId: number): Promise<void> {
  const calculo = await calcularFolhaTotal(folhaId);

  await prisma.folhaPrevidenciaria.update({
    where: { id: folhaId },
    data: {
      valorRecolherCalculado: calculo.valorRecolherCalculado,
    },
  });
}
