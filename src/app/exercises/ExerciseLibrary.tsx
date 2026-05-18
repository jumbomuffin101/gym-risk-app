"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ExerciseListItem = {
  id: string;
  name: string;
  category: string | null;
  setCount: number;
};

export function ExerciseLibrary({ exercises }: { exercises: ExerciseListItem[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return exercises;

    return exercises.filter((exercise) => {
      const category = exercise.category ?? "uncategorized";
      return (
        exercise.name.toLowerCase().includes(normalizedQuery) ||
        category.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [exercises, normalizedQuery]);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-wide lab-muted">Search library</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by exercise or category"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
        />
      </label>

      {filtered.length === 0 ? (
        <div className="lab-card rounded-2xl p-5 text-sm lab-muted">
          No exercises match your search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <Link
              key={exercise.id}
              href={`/exercises/${exercise.id}`}
              className="lab-card lab-hover block rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-white/90">
                    {exercise.name}
                  </div>
                  <div className="mt-1 text-xs lab-muted">
                    {exercise.category ?? "Uncategorized"}
                  </div>
                </div>

                <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/65">
                  {exercise.setCount} sets
                </div>
              </div>

              <div className="mt-4 text-xs text-white/55">View exercise info</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
