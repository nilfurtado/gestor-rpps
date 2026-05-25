import { NextResponse } from "next/server";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageRpps, forbidden } from "@/lib/permissions";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const LOGO_URL = "/api/rpps/logo"; // GET serve a logo direto do banco

export async function GET() {
  const rpps = await prisma.institutoRpps.findUnique({
    where: { id: 1 },
    select: { logoData: true, logoMime: true, updatedAt: true },
  });
  if (!rpps?.logoData) {
    return NextResponse.json({ error: "Logo não cadastrada" }, { status: 404 });
  }
  // Prisma Bytes vem como Buffer / Uint8Array
  const buf = Buffer.from(rpps.logoData);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": rpps.logoMime ?? "image/jpeg",
      "Cache-Control": "public, max-age=60, must-revalidate",
      "Last-Modified": rpps.updatedAt.toUTCString(),
    },
  });
}

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

  // Detecta mime: prefere file.type, senão deduz pela extensão
  const mime =
    file.type && file.type.startsWith("image/")
      ? file.type === "image/jpg"
        ? "image/jpeg"
        : file.type
      : ext === ".png"
      ? "image/png"
      : ext === ".webp"
      ? "image/webp"
      : "image/jpeg";

  await prisma.institutoRpps.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      logoPath: LOGO_URL,
      logoData: buffer,
      logoMime: mime,
    },
    update: {
      logoPath: LOGO_URL,
      logoData: buffer,
      logoMime: mime,
    },
  });

  return NextResponse.json({ path: LOGO_URL });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRpps(session.user.role)) return forbidden();

  await prisma.institutoRpps.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: { logoPath: null, logoData: null, logoMime: null },
  });

  return NextResponse.json({ ok: true });
}
