import React from "react";

import { MetricCard } from "./components/MetricCard";
import { StatusChip } from "./components/StatusChip";

type RiskState = "Stable" | "Monitor" | "High";

export function LoadPanel({
  weeklyLoad,
  baseline7d,
  wowPct,
  ratio,
  riskState,
  driver,
  trend,
  baselinePending,
}: {
  weeklyLoad: number;
  baseline7d: number;
  wowPct: number;
  ratio: number;
  riskState: RiskState;
  driver: string;
  trend: number[];
  baselinePending: boolean;
}) {
  const tone = riskState === "High" ? "danger" : riskState === "Monitor" ? "watch" : "safe";

  const points = trend.length > 1
    ? trend
        .map((value, index) => {
          const max = Math.max(...trend, 1);
          const min = Math.min(...trend, 0);
          const x = (index / (trend.length - 1)) * 100;
          const y = 100 - ((value - min) / Math.max(max - min, 1)) * 100;
          return `${x},${y}`;
        })
        .join(" ")
    : "0,50 100,50";

  return (
    <MetricCard
      title="Load analytics"
      subtitle="Real session load from logged sets (weight × reps, RPE-adjusted when present)."
      actions={<StatusChip label={riskState} tone={tone} />}
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <StatusChip label={`Weekly Load: ${Math.round(weeklyLoad).toLocaleString()}`} tone="neutral" showDot={false} className="lab-num text-[rgba(230,232,238,0.92)]" />
        <StatusChip label={baselinePending ? "Baseline: pending" : `Baseline: ${Math.round(baseline7d).toLocaleString()}`} tone="neutral" showDot={false} className="lab-num text-[rgba(230,232,238,0.92)]" />
        <StatusChip label={`WoW: ${wowPct >= 0 ? "+" : ""}${wowPct.toFixed(1)}%`} tone={tone} showDot={false} className="text-[rgba(230,232,238,0.92)]" />
        <StatusChip label={`A:C Ratio: ${ratio.toFixed(2)}`} tone={tone} showDot={false} className="text-[rgba(230,232,238,0.92)]" />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
        <div className="flex items-center justify-between text-xs lab-muted">
          <span>Recent 8 sessions</span>
          <span>{driver}</span>
        </div>

        <svg viewBox="0 0 100 100" className="mt-3 h-28 w-full rounded-xl bg-[rgba(255,255,255,0.02)] p-2" preserveAspectRatio="none" role="img" aria-label="Session load trend">
          <polyline fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" points="0,50 100,50" />
          <polyline fill="none" stroke={tone === "danger" ? "var(--lab-danger)" : tone === "watch" ? "var(--lab-watch)" : "var(--lab-safe)"} strokeWidth="2.5" points={points} />
        </svg>
      </div>

      {baselinePending ? (
        <div className="mt-3 text-xs lab-muted">Need 2+ weeks of sessions to compute baseline.</div>
      ) : null}
    </MetricCard>
  );
}
