import React from "react";

export function LoadPanel({
  today,
  baseline,
  deltaPct,
  active,
}: {
  today: number;
  baseline: number;
  deltaPct: number;
  active: boolean;
}) {
  const tone =
    deltaPct >= 20 ? "danger" : deltaPct >= 12 ? "watch" : "safe";

  const color =
    tone === "danger"
      ? "var(--lab-danger)"
      : tone === "watch"
      ? "var(--lab-watch)"
      : "var(--lab-safe)";

  return (
    <div className="lab-card lab-hover rounded-2xl p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">
            Load analytics
          </div>
          <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">
            Rolling 7-day load vs baseline with spike detection.
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 lab-muted">
              Today: <span className="lab-num text-[rgba(230,232,238,0.92)]">{today.toLocaleString()}</span>
            </span>
            <span className="rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 lab-muted">
              Baseline: <span className="lab-num text-[rgba(230,232,238,0.92)]">{baseline.toLocaleString()}</span>
            </span>
            <span
              className="rounded-full border px-3 py-1"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                color,
              }}
            >
              {deltaPct >= 0 ? "+" : ""}
              {deltaPct}% vs baseline
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs lab-muted">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 18px ${color}`,
              opacity: active ? 0.9 : 0.5,
            }}
          />
          {tone === "danger"
            ? "Spike flagged"
            : tone === "watch"
            ? "Watch zone"
            : "Stable trend"}
        </div>
      </div>

      {/* Minimal chart placeholder that still feels analytical */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)]">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs lab-muted">
            <span>7-day rolling</span>
            <span className="lab-num">baseline + trend</span>
          </div>

          <div className="mt-3 h-36 rounded-xl bg-[rgba(255,255,255,0.02)]">
            <div className="relative h-full w-full">
              <div className="absolute inset-0 opacity-[0.35]">
                <div className="h-full w-full lab-gridline opacity-[0.30]" />
              </div>

              {/* “glowing line” vibe */}
              <div
                className="absolute left-4 top-[56%] h-0.5 w-[78%]"
                style={{
                  background: "rgba(230,232,238,0.16)",
                }}
              />
              <div
                className="absolute left-4 top-[48%] h-0.5 w-[70%]"
                style={{
                  background: color,
                  boxShadow: `0 0 20px ${color}`,
                  opacity: 0.75,
                }}
              />

              <div className="absolute bottom-3 left-4 text-xs lab-muted">
                {tone === "danger"
                  ? "Spike detected (+threshold)"
                  : tone === "watch"
                  ? "Approaching threshold"
                  : "Within baseline range"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs lab-muted">
        Charts will be wired to your real session/set data next — this panel is the dashboard shell.
      </div>
    </div>
  );
}
