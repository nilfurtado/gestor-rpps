import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    DATABASE_URL_set: Boolean(process.env.DATABASE_URL),
    DATABASE_URL_starts: process.env.DATABASE_URL?.slice(0, 30) ?? null,
    NEXTAUTH_SECRET_set: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? null,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  let dbStatus: "ok" | "error" = "error";
  let dbError: string | null = null;
  let usersCount: number | null = null;
  let orgaosCount: number | null = null;

  try {
    usersCount = await prisma.user.count();
    orgaosCount = await prisma.orgao.count();
    dbStatus = "ok";
  } catch (err) {
    dbError =
      err instanceof Error
        ? `${err.name}: ${err.message}`.slice(0, 500)
        : "unknown error";
  }

  return NextResponse.json(
    {
      ok: dbStatus === "ok",
      env,
      db: { status: dbStatus, error: dbError, usersCount, orgaosCount },
      timestamp: new Date().toISOString(),
    },
    { status: dbStatus === "ok" ? 200 : 500 }
  );
}
