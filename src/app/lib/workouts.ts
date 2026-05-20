type WorkoutMetricSet = {
  exerciseId: string;
  reps: number;
  weight: number;
  rpe: number | null;
  pain?: number | null;
};

export function normalizeWorkoutName(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || null;
}

export function cleanWorkoutName(note: string | null, maxLength = 140) {
  const value = normalizeWorkoutName(note);
  if (!value) return null;

  const lower = value.toLowerCase();
  const looksInternal =
    value.startsWith("{") ||
    value.startsWith("[") ||
    lower.includes("session_plan") ||
    lower.includes("[object object]") ||
    lower === "null" ||
    lower === "undefined" ||
    lower.includes("=>") ||
    lower.includes("\u00e2") ||
    lower.includes("\u00c3");

  if (looksInternal) return null;
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

export function setLoad(set: { reps: number; weight: number; rpe: number | null }) {
  return set.reps * set.weight * (set.rpe ?? 1);
}

export function formatLoad(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value).toLocaleString();
}

export function formatPercentChange(
  value: number | null | undefined,
  decimals = 0
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  const rounded = Number(value.toFixed(decimals));
  const sign = rounded > 0 ? "+" : "";

  return `${sign}${rounded}%`;
}

export function summarizeWorkoutSets(sets: WorkoutMetricSet[]) {
  const sessionLoad = sets.reduce((sum, set) => sum + setLoad(set), 0);
  const exerciseCount = new Set(sets.map((set) => set.exerciseId)).size;
  const rpeValues = sets
    .map((set) => set.rpe)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const painValues = sets
    .map((set) => set.pain)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    sessionLoad,
    setCount: sets.length,
    exerciseCount,
    averageRpe:
      rpeValues.length > 0
        ? rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length
        : null,
    highRpeSetCount: rpeValues.filter((value) => value >= 9).length,
    maxPain: painValues.length > 0 ? Math.max(...painValues) : null,
    painSetCount: painValues.filter((value) => value > 0).length,
  };
}
