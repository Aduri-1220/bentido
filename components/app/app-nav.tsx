"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import {
  Briefcase,
  FileSignature,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function AppNav() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin === true;
  const isWorker = session?.user?.isWorker === true;
  const initial = (session?.user?.name || session?.user?.email || "?")
    .charAt(0)
    .toUpperCase();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
            <FileSignature className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            We<span className="text-brand-600">Broker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          {isWorker ? (
            <Link
              href="/worker"
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              <Briefcase className="h-4 w-4" />
              Worker
            </Link>
          ) : null}
        </nav>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
                {initial}
              </div>
              <span className="hidden text-sm font-medium md:inline">
                {session?.user?.name || session?.user?.email}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{session?.user?.name}</div>
              <div className="text-xs font-normal text-slate-500">
                {session?.user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </DropdownMenuItem>
            {isAdmin || isWorker ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="py-1 text-[10px] font-normal uppercase tracking-wide text-slate-400">
                  Staff portals
                </DropdownMenuLabel>
              </>
            ) : null}
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </Link>
              </DropdownMenuItem>
            ) : null}
            {isWorker ? (
              <DropdownMenuItem asChild>
                <Link href="/worker">
                  <Briefcase className="mr-2 h-4 w-4" /> Worker
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href="/onboarding">
                <User className="mr-2 h-4 w-4" /> Profile preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                signOut({
                  callbackUrl:
                    typeof window !== "undefined"
                      ? `${window.location.origin}/`
                      : "/",
                })
              }
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
