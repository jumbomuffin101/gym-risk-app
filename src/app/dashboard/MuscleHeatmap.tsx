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
  if (level === "high") return "var(--lab-danger)";
  if (level === "moderate") return "var(--lab-watch)";
  return "var(--lab-safe)";
}

function levelLabel(level: RiskLevel) {
  if (level === "high") return "Elevated";
  if (level === "moderate") return "Watch";
  return "Stable";
}

function regionLabel(region: keyof RiskMap) {
  return region.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function explain(region: keyof RiskMap, level: RiskLevel, hasWorkouts: boolean) {
  if (!hasWorkouts) {
    return {
      title: regionLabel(region),
      detail: "No saved workouts yet. Save workouts to update this zone.",
      rec: "Use this as a quick regional summary after workouts are logged.",
    };
  }

  if (region === "hamstrings" && level !== "low") {
    return {
      title: "Hamstrings",
      detail: "Load is rising against recent baseline with hard-set exposure.",
      rec: "Watch volume and intensity on the next lower-body session.",
    };
  }

  if (region === "lowerBack" && level !== "low") {
    return {
      title: "Lower back",
      detail: "Hinge and squat loading are concentrated in the current session.",
      rec: "Keep top sets controlled if fatigue continues.",
    };
  }

  return {
    title: regionLabel(region),
    detail:
      level === "low"
        ? "Recent load is within the expected range."
        : "Recent load is above the expected range.",
    rec: level === "low" ? "No adjustment indicated." : "Consider a small load adjustment.",
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
  const isSelected = selected === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="absolute rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        background: `color-mix(in srgb, ${color} ${isSelected ? "24%" : "16%"}, transparent)`,
        border: isSelected
          ? `1px solid color-mix(in srgb, ${color} 55%, transparent)`
          : "1px solid rgba(255,255,255,0.07)",
      }}
      aria-label={`${label}: ${levelLabel(level)}`}
    >
      <div className="flex h-full w-full items-center justify-between px-3">
        <span className="text-xs text-white/90">{label}</span>
        <span className="text-xs lab-muted">{levelLabel(level)}</span>
      </div>
    </button>
  );
}

export function MuscleHeatmap({ risk, hasWorkouts }: { risk: RiskMap; hasWorkouts: boolean }) {
  const [selected, setSelected] = useState<keyof RiskMap>("hamstrings");
  const selectedLevel = risk[selected];
  const selectedColor = levelColor(selectedLevel);
  const panel = useMemo(() => explain(selected, selectedLevel, hasWorkouts), [selected, selectedLevel, hasWorkouts]);

  return (
    <MetricCard
      title="Muscle heatmap"
      subtitle="Regional risk summary from recent training load."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label="Stable" tone="safe" />
          <StatusChip label="Watch" tone="watch" />
          <StatusChip label="Elevated" tone="danger" />
        </div>
      }
    >
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between text-xs lab-muted">
            <span>Body zones</span>
            <span>Select a zone</span>
          </div>

          <div className="relative h-[370px] rounded-xl bg-white/[0.02]">
            <div className="absolute left-1/2 top-7 h-[310px] w-[160px] -translate-x-1/2 rounded-[80px] bg-white/[0.025]" />
            <div className="absolute left-1/2 top-3 h-[54px] w-[54px] -translate-x-1/2 rounded-full bg-white/[0.025]" />

            <Region id="shoulders" label="Shoulders" x={36} y={68} w={260} h={44} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="elbows" label="Elbows" x={36} y={119} w={260} h={44} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="lowerBack" label="Lower back" x={70} y={170} w={192} h={50} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="quads" label="Quads" x={70} y={228} w={192} h={38} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="hamstrings" label="Hamstrings" x={70} y={272} w={192} h={38} risk={risk} selected={selected} onSelect={setSelected} />
            <Region id="knees" label="Knees" x={70} y={316} w={192} h={38} risk={risk} selected={selected} onSelect={setSelected} />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Selected zone</div>
          <div className="mt-1 text-lg font-semibold tracking-tight" style={{ color: selectedColor }}>
            {panel.title} - {levelLabel(selectedLevel)}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/78">{panel.detail}</p>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="text-xs uppercase tracking-wide lab-muted">Action</div>
            <div className="mt-1 text-sm text-white/80">{panel.rec}</div>
          </div>
        </div>
      </div>
    </MetricCard>
  );
}
