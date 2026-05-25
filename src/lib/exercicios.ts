import { prisma } from "@/lib/db";

export async function ensureExercicioAtual() {
  const anoAtual = new Date().getFullYear();
  await prisma.exercicio.upsert({
    where: { ano: anoAtual },
    update: {},
    create: { ano: anoAtual, status: "ABERTO" },
  });
}
