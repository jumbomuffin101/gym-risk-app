import Link from "next/link";

import { KpiCard } from "./dashboard/KpiCard";
import { LoadPanel } from "./dashboard/LoadPanel";
import { RiskMeter } from "./dashboard/RiskMeter";

const metricDefinitions = [
  {
    label: "Acute Load (7d)",
    definition: "Summed session load over the last 7 days from structured set entries.",
  },
  {
    label: "Chronic Load (28d)",
    definition: "Rolling 28-day baseline used as the expected workload reference.",
  },
  {
    label: "Load Ratio",
    definition: "Acute Load divided by Chronic Load to quantify short-term load acceleration.",
  },
  {
    label: "Risk Index",
    definition: "Deterministic score derived from load ratio, trend slope, and threshold states.",
  },
];

const systemModelItems = [
  "7-day acute load calculation",
  "28-day chronic baseline modeling",
  "Threshold-based signal detection",
  "Structured session data schema",
];

export default function WelcomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16">
      <section className="grid gap-10 border-b border-white/10 pb-14 md:grid-cols-[1.05fr_0.95fr] md:items-start">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-[var(--lab-safe-28)] bg-[var(--lab-safe-10)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/85">
            Gym-Risk Engine
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
              Training Load Analytics and Risk Modeling
            </h1>
            <p className="max-w-2xl text-base text-white/70 md:text-lg">
              Rolling 7-day and 28-day workload tracking with deterministic signal generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--lab-safe)] bg-[var(--lab-safe)] px-5 text-sm font-semibold text-black transition hover:brightness-105"
            >
              Start analysis
            </Link>
            <Link href="/signin" className="text-sm font-medium text-white/70 transition hover:text-white">
              Open existing workspace
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              title="Weekly Load"
              value="462"
              badge="Stable"
              badgeTone="safe"
              subline="Total session load, last 7 days"
              micro="+3.9% vs prior 7d"
              microTone="safe"
              progress={64}
            />
            <KpiCard
              title="Acute:Chronic"
              value="1.18"
              badge="Watch"
              badgeTone="watch"
              subline="7d load / 28d baseline"
              micro="Threshold warning at 1.30"
              microTone="watch"
              progress={58}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
            <LoadPanel today={462} baseline={391} deltaPct={18} active />
            <div className="lab-card rounded-2xl p-5">
              <div className="text-xs uppercase tracking-wide lab-muted">Risk Index</div>
              <div className="mt-4">
                <RiskMeter score={63} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-white/10 py-12 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold text-white">System Model</h2>
        </div>
        <ul className="space-y-3">
          {systemModelItems.map((item) => (
            <li key={item} className="border-l border-[var(--lab-safe-28)] pl-4 text-sm text-white/80">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-semibold text-white">Metric Definitions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {metricDefinitions.map((metric) => (
            <article key={metric.label} className="lab-card rounded-xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/90">{metric.label}</h3>
              <p className="mt-2 text-sm text-white/70">{metric.definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 pt-12 text-center">
        <p className="text-lg font-medium text-white/90">Start logging sessions and compute your training risk.</p>
      </section>
    </div>
  );
}
