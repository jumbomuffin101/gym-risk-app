"use client";

import Link from "next/link";
import React from "react";

type Step = 1 | 2 | 3;

function StepPill({
  label,
  state,
}: {
  label: string;
  state: "active" | "done" | "next" | "locked";
}) {
  const base = "flex items-center justify-between gap-3 rounded-xl border px-4 py-3";

  const styles =
    state === "active"
      ? "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.07)]"
      : state === "done"
      ? "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)]"
      : state === "locked"
      ? "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] opacity-70"
      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]";

  const hint =
    state === "active" ? "Current stage" : state === "done" ? "Completed" : state === "locked" ? "Locked" : "Next";

  const dot =
    state === "active"
      ? "var(--lab-safe)"
      : state === "done"
      ? "rgba(230,232,238,0.35)"
      : "rgba(230,232,238,0.22)";

  return (
    <div className={`${base} ${styles}`}>
      <div className="min-w-0">
        <div className="text-sm text-[rgba(230,232,238,0.92)]">{label}</div>
        <div className="mt-1 text-xs lab-muted">{hint}</div>
      </div>
      <div className="h-2 w-2 rounded-full" style={{ background: dot }} />
    </div>
  );
}

export function SessionStepper({ active }: { active: boolean }) {
  // This is intentionally only 1 or 2 for now, until you have a real "review" state.
  const current: Step = active ? 2 : 1;

  return (
    <div className="lab-card lab-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Session flow</div>
          <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">
            A guided pipeline that highlights what matters now.
          </div>
        </div>

        <Link
          className="rounded-lg border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs lab-muted hover:bg-[rgba(255,255,255,0.05)]"
          href="/workouts"
        >
          Open workouts
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <StepPill
          label="Start session"
          state={current === 1 ? "active" : "done"}
        />
        <StepPill
          label="Log sets"
          state={current === 2 ? "active" : "next"}
        />

        {/* Risk review shown, but locked until you add a real "review" step state */}
        <StepPill
          label="Risk review"
          state="locked"
        />
      </div>

      <div className="mt-4 text-xs lab-muted">
        {active ? (
          <>Active session detected — logging sets will update risk signals live.</>
        ) : (
          <>Start a session to enable live risk tracking and heatmap updates.</>
        )}
      </div>
    </div>
  );
}
