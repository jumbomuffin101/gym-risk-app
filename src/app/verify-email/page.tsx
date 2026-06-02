"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/app/components/AuthShell";

type VerificationState = {
  kind: "loading" | "success" | "error";
  message: string;
};

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const submittedRef = useRef(false);
  const [state, setState] = useState<VerificationState>(() =>
    token
      ? { kind: "loading", message: "Verifying your email..." }
      : { kind: "error", message: "Verification link is invalid or expired." },
  );

  useEffect(() => {
    if (!token || submittedRef.current) {
      return;
    }

    submittedRef.current = true;

    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
        };

        if (response.ok && data.ok) {
          setState({
            kind: "success",
            message: data.message ?? "Email verified. Your account has been created.",
          });
          return;
        }

        setState({
          kind: "error",
          message: data.message ?? "Verification link is invalid or expired.",
        });
      } catch {
        setState({
          kind: "error",
          message: "We couldn't verify your email. Please try again.",
        });
      }
    }

    void verifyEmail();
  }, [token]);

  return (
    <AuthShell title="Verify email" description="Finish creating your Gym-Risk account.">
      <div
        className={`rounded-xl border px-3 py-3 text-sm ${
          state.kind === "success"
            ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.08)] text-[rgba(220,252,231,0.95)]"
            : state.kind === "error"
              ? "border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] text-[rgba(254,226,226,0.95)]"
              : "border-white/10 bg-white/[0.03] text-white/75"
        }`}
      >
        {state.message}
      </div>

      {state.kind === "success" ? (
        <Link
          className="lab-hover block w-full rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2.5 text-center text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(34,197,94,0.25),0_22px_55px_rgba(34,197,94,0.2)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(34,197,94,0.35)] motion-reduce:transition-none"
          href="/signin"
        >
          Sign in
        </Link>
      ) : (
        <Link
          className="block text-sm text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
          href="/signup"
        >
          Create a new account
        </Link>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Verify email" description="Finish creating your Gym-Risk account.">
          <p className="text-sm text-white/70">Loading verification link...</p>
        </AuthShell>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
