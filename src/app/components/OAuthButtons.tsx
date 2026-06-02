"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const OAUTH_PROVIDERS = [
  { id: "github", label: "GitHub" },
  { id: "google", label: "Google" },
] as const;

export function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {OAUTH_PROVIDERS.map((provider) => {
        const isLoading = loadingProvider === provider.id;

        return (
          <button
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-[rgba(56,189,248,0.35)] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            disabled={Boolean(loadingProvider)}
            key={provider.id}
            onClick={() => {
              setLoadingProvider(provider.id);
              void signIn(provider.id, { callbackUrl: "/dashboard" });
            }}
            type="button"
          >
            {isLoading
              ? `Continuing with ${provider.label}...`
              : `Continue with ${provider.label}`}
          </button>
        );
      })}
    </div>
  );
}
