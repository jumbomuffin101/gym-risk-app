"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ExerciseItem = {
  id: string;
  name: string;
  category: string | null;
  setCount: number;
};

const CATEGORY_FILTERS = [
  "All",
  "squat",
  "hinge",
  "push",
  "pull",
  "arms",
  "core",
  "calves",
  "conditioning",
] as const;

export default function ExerciseLibraryClient({
  exercises,
  hasActiveSession,
}: {
  exercises: ExerciseItem[];
  hasActiveSession: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>("All");

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      const nameMatch = q.length === 0 || exercise.name.toLowerCase().includes(q);
      const categoryMatch =
        category === "All" ||
        (exercise.category ?? "").toLowerCase().includes(category.toLowerCase());

      return nameMatch && categoryMatch;
    });
  }, [category, exercises, query]);

  return (
    <div className="space-y-4">
      <div className="lab-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="lab-muted">Active session:</span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-white/85">
            {hasActiveSession ? "Yes" : "No"}
          </span>
        </div>

        <label className="block">
          <span className="sr-only">Search exercises</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-white/25"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((pill) => {
            const selected = category === pill;

            return (
              <button
                key={pill}
                type="button"
                onClick={() => setCategory(pill)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-white/30 bg-white/[0.12] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.08]"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="lab-card rounded-2xl p-6 text-white/80">
          No exercises match your filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.id}`}
              className="lab-card lab-hover rounded-2xl p-5 block"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-white/90 truncate">{exercise.name}</div>
                  <div className="mt-1 text-xs lab-muted">{exercise.category ?? "Uncategorized"}</div>
                </div>

                <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/75">
                  {exercise.setCount} sets
                </div>
              </div>

              <div className="mt-4 text-xs text-white/60">Open details →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
