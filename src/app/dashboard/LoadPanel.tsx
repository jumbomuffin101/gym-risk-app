import React from "react";

import { MetricCard } from "./components/MetricCard";
import { StatusChip } from "./components/StatusChip";

export function LoadPanel({
  recentLoad,
  baseline,
  deltaPct,
  baselineReady,
  baselineLabel,
}: {
  recentLoad: number;
  baseline: number | null;
  deltaPct: number | null;
  baselineReady: boolean;
  baselineLabel: string;
}) {
  const tone =
    !baselineReady || baseline === null || deltaPct === null
      ? "neutral"
      : deltaPct >= 20
      ? "danger"
      : deltaPct >= 12
      ? "watch"
      : "safe";

  const color =
    tone === "danger"
      ? "var(--lab-danger)"
      : tone === "watch"
      ? "var(--lab-watch)"
      : tone === "neutral"
      ? "rgba(230,232,238,0.38)"
      : "var(--lab-safe)";
  const activityOpacity = baselineReady && baseline !== null ? 0.75 : 0.5;

  return (
    <MetricCard
      title="Overall recent training load"
      subtitle="Seven-day logged workout load compared with your workload baseline."
      actions={
        <StatusChip
          label={
            !baselineReady
              ? "Baseline pending"
              : baseline === null
              ? baselineLabel
              : baselineLabel === "Provisional baseline" && deltaPct === null
              ? baselineLabel
              : tone === "danger"
              ? "Spike"
              : tone === "watch"
              ? "Monitor"
              : "Stable"
          }
          tone={tone}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs lab-muted">7-day load</div>
          <div className="mt-1 text-2xl font-semibold lab-num text-white/90">
            {Math.round(recentLoad).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs lab-muted">Baseline</div>
          <div className="mt-1 text-2xl font-semibold lab-num text-white/90">
            {baselineReady && baseline !== null ? Math.round(baseline).toLocaleString() : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs lab-muted">Change</div>
          <div className="mt-1 text-2xl font-semibold lab-num text-white/90">
            {baselineReady && baseline !== null && deltaPct !== null ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}%` : "-"}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center justify-between text-xs lab-muted">
          <span>Load trend</span>
          <span className="lab-num">Saved workouts</span>
        </div>

        <svg viewBox="0 0 260 80" className="mt-4 h-24 w-full" aria-hidden="true">
          <path d="M8 58H252" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
          <path
            d="M10 54C38 50 55 42 80 44C110 47 124 31 151 34C181 37 192 25 218 23C234 22 244 24 252 20"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeWidth="3"
            opacity={activityOpacity}
          />
        </svg>

        <div className="text-xs lab-muted">
          {!baselineReady
            ? "Log 3 workouts to start a baseline."
            : baseline === null
            ? "Saved workouts exist, but no weighted load has been recorded yet."
            : baselineLabel === "Provisional baseline"
            ? "Using a provisional baseline from available workout history."
            : tone === "danger"
            ? "Recent load is materially above baseline."
            : tone === "watch"
            ? "Recent load is above baseline."
            : "Recent load is within baseline range."}
        </div>
      </div>
    </MetricCard>
  );
}
