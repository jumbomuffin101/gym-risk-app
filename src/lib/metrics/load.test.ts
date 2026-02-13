import test from "node:test";
import assert from "node:assert/strict";

import {
  computeAcuteChronicRatio,
  computeSessionLoad,
  computeWowPercent,
  deriveRiskState,
} from "@/lib/metrics/load";

test("computeSessionLoad sums weight*reps and applies RPE multiplier when available", () => {
  const load = computeSessionLoad([
    { reps: 5, weight: 100 }, // 500
    { reps: 3, weight: 140, rpe: 8 }, // 420 * 1.1
  ]);

  assert.equal(load, 962);
});

test("computeWowPercent uses prior-week guard denominator", () => {
  assert.equal(computeWowPercent(3000, 2000), 50);
  assert.equal(computeWowPercent(150, 0), 999);
});

test("computeAcuteChronicRatio normalizes chronic load to 7-day equivalent", () => {
  assert.equal(computeAcuteChronicRatio(2400, 8000), 1.2);
  assert.equal(computeAcuteChronicRatio(500, 0), 0);
});

test("deriveRiskState prioritizes high triggers then monitor band", () => {
  assert.deepEqual(deriveRiskState(31, 1.1).state, "High");
  assert.deepEqual(deriveRiskState(10, 1.6).state, "High");
  assert.deepEqual(deriveRiskState(18, 1.2).state, "Monitor");
  assert.deepEqual(deriveRiskState(8, 1.35).state, "Monitor");
  assert.deepEqual(deriveRiskState(5, 1.1).state, "Stable");
});
