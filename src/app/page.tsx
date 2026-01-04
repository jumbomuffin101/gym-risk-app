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
              <Image
                src="/brand/gym-risk-logo.jpg"
                alt="gym-risk"
                width={520}
                height={200}
                priority
                className="mx-auto h-[56px] w-auto md:h-[64px] opacity-95 object-contain"
              />
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

          {/* Intro tiles */}
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {/* Card 1 */}
            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      📝
                    </span>
                    <div className="text-sm font-semibold text-white/90">
                      Log a session
                    </div>
                  </div>
                  <div className="mt-2 text-sm lab-muted">
                    Track sets, reps, RPE, and pain in under a minute.
                  </div>
                </div>
                <span className="status-chip">
                  <span className="dot dot-idle" />
                  Quick
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                <div className="text-xs text-white/70">Example</div>
                <div className="mt-1 text-xs lab-muted">
                  Bench Press · 185 × 5 · RPE 8 · Pain 0
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      📈
                    </span>
                    <div className="text-sm font-semibold text-white/90">
                      See load trends
                    </div>
                  </div>
                  <div className="mt-2 text-sm lab-muted">
                    We summarize volume & intensity so you don’t have to.
                  </div>
                </div>
                <span className="status-chip">
                  <span className="dot dot-idle" />
                  Clear
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                <div className="text-xs text-white/70">Example</div>
                <div className="mt-1 text-xs lab-muted">
                  7-day load: +14% · Intensity steady · Recovery good
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="lab-card lab-hover rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      🛡️
                    </span>
                    <div className="text-sm font-semibold text-white/90">
                      Get explainable signals
                    </div>
                  </div>
                  <div className="mt-2 text-sm lab-muted">
                    If something spikes, you’ll see exactly why.
                  </div>
                </div>
                <span className="status-chip">
                  <span className="dot dot-idle" />
                  Smart
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                <div className="text-xs text-white/75">Example signal</div>
                <div className="mt-1 text-xs lab-muted">
                  Volume spike in Legs (+62% vs 7-day avg)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
