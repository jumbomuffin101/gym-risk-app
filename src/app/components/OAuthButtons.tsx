"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn, type ClientSafeProvider } from "next-auth/react";

const OAUTH_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
};

type OAuthButtonsProps = {
  callbackUrl?: string;
};

export function OAuthButtons({ callbackUrl = "/dashboard" }: OAuthButtonsProps) {
  const [providers, setProviders] = useState<ClientSafeProvider[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getProviders().then((providerMap) => {
      if (!active) {
        return;
      }

      const oauthProviders = Object.values(providerMap ?? {}).filter(
        (provider) => provider.type === "oauth" && provider.id in OAUTH_LABELS,
      );

      setProviders(oauthProviders);
    });

    return () => {
      active = false;
    };
  }, []);

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => {
        const label = OAUTH_LABELS[provider.id] ?? provider.name;
        const isLoading = loadingProvider === provider.id;

        return (
          <button
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-[rgba(56,189,248,0.35)] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            disabled={Boolean(loadingProvider)}
            key={provider.id}
            onClick={() => {
              setLoadingProvider(provider.id);
              void signIn(provider.id, { callbackUrl });
            }}
            type="button"
          >
            {isLoading ? `Continuing with ${label}...` : `Continue with ${label}`}
          </button>
        );
      })}
    </div>
  );
}
