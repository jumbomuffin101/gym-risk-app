import React from "react";

type Tone = "safe" | "watch" | "danger" | "neutral" | "accent";

const toneStyles: Record<Tone, { chip: string; dot: string }> = {
  safe: {
    chip: "border-[rgba(34,197,94,0.28)] bg-[rgba(34,197,94,0.10)] text-[rgba(230,232,238,0.92)]",
    dot: "bg-[var(--lab-safe)]",
  },
  watch: {
    chip: "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.10)] text-[rgba(230,232,238,0.92)]",
    dot: "bg-[var(--lab-watch)]",
  },
  danger: {
    chip: "border-[rgba(239,68,68,0.24)] bg-[rgba(239,68,68,0.10)] text-[rgba(230,232,238,0.92)]",
    dot: "bg-[var(--lab-danger)]",
  },
  accent: {
    chip: "border-[rgba(56,189,248,0.25)] bg-[rgba(56,189,248,0.10)] text-[rgba(230,232,238,0.92)]",
    dot: "bg-[var(--lab-analytics)]",
  },
  neutral: {
    chip: "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[rgba(230,232,238,0.90)]",
    dot: "bg-[rgba(230,232,238,0.35)]",
  },
};

export function StatusChip({
  label,
  tone = "neutral",
  showDot = true,
  className = "",
}: {
  label: string;
  tone?: Tone;
  showDot?: boolean;
  className?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        styles.chip,
        className,
      ].join(" ")}
    >
      {showDot ? <span className={`h-2 w-2 rounded-full ${styles.dot}`} /> : null}
      {label}
    </span>
  );
}
