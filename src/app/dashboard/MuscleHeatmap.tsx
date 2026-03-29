"use client";

import React, { useMemo, useState } from "react";

import { MetricCard } from "./components/MetricCard";
import { StatusChip } from "./components/StatusChip";

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
  if (level === "high") return "rgba(239,68,68,0.55)";
  if (level === "moderate") return "rgba(234,179,8,0.45)";
  return "rgba(34,197,94,0.25)";
}

function levelAccent(level: RiskLevel) {
  if (level === "high") return "rgb(239,68,68)";
  if (level === "moderate") return "rgb(234,179,8)";
  return "rgb(34,197,94)";
}

function levelLabel(level: RiskLevel) {
  if (level === "high") return "Elevated";
  if (level === "moderate") return "Watch";
  return "Stable";
}

const regionLabels: Record<keyof RiskMap, string> = {
  shoulders: "Shoulders / upper back",
  elbows: "Chest",
  lowerBack: "Lower back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  knees: "Abs / glutes",
};

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
        "High intensity exposure (RPE 8-9)",
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
    title: regionLabels[region],
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
  d: string;
  risk: RiskMap;
  selected: keyof RiskMap;
  onSelect: (id: keyof RiskMap) => void;
};

function Region({ id, label, d, risk, selected, onSelect }: RegionProps) {
  const level = risk[id];
  const fill = levelColor(level);
  const accent = levelAccent(level);
  const isSelected = selected === id;

  return (
    <g
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
      aria-label={`Region ${label}`}
      className="cursor-pointer outline-none"
    >
      <path
        d={d}
        fill={fill}
        stroke={isSelected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.08)"}
        strokeWidth={isSelected ? 2.4 : 1.2}
        style={{
          filter: isSelected ? `drop-shadow(0 0 14px ${accent})` : "none",
          transition: "fill 180ms ease, stroke 180ms ease, filter 180ms ease",
        }}
      />
    </g>
  );
}

type BodyViewProps = {
  title: string;
  regions: Array<{ id: keyof RiskMap; label: string; d: string }>;
  risk: RiskMap;
  selected: keyof RiskMap;
  onSelect: (id: keyof RiskMap) => void;
};

function BodyView({ title, regions, risk, selected, onSelect }: BodyViewProps) {
  return (
    <div className="rounded-2xl bg-[rgba(255,255,255,0.02)] p-3">
      <div className="mb-3 flex items-center justify-between text-xs lab-muted">
        <span>{title}</span>
        <span className="lab-num">tap zone</span>
      </div>

      <svg
        viewBox="0 0 220 360"
        className="mx-auto h-[320px] w-full max-w-[220px]"
        role="img"
        aria-label={`${title} muscle risk silhouette`}
      >
        <g
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="110" cy="38" r="24" />
          <path d="M86 68 C72 84 66 106 68 132 L74 208 C76 232 82 258 88 330" />
          <path d="M134 68 C148 84 154 106 152 132 L146 208 C144 232 138 258 132 330" />
          <path d="M82 82 C96 72 124 72 138 82" />
          <path d="M84 118 C98 128 122 128 136 118" />
          <path d="M86 154 C98 164 122 164 134 154" />
          <path d="M88 188 C98 196 122 196 132 188" />
          <path d="M88 216 C100 230 100 270 96 330" />
          <path d="M132 216 C120 230 120 270 124 330" />
          <path d="M68 102 C54 136 48 164 52 212" />
          <path d="M152 102 C166 136 172 164 168 212" />
        </g>

        <g>
          {regions.map((region) => (
            <Region
              key={`${title}-${region.label}`}
              id={region.id}
              label={region.label}
              d={region.d}
              risk={risk}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

const frontRegions: Array<{ id: keyof RiskMap; label: string; d: string }> = [
  {
    id: "shoulders",
    label: "Shoulders",
    d: "M66 78 C82 66 96 64 104 76 L96 102 C84 104 74 98 66 78 Z M154 78 C138 66 124 64 116 76 L124 102 C136 104 146 98 154 78 Z",
  },
  {
    id: "elbows",
    label: "Chest",
    d: "M88 92 C98 82 122 82 132 92 C136 108 132 124 122 136 L98 136 C88 124 84 108 88 92 Z",
  },
  {
    id: "knees",
    label: "Abs",
    d: "M96 144 C104 138 116 138 124 144 L128 190 C122 198 98 198 92 190 Z",
  },
  {
    id: "quads",
    label: "Quads",
    d: "M90 214 C100 206 106 206 110 214 L108 286 C100 292 92 288 88 276 Z M130 214 C120 206 114 206 110 214 L112 286 C120 292 128 288 132 276 Z",
  },
];

const backRegions: Array<{ id: keyof RiskMap; label: string; d: string }> = [
  {
    id: "shoulders",
    label: "Upper back / traps",
    d: "M82 78 C96 68 124 68 138 78 L134 112 C124 120 96 120 86 112 Z",
  },
  {
    id: "lowerBack",
    label: "Lower back",
    d: "M94 150 C102 144 118 144 126 150 L128 196 C120 204 100 204 92 196 Z",
  },
  {
    id: "knees",
    label: "Glutes",
    d: "M88 196 C100 186 120 186 132 196 L130 222 C118 232 102 232 90 222 Z",
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    d: "M90 224 C100 216 106 216 110 224 L108 294 C100 302 92 298 88 284 Z M130 224 C120 216 114 216 110 224 L112 294 C120 302 128 298 132 284 Z",
  },
];

export function MuscleHeatmap({ risk, active }: { risk: RiskMap; active: boolean }) {
  const [selected, setSelected] = useState<keyof RiskMap>("hamstrings");

  const selectedLevel = risk[selected];
  const selectedColor = levelAccent(selectedLevel);

  const panel = useMemo(
    () => explain(selected, selectedLevel, active),
    [selected, selectedLevel, active]
  );

  return (
    <MetricCard
      title="Muscle risk heatmap"
      subtitle={
        <>
          Click a zone to see <span className="text-[rgba(230,232,238,0.96)]">why</span> it's elevated.
        </>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label="Stable" tone="safe" />
          <StatusChip label="Watch" tone="watch" />
          <StatusChip label="Elevated" tone="danger" />
        </div>
      }
    >
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
          <div className="mb-3 flex items-center justify-between text-xs lab-muted">
            <span>Body zones</span>
            <span className="lab-num">explainable signals</span>
          </div>

          <div className="relative rounded-2xl bg-[rgba(255,255,255,0.02)] p-2">
            <div className="absolute inset-0 opacity-[0.28]">
              <div className="h-full w-full lab-gridline opacity-[0.32]" />
            </div>

            <div className="relative grid gap-4 md:grid-cols-2">
              <BodyView title="Front" regions={frontRegions} risk={risk} selected={selected} onSelect={setSelected} />
              <BodyView title="Back" regions={backRegions} risk={risk} selected={selected} onSelect={setSelected} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(15,21,32,0.6)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide lab-muted">Explainable risk</div>
              <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: selectedColor }}>
                {panel.title} - {levelLabel(selectedLevel)}
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
              {regionLabels[selected]}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-[rgba(230,232,238,0.86)]">
            {panel.bullets.map((bullet, index) => (
              <div key={index} className="flex gap-2">
                <div className="mt-2 h-1.5 w-1.5 flex-none rounded-full" style={{ background: selectedColor }} />
                <div className="min-w-0">{bullet}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
            <div className="text-xs uppercase tracking-wide lab-muted">Recommendation</div>
            <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">{panel.rec}</div>
          </div>

          <div className="mt-3 text-xs lab-muted">
            This panel is structured to support your future "drivers" model (spike, recovery, pain flags, etc.).
          </div>
        </div>
      </div>
    </MetricCard>
  );
}
