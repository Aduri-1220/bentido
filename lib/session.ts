import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { isAdminEmail } from "./admin";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { isWorkerEmail } from "./worker";

/** Session user guaranteed to include `id` when non-null (required for Prisma `userId` filters). */
export async function getCurrentUser(): Promise<
  (Session["user"] & { id: string }) | null
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;

  let id = (session.user as { id?: string }).id;
  if (!id) {
    const row = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    id = row?.id;
  }
  if (!id) return null;

  return { ...session.user, id } as Session["user"] & { id: string };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}

export async function requireWorker() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  /** Allowlist compares canonical email from DB (session email can lag or omit). */
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (!row?.email || !isWorkerEmail(row.email)) redirect("/dashboard");
  return user;
}
