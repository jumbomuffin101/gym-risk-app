import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-[460px] space-y-6">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70 transition hover:text-[rgba(56,189,248,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)]"
        >
          Gym-Risk
        </Link>

        <div className="lab-card rounded-[24px] border border-white/10 bg-[rgba(15,21,32,0.7)] p-6 shadow-[0_18px_40px_rgba(8,12,20,0.55)] sm:p-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white/95">{title}</h1>
            <p className="text-sm text-white/65">{description}</p>
          </div>
          <div className="mt-6 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
