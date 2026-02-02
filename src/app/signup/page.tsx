"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/app/components/AuthShell";
import { AuthInput } from "@/app/components/AuthInput";

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
    <AuthShell title="Create account" description="Set up your profile to start tracking risk.">
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          autoComplete="name"
          id="signup-name"
          label="Name (optional)"
          name="name"
          placeholder="Your name"
        />
        <AuthInput
          autoComplete="email"
          id="signup-email"
          label="Email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <AuthInput
          autoComplete="new-password"
          id="signup-password"
          label="Password"
          name="password"
          placeholder="At least 8 characters"
          required
          type="password"
        />

        {error ? (
          <p className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm text-white/90">
            {error}
          </p>
        ) : null}

        <button
          className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_18px_55px_rgba(34,197,94,0.12)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-white/70">
        <p>
          Already have an account?{" "}
          <Link
            className="text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)]"
            href="/signin"
          >
            Sign in
          </Link>
        </p>
        <Link
          className="transition hover:text-[rgba(56,189,248,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)]"
          href="/reset-password"
        >
          Forgot password?
        </Link>
      </div>
    </AuthShell>
  );
}
