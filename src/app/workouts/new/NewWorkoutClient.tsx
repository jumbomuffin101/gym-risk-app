"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ExercisePicker from "./ExercisePicker";
import { startWorkoutSession } from "@/app/exercises/actions";

type ActiveSession = {
  id: string;
  startedAt: string;
};

export default function NewWorkoutClient({
  initialActiveSession,
}: {
  initialActiveSession: ActiveSession | null;
}) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(initialActiveSession);

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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Workouts</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">New workout</h1>
        <p className="mt-1 text-sm lab-muted">
          Start a session, then select exercises to open and log sets.
        </p>
      </header>

      {!activeSession ? (
        <div className="lab-card lab-hover rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white/90">No active session</div>
              <div className="mt-1 text-xs lab-muted">
                Start a session to unlock exercise search and selection.
              </div>
            </div>

            <form action={startWorkoutSession}>
              <input type="hidden" name="redirectTo" value="/workouts/new" />
              <button
                className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
                }}
              >
                Start session
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="lab-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide lab-muted">Active session</div>
          <div className="mt-1 text-sm text-white/80">
            Started {new Date(activeSession.startedAt).toLocaleString()}
          </div>
        </div>
      )}

      <ExercisePicker enabled={Boolean(activeSession)} />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/workouts"
          className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
        >
          Back to workouts
        </Link>
      </div>
    </div>
  );
}