// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <section className="relative">
        <div className="hero-card lab-card rounded-[28px] p-8 md:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-6 flex items-center justify-center">
              <div className="logo-wrap relative">
                <Image
                  src="/brand/gym-risk-logo.png"
                  alt="gym-risk"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              Train harder without guessing your injury risk.
            </h1>

            {/* Subtext */}
            <p className="hero-sub mt-4">
              Log sets, track load trends, and get clear signals before pain becomes a setback.
            </p>

            {/* System message */}
            <div className="system-line mt-6">
              <span className="system-dot" aria-hidden="true" />
              <span>System:</span>
              <span className="system-msg">No recent training load detected.</span>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup" className="btn-primary">
                Create account
              </Link>
              <Link href="/signin" className="btn-secondary">
                Sign in
              </Link>
            </div>
          </div>

          {/* subtle divider to reduce “empty void” */}
          <div className="mt-10 lab-divider opacity-60" />

          {/* Alive mini-panels */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Session flow</div>
                <span className="status-chip">
                  <span className="dot dot-idle lab-pulse-dot" />
                  Idle
                </span>
              </div>
              <div className="mt-2 text-sm lab-muted">
                A guided pipeline for what to do next.
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[24%] rounded-full bg-[rgba(34,197,94,0.30)]" />
              </div>
              <div className="mt-2 text-xs lab-muted">live indicator (placeholder)</div>
            </div>

            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Muscle heatmap</div>
                <span className="status-chip">
                  <span className="dot dot-watch" />
                  2 elevated
                </span>
              </div>
              <div className="mt-2 text-sm lab-muted">
                Spot hot zones and trend changes fast.
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[62%] rounded-full bg-[rgba(245,158,11,0.35)]" />
              </div>
              <div className="mt-2 text-xs lab-muted">subtle bar indicator</div>
            </div>

            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Risk feed</div>
                <span className="status-chip">
                  <span className="dot dot-neutral" />
                  Last spike: 3d
                </span>
              </div>
              <div className="mt-2 text-sm lab-muted">
                Events that explain why risk spiked.
              </div>

              {/* faint animated signal line */}
              <div className="mt-4 h-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <div className="signal-line" />
              </div>

              <div className="mt-2 text-xs lab-muted">
                faint signal line indicates activity
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
