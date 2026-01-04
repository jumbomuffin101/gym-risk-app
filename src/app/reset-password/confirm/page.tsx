"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordConfirmPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => sp.get("token") ?? "", [sp]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) return setMsg("Missing token. Use the link from your email.");
    if (pw1.length < 8) return setMsg("Password must be at least 8 characters.");
    if (pw1 !== pw2) return setMsg("Passwords do not match.");

    setLoading(true);
    const res = await fetch("/api/auth/reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword: pw1 }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !data?.ok) {
      setMsg(data?.reason ?? data?.error ?? "Reset failed. Try again.");
      return;
    }

    setMsg("Password updated. Redirecting to sign in…");
    setTimeout(() => router.push("/signin"), 900);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="lab-card rounded-3xl p-6 md:p-7">
          <div className="mb-5 space-y-2">
            <div className="text-xs uppercase tracking-wide lab-muted">Reset password</div>
            <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="text-sm lab-muted">
              Choose a strong password. This link expires soon.
            </p>
          </div>

          {!token && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
              Missing token. Go back and request a new reset link.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
              placeholder="New password"
              type="password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
              placeholder="Confirm new password"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
            />

            {msg && <div className="text-sm text-white/70">{msg}</div>}

            <button
              className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] p-3 text-sm font-medium text-black disabled:opacity-60"
              disabled={loading}
              type="submit"
              style={{
                boxShadow:
                  "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.10)",
              }}
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>

          <p className="mt-5 text-sm lab-muted">
            <Link className="text-[var(--lab-safe)] hover:underline" href="/signin">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
