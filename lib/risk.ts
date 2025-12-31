// lib/risk.ts
export function computeSetRisk(input: {
  reps: number;
  weight: number; // pounds or kg, doesn't matter as long as consistent
  rpe?: number | null; // 1-10 optional
}) {
  const reps = input.reps;
  const weight = input.weight;
  const rpe = input.rpe ?? null;

  // Simple baseline: volume = weight * reps
  const volume = weight * reps;

  // Risk heuristic:
  // - More volume increases risk
  // - Higher RPE increases risk
  // This is intentionally simple for v1 and easy to iterate.
  let risk = 0;

  // Volume contribution (scaled)
  risk += Math.min(60, (volume / 500) * 10); // tune later

  // RPE contribution
  if (rpe != null) {
    risk += Math.min(40, (rpe / 10) * 40);
  } else {
    // If user doesn't provide RPE, assume moderate effort
    risk += 20;
  }

  // Clamp 0-100
  risk = Math.max(0, Math.min(100, Math.round(risk)));

  // Label buckets for UI
  const label =
    risk >= 75 ? "High" : risk >= 45 ? "Moderate" : "Low";

  return { risk, label, volume };
}
