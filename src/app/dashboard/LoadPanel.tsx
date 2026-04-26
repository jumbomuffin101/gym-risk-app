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
  const trendData = trend.slice(-8);
  const hasTrend = trendData.some((value) => value > 0);
  const chartHeight = 100;
  const chartWidth = 100;
  const max = hasTrend ? Math.max(...trendData, 1) : 1;
  const min = hasTrend ? Math.min(...trendData) : 0;
  const spread = Math.max(max - min, max * 0.12, 1);
  const paddedMin = Math.max(0, min - spread * 0.2);
  const paddedMax = max + spread * 0.2;
  const baselineLow = baseline7d * 0.9;
  const baselineHigh = baseline7d * 1.1;

  function yFor(value: number) {
    return chartHeight - ((value - paddedMin) / Math.max(paddedMax - paddedMin, 1)) * chartHeight;
  }

  const points = hasTrend
    ? trendData.map((value, index) => {
        const x = trendData.length === 1 ? chartWidth / 2 : (index / (trendData.length - 1)) * chartWidth;
        return { x, y: yFor(value) };
      })
    : [];

  const linePath =
    points.length > 0
      ? points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
      : "";
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
      : "";
  const bandTop = yFor(baselineHigh);
  const bandBottom = yFor(baselineLow);

  return (
    <MetricCard
      title="Load analytics"
      subtitle="Real session load from logged sets (weight x reps, RPE-adjusted when present)."
      actions={<StatusChip label={riskState} tone={tone} />}
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <StatusChip
          label={`Weekly Load: ${Math.round(weeklyLoad).toLocaleString()}`}
          tone="neutral"
          showDot={false}
          className="lab-num text-[rgba(230,232,238,0.92)]"
        />
        <StatusChip
          label={baselinePending ? "Baseline: pending" : `Baseline: ${Math.round(baseline7d).toLocaleString()}`}
          tone="neutral"
          showDot={false}
          className="lab-num text-[rgba(230,232,238,0.92)]"
        />
        <StatusChip
          label={`WoW: ${wowPct >= 0 ? "+" : ""}${wowPct.toFixed(1)}%`}
          tone={tone}
          showDot={false}
          className="text-[rgba(230,232,238,0.92)]"
        />
        <StatusChip
          label={`A:C Ratio: ${ratio.toFixed(2)}`}
          tone={tone}
          showDot={false}
          className="text-[rgba(230,232,238,0.92)]"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
        <div className="flex items-center justify-between text-xs lab-muted">
          <span>Recent 8 sessions</span>
          <span>{driver}</span>
        </div>

        {hasTrend ? (
          <svg
            viewBox="0 0 100 100"
            className="mt-3 h-28 w-full rounded-xl bg-[rgba(255,255,255,0.02)] p-2"
            preserveAspectRatio="none"
            role="img"
            aria-label="Session load trend"
          >
            <rect
              x="0"
              y={Math.min(bandTop, bandBottom)}
              width="100"
              height={Math.abs(bandBottom - bandTop)}
              fill="rgba(34,197,94,0.08)"
            />
            <path d={areaPath} fill="rgba(34,197,94,0.14)" />
            <path
              d={linePath}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="0"
              y1={yFor(baseline7d)}
              x2="100"
              y2={yFor(baseline7d)}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.25"
              strokeDasharray="4 4"
            />
          </svg>
        ) : (
          <div className="mt-3 flex h-28 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.02)] px-4 text-sm text-white/65">
            Log workouts to see your load trend
          </div>
        )}
      </div>

      {baselinePending ? (
        <div className="mt-3 text-xs lab-muted">Need 2+ weeks of sessions to compute baseline.</div>
      ) : null}
    </MetricCard>
  );
}
