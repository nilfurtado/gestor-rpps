import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageUsuarios, forbidden } from "@/lib/permissions";

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(4).optional(),
  role: z.enum(["GESTOR", "OPERADOR", "AUDITOR"]).optional(),
});

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsuarios(session.user.role)) return forbidden();

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.nome) data.nome = parsed.data.nome;
  if (parsed.data.email) {
    const dup = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: Number(id) } },
    });
    if (dup) return NextResponse.json({ error: "Login já utilizado por outro usuário." }, { status: 409 });
    data.email = parsed.data.email;
  }
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }
  if (parsed.data.role) {
    // Proteção: impede o GESTOR de rebaixar a si mesmo (evita ficar sem gestor)
    if (String(session.user.id) === id && parsed.data.role !== "GESTOR") {
      return NextResponse.json(
        { error: "Você não pode alterar seu próprio nível de acesso." },
        { status: 400 }
      );
    }
    data.role = parsed.data.role;
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data,
    select: { id: true, email: true, nome: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsuarios(session.user.role)) return forbidden();

  const { id } = await params;

  if (String(session.user.id) === id) {
    return NextResponse.json({ error: "Você não pode excluir sua própria conta." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
