import Image from "next/image";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 md:px-8 md:py-8">
      <header className="flex items-center">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white/90">
          <Image
            src="/brand/gym-risk-icon-v2.svg"
            alt="Gym-Risk logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          Gym-Risk
        </Link>
      </header>

      <section className="grid flex-1 items-center gap-10 py-14 md:grid-cols-[minmax(0,1fr)_360px] md:py-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-[var(--lab-safe)]">Training load tracker for lifters</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-white/95 md:text-6xl">
            Track training load before fatigue becomes a setback.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
            Gym-Risk turns sets, weight, RPE, and pain notes into simple workload and risk signals.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Start tracking
            </Link>
            <Link href="/signin" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>

        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-white/45">This week</p>
              <h2 className="mt-1 text-lg font-semibold text-white/90">Load signals</h2>
            </div>
            <span className="rounded-full border border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.10)] px-3 py-1 text-xs font-medium text-[var(--lab-safe)]">
              Manageable
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-white/50">Weekly load</p>
                <p className="mt-1 text-3xl font-semibold text-white/92">415</p>
              </div>
              <p className="text-sm text-white/55">AU</p>
            </div>

            <div className="flex items-end justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-white/50">Load ratio</p>
                <p className="mt-1 text-3xl font-semibold text-white/92">1.08</p>
              </div>
              <p className="text-sm text-white/55">7d / 28d</p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-white/50">Risk state</p>
                <p className="mt-1 text-3xl font-semibold text-white/92">Moderate</p>
              </div>
              <p className="text-sm text-white/55">Watch load</p>
            </div>
          </div>

          <svg viewBox="0 0 220 64" className="mt-6 h-16 w-full" aria-hidden="true">
            <path d="M4 52H216" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <path
              d="M5 48C25 43 39 37 58 39C82 42 92 26 113 28C135 30 145 20 166 18C185 16 199 20 215 13"
              fill="none"
              stroke="var(--lab-safe)"
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
        </div>
      </section>

      <footer className="flex flex-wrap justify-between gap-2 pb-2 text-xs text-white/35">
        <span>Gym-Risk provides training signals, not medical advice.</span>
        <span>Created by Aryan Rawat</span>
      </footer>
    </main>
  );
}
