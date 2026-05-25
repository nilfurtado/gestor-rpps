import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canManageRpps, forbidden } from "@/lib/permissions";

const rppsSchema = z.object({
  nomeInstituto:           z.string().max(200).optional(),
  nomeResponsavel:         z.string().max(200).optional(),
  cnpj:                    z.string().max(18).optional(),
  enderecoCompleto:        z.string().max(500).optional(),
  telefone:                z.string().max(30).optional(),
  email:                   z.string().email("E-mail inválido").max(200).optional().or(z.literal("")),
  nomeDepartamento:        z.string().max(200).optional(),
  responsavelDepartamento: z.string().max(200).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rpps = await prisma.institutoRpps.findFirst();
  return NextResponse.json(rpps ?? null);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRpps(session.user.role)) return forbidden();

  const body = await req.json();
  const parsed = rppsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v ?? null])
  );

  const rpps = await prisma.institutoRpps.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });

  return NextResponse.json(rpps);
}
