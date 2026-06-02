"use client";

import Link from "next/link";
import { AuthShell } from "@/app/components/AuthShell";
import { OAuthButtons } from "@/app/components/OAuthButtons";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create account"
      description="Continue with Google or GitHub to start tracking training risk."
    >
      <OAuthButtons />

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
