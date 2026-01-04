"use client";

import React, { useMemo, useState } from "react";

type RiskLevel = "low" | "moderate" | "high";

export type RiskMap = {
  shoulders: RiskLevel;
  elbows: RiskLevel;
  lowerBack: RiskLevel;
  quads: RiskLevel;
  hamstrings: RiskLevel;
  knees: RiskLevel;
};

function levelColor(level: RiskLevel) {
  if (level === "high") return "var(--lab-danger)";
  if (level === "moderate") return "var(--lab-watch)";
  return "var(--lab-safe)";
}

function levelLabel(level: RiskLevel) {
  if (level === "high") return "Elevated";
  if (level === "moderate") return "Watch";
  return "Stable";
}

function explain(region: keyof RiskMap, level: RiskLevel, active: boolean) {
  if (!active) {
    return {
      title: "No active session",
      bullets: [
        "Start a session to generate live risk drivers.",
        "Heatmap will update as sets are logged.",
      ],
      rec: "Start a session, then log sets to see explainable signals.",
    };
  }

  if (region === "hamstrings" && level !== "low") {
    return {
      title: "Hamstrings",
      bullets: [
        level === "high" ? "Load spike: +28% vs 7-day avg" : "Load rising vs baseline",
        "High intensity exposure (RPE 8–9)",
        "<24h recovery since last similar exposure",
      ],
      rec: "Reduce volume or intensity next session; prioritize recovery.",
    };
  }

  if (region === "lowerBack" && level !== "low") {
    return {
      title: "Lower back",
      bullets: [
        "Compound loading concentration (hinge / squat)",
        "Fatigue trend across sets",
        "Recovery window tightening",
      ],
      rec: "Keep technique strict; reduce top-set intensity if fatigue persists.",
    };
  }

  return {
    title: region
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase()),
    bullets: [
      level === "high"
        ? "Spike in regional volume"
        : level === "moderate"
        ? "Moderate deviation vs baseline"
        : "Consistent load maintained",
      "Exposure distribution suggests monitoring",
      "No single driver dominates (multi-factor)",
    ],
    rec: level === "low" ? "Continue current load pattern." : "Consider small adjustments to stay within baseline.",
  };
}

type RegionProps = {
  id: keyof RiskMap;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  risk: RiskMap;
  selected: keyof RiskMap;
  onSelect: (id: keyof RiskMap) => void;
};

function Region({ id, label, x, y, w, h, risk, selected, onSelect }: RegionProps) {
  const level = risk[id];
  const color = levelColor(level);
  const isSel = selected === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="absolute rounded-xl outline-none"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        background: `color-mix(in srgb, ${color} 22%, transparent)`,
        border: isSel
          ? `1px solid color-mix(in srgb, ${color} 55%, transparent)`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: isSel
          ? `0 0 0 1px color-mix(in srgb, ${color} 35%, transparent), 0 18px 60px color-mix(in srgb, ${color} 16%, transparent)`
          : "none",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
      }}
      aria-label={`Region ${label}`}
    >
      <div className="flex h-full w-full items-end justify-between p-3">
        <div className="text-xs text-[rgba(230,232,238,0.92)]">{label}</div>
        <div className="text-xs lab-muted">{levelLabel(level)}</div>
      </div>
    </button>
  );
}

export function MuscleHeatmap({ risk, active }: { risk: RiskMap; active: boolean }) {
  const [selected, setSelected] = useState<keyof RiskMap>("hamstrings");

  const selectedLevel = risk[selected];
  const selectedColor = levelColor(selectedLevel);

  const panel = useMemo(
    () => explain(selected, selectedLevel, active),
    [selected, selectedLevel, active]
  );

  return (
    <div className="lab-card lab-hover rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Muscle risk heatmap</div>
          <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">
            Click a zone to see <span className="text-[rgba(230,232,238,0.96)]">why</span> it’s elevated.
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs lab-muted">
          <span className="h-2 w-2 rounded-full bg-[var(--lab-safe)]" />
          Stable
          <span className="ml-3 h-2 w-2 rounded-full bg-[var(--lab-watch)]" />
          Watch
          <span className="ml-3 h-2 w-2 rounded-full bg-[var(--lab-danger)]" />
          Elevated
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Heatmap surface */}
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
          <div className="mb-3 flex items-center justify-between text-xs lab-muted">
            <span>Body zones</span>
            <span className="lab-num">explainable signals</span>
          </div>

          <div className="relative h-[340px] rounded-2xl bg-[rgba(255,255,255,0.02)]">
            <div className="absolute inset-0 opacity-[0.28]">
              <div className="h-full w-full lab-gridline opacity-[0.32]" />
            </div>

            {/* minimal figure */}
            <div className="absolute left-1/2 top-6 h-[300px] w-[180px] -translate-x-1/2 rounded-[90px] bg-[rgba(255,255,255,0.03)]" />
            <div className="absolute left-1/2 top-2 h-[62px] w-[62px] -translate-x-1/2 rounded-full bg-[rgba(255,255,255,0.03)]" />

            {/* clickable regions */}
            <Region id="shoulders" label="Shoulders" x={38} y={70} w={260} h={54} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="elbows" label="Elbows" x={38} y={130} w={260} h={52} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="lowerBack" label="Lower back" x={72} y={182} w={192} h={62} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="quads" label="Quads" x={72} y={248} w={192} h={46} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="hamstrings" label="Hamstrings" x={72} y={298} w={192} h={46} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="knees" label="Knees" x={72} y={346} w={192} h={46} risk={risk} selected={selected} onSelect={setSelected} />
          </div>
        </div>

        {/* Explainability panel */}
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide lab-muted">Explainable risk</div>
              <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: selectedColor }}>
                {panel.title} — {levelLabel(selectedLevel)}
              </div>
            </div>

            <span
              className="rounded-full border px-3 py-1 text-xs"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                color: selectedColor,
              }}
            >
              {selected.replace(/([A-Z])/g, " $1")}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-[rgba(230,232,238,0.86)]">
            {panel.bullets.map((b, i) => (
              <div key={i} className="flex gap-2">
                <div className="mt-2 h-1.5 w-1.5 flex-none rounded-full" style={{ background: selectedColor }} />
                <div className="min-w-0">{b}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="text-xs uppercase tracking-wide lab-muted">Recommendation</div>
            <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">{panel.rec}</div>
          </div>

          <div className="mt-3 text-xs lab-muted">
            This panel is structured to support your future “drivers” model (spike, recovery, pain flags, etc.).
          </div>
        </div>
      </div>
    </div>
  );
}
