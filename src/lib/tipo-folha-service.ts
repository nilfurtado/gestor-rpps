import { prisma } from "@/lib/db";
import type { TipoFolha } from "@prisma/client";

export async function getTiposFolhaAtivos(): Promise<TipoFolha[]> {
  return prisma.tipoFolha.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
}

export async function getTipoFolhaByNome(nome: string): Promise<TipoFolha | null> {
  return prisma.tipoFolha.findUnique({
    where: { nome },
  });
}

export async function createTipoFolhaCustomizado(
  nome: string,
  descricao?: string
): Promise<TipoFolha> {
  const existente = await getTipoFolhaByNome(nome);
  if (existente) {
    throw new Error(`Tipo de folha com nome "${nome}" já existe.`);
  }

  const ultimo = await prisma.tipoFolha.findFirst({
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });

  const proximaOrdem = (ultimo?.ordem ?? 0) + 1;

  return prisma.tipoFolha.create({
    data: {
      nome,
      descricao,
      ordem: proximaOrdem,
      customizado: true,
      obrigatorio: false,
      ativo: true,
    },
  });
}

export function calcularValorARecolher(valor: number, aliquota: number): number {
  return Number(((valor * aliquota) / 100).toFixed(2));
}

export function calcularDiferenca(valorARecolher: number, valorRecolhido: number): number {
  return Number((valorARecolher - valorRecolhido).toFixed(2));
}

export function calcularFolhaTotal(folhas: Array<{ valor: number }>): number {
  if (folhas.length === 0) return 0;
  const total = folhas.reduce((acc, f) => acc + f.valor, 0);
  return Number(total.toFixed(2));
}

export function calcularTotalARecolher(folhas: Array<{ valorARecolher: number }>): number {
  if (folhas.length === 0) return 0;
  const total = folhas.reduce((acc, f) => acc + f.valorARecolher, 0);
  return Number(total.toFixed(2));
}

export function calcularTotalRecolhido(folhas: Array<{ valorRecolhido: number }>): number {
  if (folhas.length === 0) return 0;
  const total = folhas.reduce((acc, f) => acc + f.valorRecolhido, 0);
  return Number(total.toFixed(2));
}

export function calcularDeficitTotal(folhas: Array<{ diferenca: number }>): number {
  if (folhas.length === 0) return 0;
  const total = folhas.reduce((acc, f) => acc + f.diferenca, 0);
  return Number(total.toFixed(2));
}
