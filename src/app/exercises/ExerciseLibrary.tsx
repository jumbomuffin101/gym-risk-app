"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createExerciseAction } from "./actions";
import type { ExerciseRiskPayload } from "@/app/lib/exerciseRisk";

export type ExerciseSummary = {
  id: string;
  name: string;
  category: string | null;
  setCount: number;
};

type RiskMap = Record<string, ExerciseRiskPayload>;

export default function ExerciseLibrary({
  exercises,
  categories,
}: {
  exercises: ExerciseSummary[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [riskMap, setRiskMap] = useState<RiskMap>({});
  const [riskStatus, setRiskStatus] = useState<"loading" | "ready">("loading");
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/exercises/risk", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (!data?.items) {
          setRiskStatus("ready");
          return;
        }
        const next: RiskMap = {};
        for (const item of data.items) {
          next[item.exerciseId] = item.risk as ExerciseRiskPayload;
        }
        setRiskMap(next);
        setRiskStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setRiskStatus("ready");
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesQuery = normalizedQuery.length === 0 || exercise.name.toLowerCase().includes(normalizedQuery);
      const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [exercises, normalizedQuery, selectedCategory]);

  const showEmptySearch = filtered.length === 0 && (normalizedQuery.length > 0 || selectedCategory !== "all");

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="lab-card rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex-1">
              <span className="text-xs uppercase tracking-wide lab-muted">Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search exercises"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
              />
            </label>
            <label className="w-full sm:w-56">
              <span className="text-xs uppercase tracking-wide lab-muted">Filter</span>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="lab-card rounded-2xl p-6 text-sm text-white/80">
            <div className="text-base font-semibold text-white/95">No data yet</div>
            <p className="mt-2 text-white/70">Create your first exercise to start logging sets.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCreateName("")}
                className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
              >
                Create exercise
              </button>
              <Link
                href="/workouts"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80"
              >
                Log a workout
              </Link>
            </div>
          </div>
        ) : showEmptySearch ? (
          <div className="lab-card rounded-2xl p-6 text-sm text-white/80">
            <div className="text-base font-semibold text-white/95">No matches</div>
            <p className="mt-2 text-white/70">
              No exercises match your search. Create it to start logging.
            </p>
            <button
              type="button"
              onClick={() => setCreateName(query.trim())}
              className="mt-4 rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
            >
              Create “{query.trim() || "New exercise"}”
            </button>
          </div>
        ) : (
          <div className="lab-card rounded-2xl divide-y divide-white/10">
            {filtered.map((exercise) => {
              const risk = riskMap[exercise.id];
              const riskText =
                risk?.hasData === true
                  ? `${risk.score} (${risk.label})`
                  : riskStatus === "loading"
                    ? "Loading…"
                    : "No data";

              return (
                <Link
                  key={exercise.id}
                  href={`/exercises/${exercise.id}`}
                  className="flex flex-col gap-3 px-4 py-4 transition hover:bg-white/[0.03]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white/95 truncate">{exercise.name}</div>
                      <div className="mt-1 text-xs lab-muted">
                        {exercise.category ?? "Uncategorized"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
                        {exercise.setCount} sets
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
                        Exercise risk score: {riskText}
                      </span>
                    </div>
                  </div>
                  {risk?.hasData ? null : (
                    <span className="text-xs text-white/60">No data yet — log a set →</span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Create new exercise</div>
        <h2 className="mt-2 text-lg font-semibold text-white/95">Add to your library</h2>
        <p className="mt-1 text-sm text-white/70">Name is required. Category or muscle group is optional.</p>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);

            const form = event.currentTarget;
            const formData = new FormData(form);

            startTransition(async () => {
              const result = await createExerciseAction(formData);
              if (!result.ok) {
                setFormError(result.error ?? "Unable to create exercise.");
                return;
              }
              setCreateName("");
              setCreateCategory("");
              form.reset();
              router.refresh();
            });
          }}
        >
          <label className="block">
            <span className="text-xs uppercase tracking-wide lab-muted">Exercise name</span>
            <input
              name="name"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
              placeholder="e.g. Trap bar deadlift"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide lab-muted">Category / muscle group</span>
            <input
              name="category"
              value={createCategory}
              onChange={(event) => setCreateCategory(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/40"
              placeholder="Optional"
            />
          </label>

          {formError ? <div className="text-sm text-rose-200">{formError}</div> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
          >
            {pending ? "Saving…" : "Create exercise"}
          </button>
        </form>
      </div>
    </div>
  );
}
