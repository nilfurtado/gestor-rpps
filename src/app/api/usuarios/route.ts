import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageUsuarios, forbidden } from "@/lib/permissions";

const createSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(4, "Senha deve ter ao menos 4 caracteres"),
  role: z.enum(["GESTOR", "OPERADOR", "AUDITOR"]).default("OPERADOR"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, nome: true, role: true, createdAt: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsuarios(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ error: "Usuário já cadastrado com este login." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      nome: parsed.data.nome,
      passwordHash,
      role: parsed.data.role,
    },
    select: { id: true, email: true, nome: true, role: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
