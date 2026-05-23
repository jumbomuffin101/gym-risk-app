"use client";

import Link from "next/link";
import { useState } from "react";

type Notice = {
  kind: "success" | "error";
  message: string;
};

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);
    setSent(false);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").toLowerCase().trim();

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (res.ok && data.success) {
        setNotice({
          kind: "success",
          message: data.message ?? "Reset email sent. Check your inbox and spam folder.",
        });
        setSent(true);
        return;
      }

      setNotice({
        kind: "error",
        message: data.message ?? "We couldn't send the reset email. Please try again.",
      });
    } catch {
      setNotice({
        kind: "error",
        message: "We couldn't send the reset email. Please try again.",
      });
    } finally {
      setLoading(false);
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
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          {notice && (
            <div
              className={`mb-4 rounded-xl border p-3 text-sm ${
                notice.kind === "success"
                  ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)] text-[rgba(220,252,231,0.95)]"
                  : "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] text-[rgba(254,226,226,0.95)]"
              }`}
            >
              {notice.message}
            </div>
          )}

          {sent ? (
            <div className="space-y-3">
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
