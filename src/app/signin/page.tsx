"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useMemo, useState } from "react";
import { AuthShell } from "@/app/components/AuthShell";
import { AuthInput } from "@/app/components/AuthInput";

function SigninInner() {
  const router = useRouter();
  const sp = useSearchParams();

  // memoize to avoid recomputing, but still fine without
  const callbackUrl = useMemo(() => sp.get("callbackUrl") ?? "/dashboard", [sp]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").toLowerCase().trim();
    const password = String(form.get("password") ?? "");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (!res) {
      setError("Login failed.");
      return;
    }
    if (res.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(res.url ?? callbackUrl);
  }

  return (
    <AuthShell title="Sign in" description="Track training load and recovery.">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          autoComplete="email"
          id="signin-email"
          label="Email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <AuthInput
          autoComplete="current-password"
          id="signin-password"
          label="Password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />

        {error ? (
          <p className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm text-white/90">
            {error}
          </p>
        ) : null}

        <button
          className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_22px_55px_rgba(34,197,94,0.2)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.35)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-white/65">
        <p>
          New here?{" "}
          <Link
            className="text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
            href="/signup"
          >
            Create account
          </Link>
        </p>
        <Link
          className="transition hover:text-[rgba(56,189,248,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
          href="/reset-password"
        >
          Forgot password?
        </Link>
      </div>
    </AuthShell>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in" description="Loading your sign-in view.">
          <p className="text-sm text-white/70">Loading…</p>
        </AuthShell>
      }
    >
      <SigninInner />
    </Suspense>
  );
}
