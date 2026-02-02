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
          className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70 transition hover:text-[rgba(56,189,248,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(56,189,248,0.35)] motion-reduce:transition-none"
        >
          Gym-Risk
        </Link>

        <div className="lab-card relative overflow-hidden rounded-[24px] border border-white/12 bg-[rgba(12,16,24,0.86)] p-6 shadow-[0_20px_45px_rgba(8,12,20,0.65)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,_rgba(56,189,248,0.12)_0,_transparent_45%,_rgba(255,255,255,0.04)_100%)] opacity-60" />
          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[rgba(230,232,238,0.75)]">
                Performance analytics
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">Lab</span>
            </div>
            <div className="h-px w-full bg-[linear-gradient(90deg,_rgba(56,189,248,0.0),_rgba(56,189,248,0.7),_rgba(56,189,248,0.0))]" />
            <div className="space-y-2">
              <h1 className="text-[1.9rem] font-semibold tracking-[-0.045em] text-[var(--lab-headline)]">
                {title}
              </h1>
              <p className="text-sm text-white/60">{description}</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
