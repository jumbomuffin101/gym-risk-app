"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Notice = {
  kind: "success" | "error";
  message: string;
};

function ResetPasswordConfirmInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!token) {
      setNotice({ kind: "error", message: "Reset link is invalid or expired." });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ kind: "error", message: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ kind: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword, confirmPassword }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (response.ok && data.success) {
        setNotice({
          kind: "success",
          message: data.message ?? "Password updated successfully.",
        });
        setSucceeded(true);
        return;
      }

      setNotice({
        kind: "error",
        message: data.message ?? "Unable to complete password reset. Please try again.",
      });
    } catch {
      setNotice({
        kind: "error",
        message: "Unable to complete password reset. Please try again.",
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
            <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="text-sm lab-muted">Choose a strong password. This link expires soon.</p>
          </div>

          {!token && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
              Reset link is invalid or expired.
            </div>
          )}

          {notice && (
            <div
              className={`mt-4 rounded-xl border p-3 text-sm ${
                notice.kind === "success"
                  ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)] text-[rgba(220,252,231,0.95)]"
                  : "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] text-[rgba(254,226,226,0.95)]"
              }`}
            >
              {notice.message}
            </div>
          )}

          {succeeded ? (
            <p className="mt-5 text-sm">
              <Link className="text-[var(--lab-safe)] hover:underline" href="/signin">
                Sign in with your new password
              </Link>
            </p>
          ) : (
            <>
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <input
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
                  placeholder="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <input
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(15,21,32,0.55)] p-3 text-sm outline-none placeholder:text-[rgba(230,232,238,0.45)] focus:border-[rgba(34,197,94,0.35)]"
                  placeholder="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  className="lab-hover w-full rounded-xl bg-[rgba(34,197,94,0.92)] p-3 text-sm font-medium text-black disabled:opacity-60"
                  disabled={loading || !token}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="lab-card rounded-3xl p-6 md:p-7">
              <div className="text-sm lab-muted">Loading reset link...</div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordConfirmInner />
    </Suspense>
  );
}
