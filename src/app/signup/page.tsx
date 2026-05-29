"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/app/components/AuthShell";
import { AuthInput } from "@/app/components/AuthInput";

type Notice = {
  kind: "success" | "error";
  message: string;
  subtext?: string;
};

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "").toLowerCase().trim();
    const password = String(form.get("password") ?? "");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setNotice({
          kind: "error",
          message: data.message ?? data.error ?? "Signup failed.",
        });
        setPendingEmail(null);
        return;
      }

      setNotice({
        kind: "success",
        message: data.message ?? "Check your email to verify your account.",
        subtext: "Your account will be created after you click the verification link.",
      });
      setPendingEmail(email);
    } catch {
      setNotice({
        kind: "error",
        message: "Signup failed. Please try again.",
      });
      setPendingEmail(null);
    } finally {
      setLoading(false);
    }
  }

  async function onResendVerification() {
    if (!pendingEmail) {
      return;
    }

    setResending(true);
    setNotice(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      setNotice({
        kind: res.ok && data.ok ? "success" : "error",
        message: data.message ?? "We couldn't send the verification email. Please try again.",
        subtext:
          res.ok && data.ok
            ? "Your account will be created after you click the verification link."
            : undefined,
      });
    } catch {
      setNotice({
        kind: "error",
        message: "We couldn't send the verification email. Please try again.",
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Create account" description="Start tracking training risk.">
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

        {notice ? (
          <div
            className={`rounded-xl border px-3 py-2 text-sm text-white/90 ${
              notice.kind === "success"
                ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)]"
                : "border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)]"
            }`}
          >
            <p>{notice.message}</p>
            {notice.subtext ? <p className="mt-1 text-white/65">{notice.subtext}</p> : null}
          </div>
        ) : null}

        <button
          className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_22px_55px_rgba(34,197,94,0.2)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.35)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          disabled={loading}
          type="submit"
        >
          {loading ? "Sending verification..." : "Create account"}
        </button>

        {pendingEmail ? (
          <button
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:border-[rgba(56,189,248,0.35)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            disabled={resending}
            onClick={onResendVerification}
            type="button"
          >
            {resending ? "Resending..." : "Resend verification email"}
          </button>
        ) : null}
      </form>

      <div className="flex items-center justify-between text-sm text-white/65">
        <p>
          Already have an account?{" "}
          <Link
            className="text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
            href="/signin"
          >
            Sign in
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
