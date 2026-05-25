import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRpps, forbidden } from "@/lib/permissions";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRpps(session.user.role)) return forbidden();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTS.includes(ext);
  if (!isValidType) {
    return NextResponse.json(
      { error: "Formato inválido. Aceitos: JPG, JPEG, PNG e WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo: 5 MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = "rpps-logo.jpg";
  const filepath = path.join(process.cwd(), "public", filename);

  await writeFile(filepath, buffer);

  await prisma.institutoRpps.upsert({
    where: { id: 1 },
    create: { id: 1, logoPath: `/${filename}` },
    update: { logoPath: `/${filename}` },
  });

  return NextResponse.json({ path: `/${filename}` });
}
