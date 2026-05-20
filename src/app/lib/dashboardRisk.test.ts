import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMuscleRegionRisks,
  getBaselineReadiness,
  regionsForExercise,
} from "./dashboardRisk";

test("baseline is ready with 8 workouts even across 4 days", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const readiness = getBaselineReadiness(
    [
      { startedAt: new Date("2026-05-14T08:00:00Z"), endedAt: new Date("2026-05-14T08:01:00Z") },
      { startedAt: new Date("2026-05-14T10:00:00Z"), endedAt: new Date("2026-05-14T10:01:00Z") },
      { startedAt: new Date("2026-05-15T08:00:00Z"), endedAt: new Date("2026-05-15T08:01:00Z") },
      { startedAt: new Date("2026-05-15T10:00:00Z"), endedAt: new Date("2026-05-15T10:01:00Z") },
      { startedAt: new Date("2026-05-16T08:00:00Z"), endedAt: new Date("2026-05-16T08:01:00Z") },
      { startedAt: new Date("2026-05-16T10:00:00Z"), endedAt: new Date("2026-05-16T10:01:00Z") },
      { startedAt: new Date("2026-05-17T08:00:00Z"), endedAt: new Date("2026-05-17T08:01:00Z") },
      { startedAt: new Date("2026-05-17T10:00:00Z"), endedAt: new Date("2026-05-17T10:01:00Z") },
    ],
    asOf
  );

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.comparisonReady, true);
});

test("baseline is ready with workouts on 5 unique days", () => {
  const asOf = new Date("2026-05-17T12:00:00Z");
  const readiness = getBaselineReadiness(
    [
      { startedAt: new Date("2026-05-09T12:00:00Z"), endedAt: new Date("2026-05-09T12:01:00Z") },
      { startedAt: new Date("2026-05-10T12:00:00Z"), endedAt: new Date("2026-05-10T12:01:00Z") },
      { startedAt: new Date("2026-05-11T12:00:00Z"), endedAt: new Date("2026-05-11T12:01:00Z") },
      { startedAt: new Date("2026-05-12T12:00:00Z"), endedAt: new Date("2026-05-12T12:01:00Z") },
      { startedAt: new Date("2026-05-13T12:00:00Z"), endedAt: new Date("2026-05-13T12:01:00Z") },
    ],
    asOf
  );

  assert.equal(readiness.isReady, true);
  assert.equal(readiness.uniqueDays, 5);
});

test("baseline is provisional with 3 workouts on the same day", () => {
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
  assert.equal(readiness.isPending, false);
  assert.equal(readiness.isProvisional, true);
  assert.equal(readiness.comparisonReady, true);
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
  assert.equal(readiness.isPending, true);
  assert.equal(readiness.comparisonReady, false);
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
