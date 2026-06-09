import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: Date.now() - start });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: null, error: "db unreachable" },
      { status: 503 },
    );
  }
}
