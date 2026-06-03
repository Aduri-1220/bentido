"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInData } from "@/lib/schemas";

/** NextAuth open-redirect protection: only allow same-origin relative destinations. */
function safePostLoginPath(raw: string | null): string {
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={<div className="h-96 animate-pulse rounded-xl bg-slate-100" />}
    >
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const params = useSearchParams();
  const postLoginPath = safePostLoginPath(params.get("callbackUrl"));
  const errorParam = params.get("error");
  const verifiedParam = params.get("verified");
  const registeredParam = params.get("registered");
  const hintEmail = params.get("email") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: hintEmail, password: "" },
  });

  useEffect(() => {
    if (hintEmail) setValue("email", hintEmail);
  }, [hintEmail, setValue]);

  useEffect(() => {
    if (verifiedParam === "1") {
      toast.success("Email verified. You can sign in now.");
    }
    if (registeredParam === "1") {
      toast.message(
        "Check your inbox for a verification link before signing in.",
      );
    }
    if (errorParam === "unverified") {
      toast.error("Please verify your email before signing in.");
    }
    if (errorParam === "verify_expired") {
      toast.error("That verification link expired. Send a new one below.");
    }
    if (errorParam === "verify_invalid" || errorParam === "verify_failed") {
      toast.error(
        "We could not verify that link. Try signing up or resend verification.",
      );
    }
  }, [errorParam, verifiedParam, registeredParam]);

  async function onSubmit(values: SignInData) {
    setSubmitting(true);
    try {
      const destinationUrl = new URL(postLoginPath, window.location.origin)
        .href;
      const res = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: destinationUrl,
      });
      if (res?.error) {
        toast.error("Invalid email or password");
        return;
      }
      if (res?.url?.includes("error=unverified")) {
        toast.error("Please verify your email before signing in.");
        return;
      }
      if (!res?.ok) {
        toast.error("Invalid email or password");
        return;
      }
      toast.success("Welcome back!");
      // Full navigation so the App Router server tree always sees the new session cookie.
      window.location.assign(destinationUrl);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendVerification() {
    const email = getValues("email");
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        toast.error("Could not send email. Try again later.");
        return;
      }
      toast.success("If your account needs verification, we sent a new link.");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to continue drafting your agreement.
        </p>
        {postLoginPath === "/admin" || postLoginPath === "/worker" ? (
          <p className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-900">
            Staff sign-in: after authentication you&apos;ll continue to the{" "}
            <strong>
              {postLoginPath === "/admin" ? "admin" : "worker"}
            </strong>{" "}
            dashboard.
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={googleLoading}
        onClick={() => {
          setGoogleLoading(true);
          const destinationUrl = new URL(postLoginPath, window.location.origin)
            .href;
          void signIn("google", { callbackUrl: destinationUrl });
        }}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs uppercase tracking-wide text-slate-400">
          or
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-9"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>

        <p className="text-center text-xs text-slate-500">
          Didn&rsquo;t get a verification email?{" "}
          <button
            type="button"
            onClick={() => void resendVerification()}
            disabled={resending}
            className="font-semibold text-brand-700 hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend link"}
          </button>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to WeBroker?{" "}
        <Link
          href="/sign-up"
          className="font-semibold text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.5 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
