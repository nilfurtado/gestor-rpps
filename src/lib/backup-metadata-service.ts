import { prisma } from "@/lib/db";

export async function saveBackupMetadata(
  backupId: string,
  filename: string,
  description?: string
): Promise<void> {
  try {
    await prisma.backupMetadata.create({
      data: {
        backupId,
        filename,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("Erro ao salvar metadados do backup:", error);
    throw new Error("Falha ao salvar metadados");
  }
}

export async function getBackupMetadata(backupId: string): Promise<any | null> {
  try {
    return await prisma.backupMetadata.findUnique({
      where: { backupId },
    });
  } catch (error) {
    console.error("Erro ao buscar metadados:", error);
    return null;
  }
}

export async function updateBackupDescription(
  backupId: string,
  description: string
): Promise<void> {
  try {
    await prisma.backupMetadata.update({
      where: { backupId },
      data: { description },
    });
  } catch (error) {
    console.error("Erro ao atualizar descrição:", error);
    throw new Error("Falha ao atualizar descrição");
  }
}
