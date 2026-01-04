"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Signup failed.");
      return;
    }

    router.push("/signin");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="lab-card rounded-3xl p-6 md:p-7">
          <div className="mb-5 space-y-2">
            <div className="text-xs uppercase tracking-wide lab-muted">Create account</div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Gym Risk</h1>
            <p className="text-sm lab-muted">
              Set up your account to log sessions and track explainable risk signals.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              className="w-full rounded-xl border border-white/10 bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-white/40 focus:border-[rgba(34,197,94,0.35)]"
              name="name"
              placeholder="Name (optional)"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-white/40 focus:border-[rgba(34,197,94,0.35)]"
              name="email"
              placeholder="Email"
              type="email"
              required
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-white/40 focus:border-[rgba(34,197,94,0.35)]"
              name="password"
              placeholder="Password (min 8 chars)"
              type="password"
              required
            />

            {error ? (
              <p className="rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-white/90">
                {error}
              </p>
            ) : null}

            <button
              className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] p-3 text-sm font-medium text-black disabled:opacity-60"
              disabled={loading}
              type="submit"
              style={{ boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.10)" }}
            >
              {loading ? "Creating..." : "Sign up"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="lab-muted">
              Already have an account?{" "}
              <Link className="text-[var(--lab-safe)] hover:underline" href="/signin">
                Sign in
              </Link>
            </p>
            <Link className="lab-muted hover:underline" href="/reset-password">
              Forgot password?
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs lab-muted">
          No streaks. No gamification. Just clean analytics.
        </p>
      </div>
    </div>
  );
}
