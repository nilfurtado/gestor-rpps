import { prisma } from "@/lib/db";
import type {
  CreateFolhaSuplementerInput,
  UpdateFolhaSuplementerInput,
  FolhaSupplementar,
} from "@/types/folha-suplementar";
import { Decimal } from "@prisma/client/runtime/library";

export async function listFolhaSuplementer(
  folhaPrevidenciariaId?: number
): Promise<FolhaSupplementar[]> {
  const where = folhaPrevidenciariaId ? { folhaPrevidenciariaId } : {};
  return prisma.folhaSupplementar.findMany({
    where,
    include: { folhaPrevidenciaria: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFolhaSuplementer(
  id: number
): Promise<FolhaSupplementar | null> {
  return prisma.folhaSupplementar.findUnique({
    where: { id },
    include: { folhaPrevidenciaria: true },
  });
}

export async function createFolhaSuplementer(
  input: CreateFolhaSuplementerInput
): Promise<FolhaSupplementar> {
  return prisma.folhaSupplementar.create({
    data: {
      folhaPrevidenciariaId: input.folhaPrevidenciariaId,
      motivo: input.motivo,
      descricao: input.descricao,
      folhaBase: input.folhaBase,
      status: "LANCADO",
      observacoes: input.observacoes,
    },
    include: { folhaPrevidenciaria: true },
  });
}

export async function updateFolhaSuplementer(
  id: number,
  input: UpdateFolhaSuplementerInput
): Promise<FolhaSupplementar> {
  return prisma.folhaSupplementar.update({
    where: { id },
    data: {
      ...(input.motivo && { motivo: input.motivo }),
      ...(input.descricao !== undefined && { descricao: input.descricao }),
      ...(input.folhaBase && { folhaBase: input.folhaBase }),
      ...(input.observacoes !== undefined && { observacoes: input.observacoes }),
    },
    include: { folhaPrevidenciaria: true },
  });
}

export async function deleteFolhaSuplementer(id: number): Promise<void> {
  await prisma.folhaSupplementar.delete({
    where: { id },
  });
}

export async function getTotalSuplementerFolha(
  folhaPrevidenciariaId: number
): Promise<Decimal> {
  const result = await prisma.folhaSupplementar.aggregate({
    where: { folhaPrevidenciariaId },
    _sum: { folhaBase: true },
  });
  return result._sum.folhaBase || new Decimal(0);
}

export async function getFolhasSuplementerByFolhaId(
  folhaPrevidenciariaId: number
): Promise<FolhaSupplementar[]> {
  return prisma.folhaSupplementar.findMany({
    where: { folhaPrevidenciariaId },
    orderBy: { createdAt: "desc" },
  });
}
