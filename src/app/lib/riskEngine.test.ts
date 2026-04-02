import test from "node:test";
import assert from "node:assert/strict";

import { deriveRiskReasonsForSets } from "@/app/lib/riskEngine";

test("deriveRiskReasonsForSets flags conditioning strain from long, hard bouts", () => {
  const reasons = deriveRiskReasonsForSets([
    {
      weight: 3,
      reps: 5,
      durationSeconds: 600,
      distanceMeters: 1800,
      rpe: 8.5,
      pain: 2,
      exercise: { category: "conditioning", name: "RowErg" },
    },
    {
      weight: 3,
      reps: 4,
      durationSeconds: 720,
      distanceMeters: 2200,
      rpe: 8,
      pain: 3,
      exercise: { category: "conditioning", name: "Assault Bike" },
    },
    {
      weight: 2,
      reps: 6,
      durationSeconds: 540,
      distanceMeters: 1200,
      rpe: 8,
      pain: 2,
      exercise: { category: "conditioning", name: "Sled Push" },
    },
  ]);

  assert.ok(reasons.some((reason) => reason.kind === "conditioning_density"));
});

test("deriveRiskReasonsForSets compares category load against recent baseline", () => {
  const reasons = deriveRiskReasonsForSets(
    [
      {
        weight: 225,
        reps: 5,
        durationSeconds: null,
        distanceMeters: null,
        rpe: 8,
        pain: 1,
        exercise: { category: "squat", name: "High Bar Squat" },
      },
      {
        weight: 245,
        reps: 5,
        durationSeconds: null,
        distanceMeters: null,
        rpe: 8.5,
        pain: 1,
        exercise: { category: "squat", name: "High Bar Squat" },
      },
    ],
    {
      squat: [
        {
          sessionId: "a",
          weight: 135,
          reps: 5,
          durationSeconds: null,
          distanceMeters: null,
          rpe: 7,
          pain: 1,
          exercise: { category: "squat", name: "High Bar Squat" },
        },
        {
          sessionId: "b",
          weight: 145,
          reps: 5,
          durationSeconds: null,
          distanceMeters: null,
          rpe: 7,
          pain: 1,
          exercise: { category: "squat", name: "High Bar Squat" },
        },
        {
          sessionId: "c",
          weight: 155,
          reps: 5,
          durationSeconds: null,
          distanceMeters: null,
          rpe: 7.5,
          pain: 1,
          exercise: { category: "squat", name: "High Bar Squat" },
        },
      ],
    }
  );

  assert.ok(reasons.some((reason) => reason.kind === "volume_spike"));
});
