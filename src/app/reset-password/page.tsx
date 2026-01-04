"use client";

import Link from "next/link";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").toLowerCase().trim();

    try {
      await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setDone(true);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="lab-card rounded-3xl p-6 md:p-7">
          <div className="mb-5 space-y-2">
            <div className="text-xs uppercase tracking-wide lab-muted">Reset password</div>
            <h1 className="text-2xl font-semibold tracking-tight">Get a reset link</h1>
            <p className="text-sm lab-muted">
              Enter your email. If it exists, we’ll email you a reset link.
            </p>
          </div>

          {done ? (
            <div className="space-y-3">
              <p className="text-sm lab-muted">
                If that email exists, we sent a password reset link. Check your inbox (and spam).
              </p>

              <Link className="lab-muted hover:underline text-sm" href="/signin">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
                name="email"
                placeholder="Your email"
                type="email"
                required
                autoComplete="email"
              />

              <button
                className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] p-3 text-sm font-medium text-black disabled:opacity-60"
                disabled={loading}
                type="submit"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.10)",
                }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-5 text-sm lab-muted">
            Remembered it?{" "}
            <Link className="text-[var(--lab-safe)] hover:underline" href="/signin">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
