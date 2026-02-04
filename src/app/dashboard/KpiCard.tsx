import React from "react";

import { LabCard } from "./components/LabCard";
import { StatusChip } from "./components/StatusChip";

type Tone = "safe" | "watch" | "danger" | "neutral";

function microToneClass(tone: Tone) {
  if (tone === "safe") return "text-[rgba(34,197,94,0.85)]";
  if (tone === "watch") return "text-[rgba(245,158,11,0.88)]";
  if (tone === "danger") return "text-[rgba(239,68,68,0.88)]";
  return "text-[rgba(230,232,238,0.65)]";
}

export function KpiCard(props: {
  title: string;
  value: string;
  badge?: string;
  badgeTone?: Tone;
  subline?: string;
  micro?: string;
  microTone?: Tone;
  progress?: number; // 0..100
}) {
  const badge = props.badge ?? "";
  const badgeTone = props.badgeTone ?? "neutral";
  const microToneValue = props.microTone ?? "neutral";
  const p = Math.max(0, Math.min(100, props.progress ?? 0));

  const microClass = microToneClass(microToneValue);

  return (
    <LabCard className="rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">{props.title}</div>
          <div className="mt-2 text-3xl font-semibold lab-num">{props.value}</div>
        </div>

        {badge ? (
          <StatusChip label={badge} tone={badgeTone} />
        ) : null}
      </div>

      {props.subline ? <div className="mt-2 text-sm lab-muted">{props.subline}</div> : null}

      {/* Load bar */}
      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full origin-left rounded-full bg-[rgba(230,232,238,0.18)]"
            style={{
              width: `${p}%`,
              animation: "lab-bar-fill 420ms ease-out",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset",
            }}
          />
        </div>
      </div>

      {props.micro ? (
        <div className={`mt-3 text-xs ${microClass}`}>{props.micro}</div>
      ) : null}
    </LabCard>
  );
}
