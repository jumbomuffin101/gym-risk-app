"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { createExerciseAction } from "@/app/exercises/actions";

type ExerciseItem = {
  id: string;
  name: string;
  category: string | null;
  _count: { sets: number };
};

type CreateExerciseResult = { ok: true } | { ok: false; error: string };

export default function ExerciseLibrary({ exercises }: { exercises: ExerciseItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(exercises.map((exercise) => exercise.category).filter(Boolean) as string[]);
    return ["all", ...Array.from(set).sort()];
  }, [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesQuery = exercise.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || exercise.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [exercises, query, category]);

  return (
    <div className="space-y-6">
      {exercises.length > 0 ? (
        <>
          <div className="lab-card rounded-2xl p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <label className="space-y-1">
                <div className="text-xs text-white/60">Search</div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search exercises"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
                />
              </label>

              <label className="space-y-1">
                <div className="text-xs text-white/60">Filter</div>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All categories" : cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exercise) => (
              <Link
                key={exercise.id}
                href={`/exercises/${exercise.id}`}
                className="lab-card lab-hover rounded-2xl p-5 block"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-white/90 truncate">
                      {exercise.name}
                    </div>
                    <div className="mt-1 text-xs lab-muted">
                      {exercise.category ?? "Uncategorized"}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-white/75">
                    {exercise._count.sets} sets
                  </div>
                </div>

                <div className="mt-4 text-xs text-white/60">Open details →</div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="lab-card rounded-2xl p-6 space-y-4">
          <div className="text-sm font-medium text-white/90">No exercises yet</div>
          <p className="text-sm text-white/60">
            Create your first exercise to start logging sets.
          </p>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setError(null);
              setSuccess(null);
              const form = event.currentTarget;
              const formData = new FormData(form);
              startTransition(async () => {
                const result = (await createExerciseAction(formData)) as CreateExerciseResult;
                if (!result.ok) {
                  setError(result.error ?? "Unable to create exercise.");
                  return;
                }
                setSuccess("Exercise created.");
                form.reset();
              });
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <div className="text-xs text-white/60">Name</div>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
                  placeholder="Back squat"
                />
              </label>
              <label className="space-y-1">
                <div className="text-xs text-white/60">Category</div>
                <input
                  name="category"
                  className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
                  placeholder="Lower body"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {pending ? "Saving..." : "Create exercise"}
            </button>

            {error ? <div className="text-sm text-red-400">{error}</div> : null}
            {success ? <div className="text-sm text-emerald-400">{success}</div> : null}
          </form>
        </div>
      )}
    </div>
  );
}
