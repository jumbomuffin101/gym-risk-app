"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSetEntryAction } from "@/app/exercises/actions";

type ExerciseOption = { id: string; name: string; category: string | null };

type CreateSetEntryResult =
  | { ok: true; volume: number; risk: number; label: string }
  | { ok: false; error: string };

export default function QuickLogPanel({ exercises }: { exercises: ExerciseOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (exercises.length === 0) {
    return (
      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Quick log</div>
        <div className="mt-3 text-sm text-white/60">
          Add an exercise to start logging sets.
        </div>
        <div className="mt-4">
          <a
            href="/exercises"
            className="inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black"
            style={{
              boxShadow:
                "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
            }}
          >
            Create exercises
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="lab-card rounded-2xl p-5">
      <div className="text-sm font-medium text-white/90">Quick log</div>
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          startTransition(async () => {
            const result = (await createSetEntryAction(formData)) as CreateSetEntryResult;
            if (!result.ok) {
              setError(result.error ?? "Unable to save set.");
              return;
            }
            setSuccess("Set logged.");
            form.reset();
            router.refresh();
          });
        }}
      >
        <label className="space-y-1 block">
          <div className="text-xs text-white/60">Exercise</div>
          <select
            name="exerciseId"
            className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
            required
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <div className="text-xs text-white/60">Reps</div>
            <input
              name="reps"
              type="number"
              min={1}
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
              placeholder="8"
              required
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-white/60">Weight</div>
            <input
              name="weight"
              type="number"
              min={0}
              step="0.5"
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
              placeholder="135"
              required
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-white/60">RPE</div>
            <input
              name="rpe"
              type="number"
              min={1}
              max={10}
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
              placeholder="8"
            />
          </label>

          <label className="space-y-1">
            <div className="text-xs text-white/60">Pain</div>
            <input
              name="pain"
              type="number"
              min={0}
              max={10}
              className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90"
              placeholder="0"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save set"}
        </button>

        {error ? <div className="text-sm text-red-400">{error}</div> : null}
        {success ? <div className="text-sm text-emerald-400">{success}</div> : null}
      </form>
    </div>
  );
}
