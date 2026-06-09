import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateTokenHex } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/app-url";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }
    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true, passwordHash: true },
    });

    if (user?.passwordHash && !user.emailVerified) {
      const token = generateTokenHex();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      await prisma.verificationToken.create({
        data: { identifier: email, token, expires },
      });

      const origin = getAppOrigin(req);
      const link = `${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

      try {
        await sendEmail({
          to: email,
          subject: "Verify your bentido email",
          text: `Verify your email by opening this link (expires in 24 hours):\n${link}\n`,
          html: `<p>Hi${user.name ? ` ${user.name.split(" ")[0]}` : ""},</p>
<p>Please verify your email for bentido by clicking the link below. It expires in 24 hours.</p>
<p><a href="${link}">Verify email</a></p>`,
        });
      } catch (e) {
        logger.error("[resend-verification] send failed", e);
        return NextResponse.json(
          { error: "Could not send email. Try again later." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("[resend-verification] unexpected error", err);
    return NextResponse.json({ ok: true });
  }
}
