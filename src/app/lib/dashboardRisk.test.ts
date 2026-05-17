import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMuscleRegionRisks,
  getBaselineReadiness,
  regionsForExercise,
} from "./dashboardRisk";

test("baseline is ready with 3 workouts across 8 days", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const readiness = getBaselineReadiness(
    [
      { startedAt: new Date("2026-05-09T12:00:00Z"), endedAt: new Date("2026-05-09T12:01:00Z") },
      { startedAt: new Date("2026-05-13T12:00:00Z"), endedAt: new Date("2026-05-13T12:01:00Z") },
      { startedAt: new Date("2026-05-17T11:00:00Z"), endedAt: new Date("2026-05-17T11:01:00Z") },
    ],
    asOf
  );

  assert.equal(readiness.isReady, true);
});

test("baseline is pending with 3 workouts on the same day", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const readiness = getBaselineReadiness(
    [
      { startedAt: new Date("2026-05-17T08:00:00Z"), endedAt: new Date("2026-05-17T08:01:00Z") },
      { startedAt: new Date("2026-05-17T10:00:00Z"), endedAt: new Date("2026-05-17T10:01:00Z") },
      { startedAt: new Date("2026-05-17T11:00:00Z"), endedAt: new Date("2026-05-17T11:01:00Z") },
    ],
    asOf
  );

  assert.equal(readiness.isReady, false);
});

test("baseline is pending with 2 workouts across 8 days", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const readiness = getBaselineReadiness(
    [
      { startedAt: new Date("2026-05-09T12:00:00Z"), endedAt: new Date("2026-05-09T12:01:00Z") },
      { startedAt: new Date("2026-05-17T11:00:00Z"), endedAt: new Date("2026-05-17T11:01:00Z") },
    ],
    asOf
  );

  assert.equal(readiness.isReady, false);
});

test("specific exercises map to expected muscle regions", () => {
  assert.deepEqual(regionsForExercise("Leg Extension", null), ["quads"]);
  assert.deepEqual(regionsForExercise("Seated Leg Curl", null), ["hamstrings"]);
});

test("first regional load is baseline pending, not high", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const regions = buildMuscleRegionRisks(
    [
      {
        performedAt: new Date("2026-05-17T11:00:00Z"),
        reps: 10,
        weight: 100,
        rpe: null,
        pain: null,
        exercise: { name: "Leg Extension", category: null },
      },
    ],
    asOf,
    false
  );

  assert.equal(regions.find((region) => region.id === "quads")?.state, "baseline");
});
