import React from "react";

type Tone = "safe" | "watch" | "danger" | "neutral";

function toneStyles(tone: Tone) {
  switch (tone) {
    case "safe":
      return {
        chip: "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.10)] text-[rgba(230,232,238,0.92)]",
        dot: "bg-[var(--lab-safe)]",
        micro: "text-[rgba(34,197,94,0.85)]",
      };
    case "watch":
      return {
        chip: "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] text-[rgba(230,232,238,0.92)]",
        dot: "bg-[var(--lab-watch)]",
        micro: "text-[rgba(245,158,11,0.88)]",
      };
    case "danger":
      return {
        chip: "border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.10)] text-[rgba(230,232,238,0.92)]",
        dot: "bg-[var(--lab-danger)]",
        micro: "text-[rgba(239,68,68,0.88)]",
      };
    default:
      return {
        chip: "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[rgba(230,232,238,0.90)]",
        dot: "bg-[rgba(230,232,238,0.35)]",
        micro: "text-[rgba(230,232,238,0.65)]",
      };
  }
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
  const microTone = props.microTone ?? "neutral";
  const p = Math.max(0, Math.min(100, props.progress ?? 0));

  const b = toneStyles(badgeTone);
  const m = toneStyles(microTone);

  return (
    <div className="lab-card lab-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">{props.title}</div>
          <div className="mt-2 text-3xl font-semibold lab-num">{props.value}</div>
        </div>

        {badge ? (
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${b.chip}`}>
            <span className={`h-2 w-2 rounded-full ${b.dot}`} />
            {badge}
          </span>
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
        <div className={`mt-3 text-xs ${m.micro}`}>{props.micro}</div>
      ) : null}
    </div>
  );
}
