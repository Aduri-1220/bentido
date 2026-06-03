import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string | null;
      state?: string | null;
      isAdmin?: boolean;
      isWorker?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string | null;
    state?: string | null;
    isAdmin?: boolean;
    isWorker?: boolean;
  }
}
