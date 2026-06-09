import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/auth-tokens";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(parsed.data.token);
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!row || row.expiresAt < new Date()) {
      return NextResponse.json(
        { error: { token: ["This reset link is invalid or has expired"] } },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: row.id } }),
      prisma.verificationToken.deleteMany({
        where: { identifier: row.user.email },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[reset-password] unexpected error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
