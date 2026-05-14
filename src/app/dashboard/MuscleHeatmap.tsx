"use client";

import { KeyboardEvent, useMemo, useState } from "react";

import type { MuscleRegionId, RegionRisk, RegionalRiskState } from "@/app/lib/dashboardRisk";
import { formatLoad } from "@/app/lib/workouts";

import { MetricCard } from "./components/MetricCard";
import { StatusChip } from "./components/StatusChip";

type RegionShape = {
  id: MuscleRegionId;
  label: string;
  kind: "rect" | "ellipse" | "path";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  rx?: number;
  ry?: number;
  d?: string;
  labelX: number;
  labelY: number;
};

const FRONT_REGIONS: RegionShape[] = [
  {
    id: "shoulders",
    label: "Shoulders",
    kind: "path",
    d: "M43 88C53 66 79 66 88 89L76 106C63 99 52 99 40 109C36 102 37 94 43 88ZM177 88C167 66 141 66 132 89L144 106C157 99 168 99 180 109C184 102 183 94 177 88Z",
    labelX: 110,
    labelY: 82,
  },
  { id: "chest", label: "Chest", kind: "rect", x: 70, y: 95, width: 80, height: 46, labelX: 110, labelY: 123 },
  { id: "biceps", label: "Biceps", kind: "path", d: "M37 118C52 121 58 138 52 170L32 166C29 145 31 129 37 118ZM183 118C168 121 162 138 168 170L188 166C191 145 189 129 183 118Z", labelX: 110, labelY: 160 },
  { id: "absCore", label: "Abs/Core", kind: "rect", x: 78, y: 146, width: 64, height: 72, labelX: 110, labelY: 186 },
  { id: "quads", label: "Quads", kind: "path", d: "M77 231H104L100 322H68C65 287 67 256 77 231ZM116 231H143C153 256 155 287 152 322H120L116 231Z", labelX: 110, labelY: 282 },
  { id: "knees", label: "Knees", kind: "path", d: "M69 326H100V356H69V326ZM120 326H151V356H120V326Z", labelX: 110, labelY: 346 },
];

const BACK_REGIONS: RegionShape[] = [
  { id: "upperBack", label: "Upper back", kind: "rect", x: 65, y: 88, width: 90, height: 52, labelX: 110, labelY: 119 },
  { id: "lats", label: "Lats", kind: "path", d: "M60 139C76 145 83 166 82 202H53C48 172 50 151 60 139ZM160 139C144 145 137 166 138 202H167C172 172 170 151 160 139Z", labelX: 110, labelY: 175 },
  { id: "triceps", label: "Triceps", kind: "path", d: "M35 116C51 121 56 141 50 173L30 168C27 145 29 127 35 116ZM185 116C169 121 164 141 170 173L190 168C193 145 191 127 185 116Z", labelX: 110, labelY: 158 },
  { id: "lowerBack", label: "Lower back", kind: "rect", x: 78, y: 203, width: 64, height: 42, labelX: 110, labelY: 229 },
  { id: "glutes", label: "Glutes", kind: "path", d: "M72 249C90 238 104 246 106 272C98 286 79 286 67 273C66 263 67 255 72 249ZM148 249C130 238 116 246 114 272C122 286 141 286 153 273C154 263 153 255 148 249Z", labelX: 110, labelY: 274 },
  { id: "hamstrings", label: "Hamstrings", kind: "path", d: "M72 286H102L98 356H67C65 328 66 305 72 286ZM118 286H148C154 305 155 328 153 356H122L118 286Z", labelX: 110, labelY: 325 },
  { id: "calves", label: "Calves", kind: "path", d: "M69 360H97L93 410H66C63 391 64 375 69 360ZM123 360H151C156 375 157 391 154 410H127L123 360Z", labelX: 110, labelY: 392 },
];

function stateTone(state: RegionalRiskState) {
  if (state === "elevated") return "danger";
  if (state === "monitor") return "watch";
  return "safe";
}

function stateColor(state: RegionalRiskState) {
  if (state === "elevated") return "var(--lab-danger)";
  if (state === "monitor") return "var(--lab-watch)";
  return "var(--lab-safe)";
}

function stateLabel(state: RegionalRiskState) {
  if (state === "elevated") return "Elevated";
  if (state === "monitor") return "Monitor";
  return "Stable";
}

function changeLabel(value: number | null) {
  if (value === null) return "No baseline";
  return `${value >= 0 ? "+" : ""}${Math.round(value)}%`;
}

function RegionZone({
  shape,
  risk,
  selected,
  onSelect,
}: {
  shape: RegionShape;
  risk: RegionRisk;
  selected: boolean;
  onSelect: (id: MuscleRegionId) => void;
}) {
  const color = stateColor(risk.state);
  const fill = `color-mix(in srgb, ${color} ${selected ? "42%" : "25%"}, transparent)`;
  const stroke = selected ? color : "rgba(255,255,255,0.18)";

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(shape.id);
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${shape.label}: ${stateLabel(risk.state)}`}
      className="cursor-pointer outline-none"
      onClick={() => onSelect(shape.id)}
      onKeyDown={handleKeyDown}
    >
      {shape.kind === "rect" ? (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx="16"
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 2 : 1}
        />
      ) : null}
      {shape.kind === "ellipse" ? (
        <ellipse
          cx={shape.cx}
          cy={shape.cy}
          rx={shape.rx}
          ry={shape.ry}
          fill={fill}
          stroke={stroke}
          strokeWidth={selected ? 2 : 1}
        />
      ) : null}
      {shape.kind === "path" ? (
        <path d={shape.d} fill={fill} stroke={stroke} strokeWidth={selected ? 2 : 1} />
      ) : null}
      <text
        x={shape.labelX}
        y={shape.labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none fill-white text-[9px] font-semibold"
      >
        {shape.label}
      </text>
    </g>
  );
}

function BodyDiagram({
  title,
  shapes,
  regionById,
  selected,
  onSelect,
  viewBox = "0 0 220 430",
}: {
  title: string;
  shapes: RegionShape[];
  regionById: Map<MuscleRegionId, RegionRisk>;
  selected: MuscleRegionId;
  onSelect: (id: MuscleRegionId) => void;
  viewBox?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white/90">{title}</div>
        <div className="text-xs lab-muted">Click a region</div>
      </div>
      <svg viewBox={viewBox} className="h-[430px] w-full" aria-label={`${title} muscle risk map`}>
        <path
          d="M110 28C125 28 137 40 137 55C137 71 125 82 110 82C95 82 83 71 83 55C83 40 95 28 110 28ZM75 85H145C164 91 176 107 180 132L190 200H166L155 145V225C155 242 149 255 139 264H81C71 255 65 242 65 225V145L54 200H30L40 132C44 107 56 91 75 85ZM81 264H139L156 410H125L113 294H107L95 410H64L81 264Z"
          fill="rgba(255,255,255,0.035)"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.5"
        />
        {shapes.map((shape) => {
          const risk = regionById.get(shape.id);
          if (!risk) return null;

          return (
            <RegionZone
              key={`${title}-${shape.id}`}
              shape={shape}
              risk={risk}
              selected={selected === shape.id}
              onSelect={onSelect}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function MuscleHeatmap({
  regions,
  hasWorkouts,
}: {
  regions: RegionRisk[];
  hasWorkouts: boolean;
}) {
  const initialSelected =
    regions.find((region) => region.state === "elevated")?.id ??
    regions.find((region) => region.state === "monitor")?.id ??
    regions[0]?.id ??
    "chest";
  const [selected, setSelected] = useState<MuscleRegionId>(initialSelected);
  const regionById = useMemo(() => new Map(regions.map((region) => [region.id, region])), [regions]);
  const selectedRegion = regionById.get(selected) ?? regions[0];

  return (
    <MetricCard
      title="Muscle heatmap"
      subtitle="Regional workload risk from mapped exercises in recent saved workouts."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip label="Stable" tone="safe" />
          <StatusChip label="Monitor" tone="watch" />
          <StatusChip label="Elevated" tone="danger" />
        </div>
      }
    >
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2">
          <BodyDiagram
            title="Front"
            shapes={FRONT_REGIONS}
            regionById={regionById}
            selected={selected}
            onSelect={setSelected}
          />
          <BodyDiagram
            title="Back"
            shapes={BACK_REGIONS}
            regionById={regionById}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {selectedRegion ? (
            <>
              <div className="text-xs uppercase tracking-wide lab-muted">Selected region</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: stateColor(selectedRegion.state) }}
                >
                  {selectedRegion.name}
                </div>
                <StatusChip
                  label={stateLabel(selectedRegion.state)}
                  tone={stateTone(selectedRegion.state)}
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs lab-muted">7-day load</dt>
                  <dd className="mt-1 text-sm font-semibold lab-num text-white/90">
                    {formatLoad(selectedRegion.currentLoad) ?? "0"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs lab-muted">Change</dt>
                  <dd className="mt-1 text-sm font-semibold lab-num text-white/90">
                    {changeLabel(selectedRegion.changePct)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs lab-muted">High RPE sets</dt>
                  <dd className="mt-1 text-sm font-semibold lab-num text-white/90">
                    {selectedRegion.highRpeSetCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs lab-muted">Pain flags</dt>
                  <dd className="mt-1 text-sm font-semibold lab-num text-white/90">
                    {selectedRegion.painFlagCount}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="text-xs uppercase tracking-wide lab-muted">Why</div>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {hasWorkouts ? selectedRegion.why : "Save workouts to compute regional load."}
                </p>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="text-xs uppercase tracking-wide lab-muted">Related exercises</div>
                {selectedRegion.relatedExercises.length === 0 ? (
                  <p className="mt-2 text-sm text-white/70">None logged in the last 7 days.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRegion.relatedExercises.map((exercise) => (
                      <span
                        key={exercise}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/78"
                      >
                        {exercise}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="text-xs uppercase tracking-wide lab-muted">Suggested action</div>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {hasWorkouts ? selectedRegion.action : "Save workouts to compute regional load."}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm lab-muted">Save workouts to compute regional load.</p>
          )}
        </div>
      </div>
    </MetricCard>
  );
}
