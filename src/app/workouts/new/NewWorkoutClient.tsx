"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import ExercisePicker from "./ExercisePicker";
import { formatSessionStartedAt } from "./formatSessionStartedAt";

type ActiveSession = {
  id: string;
  startedAt: string;
  selectedExerciseIds: string[];
};

export default function NewWorkoutClient({
  initialActiveSession,
  startSessionForm,
}: {
  initialActiveSession: ActiveSession | null;
  startSessionForm: ReactNode;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(initialActiveSession);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadActiveSession() {
      try {
        const response = await fetch("/api/sessions/active", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) setActiveSession(null);
          return;
        }

        const data = (await response.json()) as { activeSession: ActiveSession | null };
        if (!cancelled) {
          setActiveSession(data.activeSession);
        }
      } catch {
        if (!cancelled) {
          setActiveSession(initialActiveSession);
        }
      }
    }

    void loadActiveSession();

    return () => {
      cancelled = true;
    };
  }, [initialActiveSession]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="lab-card rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Workout Flow</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95">Build session queue</h1>
          </div>

          <Link
            href="/workouts"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Session result
          </Link>
        </div>

        {activeSession ? (
          <div className="inline-flex rounded-full border border-[rgba(34,197,94,0.22)] bg-[rgba(34,197,94,0.08)] px-3 py-1.5 text-xs text-white/75">
            Active session
            <span className="ml-2" suppressHydrationWarning>
              {isMounted ? formatSessionStartedAt(activeSession.startedAt) : ""}
            </span>
          </div>
        ) : null}
      </header>

      {!activeSession ? (
        <div className="lab-card lab-hover rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">No active session</div>
              <div className="mt-1 text-xs lab-muted">Start a session to unlock the queue.</div>
            </div>

            {startSessionForm}
          </div>
        </div>
      ) : null}

      {activeSession ? (
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <ExercisePicker
            enabled={Boolean(activeSession)}
            initialSelectedExerciseIds={activeSession?.selectedExerciseIds ?? []}
          />
        </div>
      ) : null}

      {!activeSession ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/workouts"
            className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
          >
            Back to workouts
          </Link>
        </div>
      ) : null}
    </div>
  );
}
