"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Exercise = {
  id: string;
  name: string;
  category: string | null;
};

type Props = {
  enabled: boolean;
};

const MAX_SELECTED = 6;

export default function ExercisePicker({ enabled }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function search() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (debouncedQuery) {
          params.set("query", debouncedQuery);
        }

        const response = await fetch(`/api/exercises?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as { exercises?: Exercise[] } | Exercise[];
        const exercises = Array.isArray(data) ? data : data.exercises ?? [];
        setResults(exercises);
      } catch {
        if (!controller.signal.aborted) {
          setError("Could not load exercises. Try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void search();
    return () => controller.abort();
  }, [debouncedQuery, enabled]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);

  function removeExercise(id: string) {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  }

  function toggleExercise(exercise: Exercise) {
    if (selectedIds.has(exercise.id)) {
      removeExercise(exercise.id);
      return;
    }

    if (selected.length >= MAX_SELECTED) return;
    setSelected((prev) => [...prev, exercise]);
  }

  async function createCustomExercise() {
    if (query.trim().length < 3 || creating) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query.trim(), category: "accessory" }),
      });

      const data = (await response.json()) as
        | {
            exercise?: Exercise;
            error?: string;
          }
        | Exercise;

      const exercise = "id" in data ? data : data.exercise;
      const errorMessage = "error" in data ? data.error : undefined;

      if (!response.ok && !exercise) {
        throw new Error(errorMessage ?? "Failed to create");
      }

      if (exercise) {
        toggleExercise(exercise);
        setQuery("");
        setDebouncedQuery("");
      }
    } catch {
      setError("Unable to create exercise.");
    } finally {
      setCreating(false);
    }
  }

  const canCreate = enabled && debouncedQuery.length >= 3 && results.length === 0 && !loading;

  return (
    <div className="lab-card lab-hover rounded-2xl p-5 space-y-4">
      <div>
        <div className="text-sm font-semibold text-white/90">Exercise picker</div>
        <p className="mt-1 text-xs lab-muted">
          Search the library and pick up to {MAX_SELECTED} exercises for this session.
        </p>
        <p className="mt-1 text-xs text-white/55">
          Showing up to 50 matching exercises. Narrow your search to find more.
        </p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={enabled ? "Search exercises..." : "Start a session to enable"}
        disabled={!enabled}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[rgba(34,197,94,0.35)] disabled:opacity-60"
      />

      {error ? <div className="text-xs text-rose-300">{error}</div> : null}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
        <div className="text-xs uppercase tracking-wide lab-muted">Results</div>
        {loading ? <div className="text-sm text-white/70">Loading...</div> : null}
        {!loading && results.length === 0 ? (
          <div className="text-sm text-white/65">No matches yet.</div>
        ) : null}

        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {results.map((exercise) => {
            const isSelected = selectedIds.has(exercise.id);

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => toggleExercise(exercise)}
                disabled={!enabled || (!isSelected && selected.length >= MAX_SELECTED)}
                className="w-full rounded-xl border px-3 py-2 text-left text-sm text-white/85 transition hover:bg-white/[0.06] disabled:opacity-50"
                style={{
                  borderColor: isSelected ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.1)",
                  background: isSelected ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{exercise.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-white/50">
                    {isSelected ? "Selected" : "Add"}
                  </div>
                </div>
                <div className="text-xs lab-muted">{exercise.category ?? "uncategorized"}</div>
              </button>
            );
          })}
        </div>

        {canCreate ? (
          <button
            type="button"
            onClick={createCustomExercise}
            disabled={creating}
            className="rounded-xl border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-3 py-2 text-sm font-medium text-white hover:bg-[rgba(34,197,94,0.15)]"
          >
            {creating ? "Creating..." : `Create "${debouncedQuery}"`}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
        <div className="text-xs uppercase tracking-wide lab-muted">
          Selected ({selected.length}/{MAX_SELECTED})
        </div>

        {selected.length === 0 ? (
          <div className="text-sm text-white/65">No exercises selected.</div>
        ) : (
          <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {selected.map((exercise) => (
              <li key={exercise.id} className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm text-white/85">{exercise.name}</div>
                  <div className="text-xs lab-muted">{exercise.category ?? "uncategorized"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(exercise.id)}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/[0.06]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selected[0] && router.push(`/exercises/${selected[0].id}`)}
            disabled={selected.length === 0}
            className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Open selected exercises
          </button>
        </div>

        {selected.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((exercise) => (
              <Link
                key={`${exercise.id}-link`}
                href={`/exercises/${exercise.id}`}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.06]"
              >
                {exercise.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
