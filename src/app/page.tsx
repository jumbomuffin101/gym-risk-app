"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { KpiCard } from "./dashboard/KpiCard";
import { RiskMeter } from "./dashboard/RiskMeter";

const metricDefinitions = [
  {
    label: "Acute Load (7d)",
    definition: "Σ session load over last 7 days (AU).",
  },
  {
    label: "Chronic Load (28d)",
    definition: "28-day rolling baseline (AU).",
  },
  {
    label: "Load Ratio",
    definition: "Acute / Chronic.",
  },
  {
    label: "Risk Index",
    definition: "f(ratio, trend, thresholds).",
  },
];

const systemModelItems = [
  "7-day acute load calculation",
  "28-day chronic baseline modeling",
  "Threshold-based signal detection",
  "Structured session data schema",
];

export default function WelcomePage() {
  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const primaryHref = isAuthed ? "/dashboard" : "/signin";
  const workspaceHref = isAuthed ? "/dashboard" : "/signin";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16">
      <section className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="space-y-6 lg:pr-4">
          <div className="inline-flex rounded-full border border-[var(--lab-safe-28)] bg-[var(--lab-safe-10)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/85">
            Gym-Risk Engine
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white md:text-5xl md:leading-tight">
              Training Load Analytics and Risk Modeling
            </h1>
            <p className="max-w-2xl text-base text-white/70 md:text-lg">
              Rolling 7-day and 28-day workload tracking with deterministic signal generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href={primaryHref}
              className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--lab-safe)] bg-[var(--lab-safe)] px-5 text-sm font-semibold text-black transition hover:brightness-105"
            >
              Start analysis
            </Link>
            <Link href={workspaceHref} className="text-sm font-medium text-white/70 transition hover:text-white">
              Open existing workspace
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-full [&>*]:h-full">
              <KpiCard
                title="Weekly Load"
                value="462"
                badge="Status: Stable"
                badgeTone="safe"
                subline="Total session load, last 7 days"
                micro="+3.9% vs prior 7d"
                microTone="safe"
                progress={64}
              />
            </div>
            <div className="h-full [&>*]:h-full">
              <KpiCard
                title="Acute:Chronic"
                value="1.18"
                badge="Threshold: Monitor"
                badgeTone="watch"
                subline="7d load / 28d baseline"
                micro="Monitor threshold at 1.30"
                microTone="watch"
                progress={58}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="lab-card flex h-full flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide lab-muted">Load Analytics</div>
                  <div className="mt-1 text-lg font-semibold text-white/90">Rolling Trend</div>
                </div>
                <span className="inline-flex items-center rounded-full border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] px-3 py-1 text-xs font-medium text-[rgba(230,232,238,0.92)]">
                  Model: Rolling
                </span>
              </div>

              <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
                <div className="mb-2 flex items-center justify-between text-xs lab-muted">
                  <span>7-day window</span>
                  <span className="lab-num">baseline + deviation</span>
                </div>
                <svg viewBox="0 0 220 100" className="h-28 w-full">
                  <path d="M0 82 H220" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <path d="M0 60 H220" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <path d="M10 72 C45 68, 72 64, 105 57 C136 50, 168 44, 210 35" fill="none" stroke="rgba(34,197,94,0.8)" strokeWidth="2.5" />
                  <path d="M10 78 C45 75, 72 73, 105 70 C136 68, 168 64, 210 60" fill="none" stroke="rgba(230,232,238,0.45)" strokeWidth="1.8" />
                </svg>
              </div>

              <p className="mt-3 text-xs lab-muted">Preview computed from sample session set.</p>
            </article>

            <article className="lab-card flex h-full flex-col rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide lab-muted">Risk Index</div>
                <span className="inline-flex items-center rounded-full border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] px-3 py-1 text-xs font-medium text-[rgba(230,232,238,0.92)]">
                  State: Moderate
                </span>
              </div>
              <div className="mt-4 flex-1">
                <RiskMeter score={63} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-white/10 py-12 md:grid-cols-2 md:items-start">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">System Model</h2>
          <p className="max-w-md text-sm text-white/70">
            Deterministic computation pipeline over structured training events, with fixed rolling windows and threshold
            state transitions.
          </p>
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
