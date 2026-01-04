"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SigninPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";

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
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="lab-card rounded-3xl p-6 md:p-7">
          <div className="mb-5 space-y-2">
            <div className="text-xs uppercase tracking-wide lab-muted">Sign in</div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm lab-muted">Log in to continue tracking sessions and risk signals.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
              name="email"
              placeholder="Email"
              type="email"
              required
            />
            <input
              className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
              name="password"
              placeholder="Password"
              type="password"
              required
            />

            {error ? (
              <p className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[rgba(230,232,238,0.92)]">
                {error}
              </p>
            ) : null}

            <button
              className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] p-3 text-sm font-medium text-black disabled:opacity-60"
              disabled={loading}
              type="submit"
              style={{ boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.10)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="lab-muted">
              No account?{" "}
              <Link className="text-[var(--lab-safe)] hover:underline" href="/signup">
                Create one
              </Link>
            </p>
            <Link className="lab-muted hover:underline" href="/reset-password">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs lab-muted">
          Same vibe. Same flow. No weird UI mismatches.
        </p>
      </div>
    </div>
  );
}
