import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { isAdminEmail } from "./admin";
import { prisma } from "./db";
import { isWorkerEmail } from "./worker";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) return true;

      if (account?.provider === "google") {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
        return true;
      }

      if (process.env.E2E_SKIP_EMAIL_VERIFICATION === "true") {
        return true;
      }

      if (!process.env.RESEND_API_KEY) {
        return true;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerified: true, email: true },
      });
      if (dbUser?.emailVerified) return true;

      const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";
      const dest = `${base}/sign-in?error=unverified&email=${encodeURIComponent(dbUser?.email ?? user.email ?? "")}`;
      return dest.startsWith("http")
        ? dest
        : `/sign-in?error=unverified&email=${encodeURIComponent(dbUser?.email ?? user.email ?? "")}`;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; email?: string | null };
        token.id = u.id;
        if (u.email) token.email = u.email;
      }

      /** Match DB row even when OAuth email casing differs from stored email. */
      let dbUser = null as {
        id: string;
        role: string | null;
        state: string | null;
        email: string;
      } | null;

      const rawEmail =
        typeof token.email === "string" ? token.email.trim() : "";
      if (rawEmail) {
        dbUser = await prisma.user.findFirst({
          where: {
            email: { equals: rawEmail, mode: "insensitive" },
          },
          select: {
            id: true,
            role: true,
            state: true,
            email: true,
          },
        });
      }

      if (!dbUser && typeof token.id === "string") {
        dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            role: true,
            state: true,
            email: true,
          },
        });
        if (dbUser?.email) token.email = dbUser.email;
      }

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.state = dbUser.state;
        token.isAdmin = isAdminEmail(dbUser.email);
        token.isWorker = isWorkerEmail(dbUser.email);
      } else {
        token.isAdmin = false;
        token.isWorker = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.email === "string" && token.email.length > 0) {
          session.user.email = token.email;
        }
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string | null }).role =
          (token.role as string | null) ?? null;
        (session.user as { state?: string | null }).state =
          (token.state as string | null) ?? null;
        (session.user as { isAdmin?: boolean }).isAdmin =
          token.isAdmin === true;
        (session.user as { isWorker?: boolean }).isWorker =
          token.isWorker === true;
      }
      return session;
    },
  },
};
