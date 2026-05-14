"use client";

import Link from "next/link";
import React from "react";

import { LabCard } from "./components/LabCard";

export function SessionStepper() {
  return (
    <LabCard className="rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Workout flow</div>
          <div className="mt-1 text-sm text-[rgba(230,232,238,0.88)]">
            Build a workout, save it, then review load and risk.
          </div>
        </div>

        <Link
          className="btn-secondary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
          href="/workouts/new"
        >
          New workout
        </Link>
      </div>
    </LabCard>
  );
}
