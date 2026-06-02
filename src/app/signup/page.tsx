"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthInput } from "@/app/components/AuthInput";
import { AuthShell } from "@/app/components/AuthShell";
import { OAuthButtons } from "@/app/components/OAuthButtons";

const SIGNUP_ERRORS: Record<string, string> = {
  AccountAlreadyExists: "Account already exists. Please sign in instead.",
  NameRequired: "Name is required.",
};

function SignupInner() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam ? SIGNUP_ERRORS[errorParam] ?? null : null,
  );

  return (
    <AuthShell
      title="Create account"
      description="Continue with Google or GitHub to start tracking training risk."
    >
      <div className="space-y-4">
        <AuthInput
          autoComplete="name"
          id="signup-name"
          label="Name"
          name="name"
          onChange={(event) => {
            setName(event.target.value);
            if (error === "Name is required.") {
              setError(null);
            }
          }}
          placeholder="Your name"
          required
          value={name}
        />

        {error ? (
          <div className="rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm text-white/90">
            <p>{error}</p>
            {errorParam === "AccountAlreadyExists" ? (
              <Link
                className="mt-2 inline-flex text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
                href="/signin"
              >
                Sign in instead
              </Link>
            ) : null}
          </div>
        ) : null}

        <OAuthButtons mode="signup" onValidationError={setError} signupName={name} />
      </div>

      <p className="text-center text-sm text-white/65">
        Already have an account?{" "}
        <Link
          className="text-[rgba(56,189,248,0.9)] transition hover:text-[rgba(56,189,248,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
          href="/signin"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Create account"
          description="Continue with Google or GitHub to start tracking training risk."
        >
          <p className="text-sm text-white/70">Loading...</p>
        </AuthShell>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
