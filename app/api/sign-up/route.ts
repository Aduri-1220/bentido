import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/lib/schemas";
import { generateTokenHex } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";
import { getAppOrigin } from "@/lib/app-url";

const skipEmailVerification =
  process.env.E2E_SKIP_EMAIL_VERIFICATION === "true";

/** No Resend key: skip verification; sendEmail does not deliver. */
const withoutEmailDelivery = !process.env.RESEND_API_KEY;

const effectiveSkipVerification = skipEmailVerification || withoutEmailDelivery;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;
    const phone = parsed.data.phone;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: { email: ["An account with this email already exists"] } },
        { status: 409 },
      );
    }

    const phoneTaken = await prisma.user.findUnique({
      where: { phone },
    });
    if (phoneTaken) {
      return NextResponse.json(
        {
          error: {
            phone: ["An account with this mobile number already exists"],
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: phone,
        name,
        email,
        phone,
        passwordHash,
        ...(effectiveSkipVerification ? { emailVerified: new Date() } : {}),
      },
    });

    if (!effectiveSkipVerification) {
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
          subject: "Verify your WeBroker email",
          text: `Verify your email by opening this link (expires in 24 hours):\n${link}\n`,
          html: `<p>Hi${name ? ` ${name.split(" ")[0]}` : ""},</p>
<p>Please verify your email for WeBroker by clicking the link below. It expires in 24 hours.</p>
<p><a href="${link}">Verify email</a></p>
<p>If you did not create an account, you can ignore this message.</p>`,
        });
      } catch (e) {
        console.error("[sign-up] verification email failed:", e);
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        });
        return NextResponse.json(
          { error: "Could not send verification email. Try again later." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerificationRequired: !effectiveSkipVerification,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[sign-up]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
