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
  initialSelectedExerciseIds: string[];
};

const MAX_SELECTED = 10;

export default function ExercisePicker({ enabled, initialSelectedExerciseIds }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionReady, setSelectionReady] = useState(initialSelectedExerciseIds.length === 0);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setSelected([]);
      setLoading(false);
      setError(null);
      setSelectionReady(initialSelectedExerciseIds.length === 0);
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

  useEffect(() => {
    if (!enabled) return;
    if (initialSelectedExerciseIds.length === 0) {
      setSelected([]);
      setSelectionReady(true);
      return;
    }

    let cancelled = false;
    setSelectionReady(false);

    async function loadSelectedExercises() {
      try {
        const response = await fetch(`/api/exercises?ids=${initialSelectedExerciseIds.join(",")}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to load exercise catalog");
        }

        const data = (await response.json()) as { exercises?: Exercise[] } | Exercise[];
        const exercises = Array.isArray(data) ? data : data.exercises ?? [];
        const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
        const nextSelected = initialSelectedExerciseIds
          .map((id) => byId.get(id))
          .filter((exercise): exercise is Exercise => Boolean(exercise));

        if (!cancelled) {
          setSelected(nextSelected);
          setSelectionReady(true);
        }
      } catch {
        if (!cancelled) {
          setSelected([]);
          setSelectionReady(true);
        }
      }
    }

    void loadSelectedExercises();

    return () => {
      cancelled = true;
    };
  }, [enabled, initialSelectedExerciseIds]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const selectedQuery = useMemo(() => {
    if (selected.length === 0) return "";

    const params = new URLSearchParams({
      selected: selected.map((item) => item.id).join(","),
    });

    return `?${params.toString()}`;
  }, [selected]);

  useEffect(() => {
    if (!enabled || !selectionReady) return;

    const controller = new AbortController();

    async function persistSelection() {
      try {
        await fetch("/api/sessions/active", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedExerciseIds: selected.map((item) => item.id) }),
          signal: controller.signal,
        });
      } catch {
        // Ignore plan persistence failures in the UI; navigation still works via query string fallback.
      }
    }

    void persistSelection();

    return () => controller.abort();
  }, [enabled, selected, selectionReady]);

  function removeExercise(id: string) {
    setSelected((prev) => prev.filter((item) => item.id !== id));
  }

  function moveExercise(id: string, direction: "up" | "down") {
    setSelected((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
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
    <div className="grid gap-4 lg:grid-cols-[1fr_0.92fr]">
      <section className="lab-card lab-hover rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/90">Search exercises</div>
          <div className="text-xs text-white/50">Max {MAX_SELECTED}</div>
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
          {loading ? <div className="text-sm text-white/70">Loading matches...</div> : null}
          {!loading && results.length === 0 ? (
            <div className="text-sm text-white/65">
              {debouncedQuery ? "No matches yet." : "Start with a search or pick from the list."}
            </div>
          ) : null}

          <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
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
                      {isSelected ? "Queued" : "Add"}
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
              className="rounded-xl border border-[rgba(34,197,94,0.24)] bg-[rgba(34,197,94,0.92)] px-3 py-2 text-sm font-semibold text-black hover:bg-[rgba(34,197,94,0.84)]"
            >
              {creating ? "Creating..." : `Create "${debouncedQuery}"`}
            </button>
          ) : null}
        </div>
      </section>

      <section className="lab-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white/90">Session queue</div>
          <div className="text-xs text-white/50">
            {selected.length}/{MAX_SELECTED}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
          <div className="text-xs uppercase tracking-wide lab-muted">Queue order</div>

          {selected.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/65">
              Add a few exercises to build the session.
            </div>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {selected.map((exercise, index) => (
                <li
                  key={exercise.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-white/65">
                        {index + 1}
                      </div>
                      <div className="truncate text-sm text-white/85">{exercise.name}</div>
                    </div>
                    <div className="mt-1 text-xs lab-muted">{exercise.category ?? "uncategorized"}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveExercise(exercise.id, "up")}
                      disabled={index === 0}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExercise(exercise.id, "down")}
                      disabled={index === selected.length - 1}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExercise(exercise.id)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/[0.06]"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selected[0] && router.push(`/exercises/${selected[0].id}${selectedQuery}`)}
              disabled={selected.length === 0}
              className="lab-hover rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {selectionReady && initialSelectedExerciseIds.length > 0 ? "Resume queue" : "Start queue"}
            </button>
            {selected.length > 0 ? (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
              >
                Clear queue
              </button>
            ) : null}
          </div>

          {selected.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {selected.map((exercise) => (
                <Link
                  key={`${exercise.id}-link`}
                  href={`/exercises/${exercise.id}${selectedQuery}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/80 hover:bg-white/[0.06]"
                >
                  {exercise.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
