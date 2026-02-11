"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSetEntryAction } from "@/app/exercises/actions";

type ExerciseOption = { id: string; name: string; category: string | null };

export default function QuickLogPanel({
  exercises,
  activeSessionId,
}: {
  exercises: ExerciseOption[];
  activeSessionId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!activeSessionId) {
    return (
      <div className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Quick log</div>
        <div className="mt-3 text-xs text-white/70">Start a workout to log sets.</div>
        <Link href="/workouts/new" className="mt-3 inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">Start workout</Link>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Quick log</div>
        <div className="mt-3 text-xs text-white/70">No exercises yet.</div>
        <Link href="/exercises" className="mt-3 inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">Create exercise</Link>
      </div>
    );
  }

  return (
    <div className="lab-card rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wide lab-muted">Quick log</div>
      <form
        className="mt-3 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          formData.set("sessionId", activeSessionId);
          startTransition(async () => {
            const result = await createSetEntryAction(formData);
            if (!result.ok) {
              setError(result.error ?? "Unable to save set.");
              return;
            }
            form.reset();
            router.refresh();
          });
        }}
      >
        <select name="exerciseId" className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" required>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-4">
          <input name="reps" type="number" min={1} required placeholder="Reps" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
          <input name="weight" type="number" min={0} step="0.5" placeholder="Weight" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
          <input name="rpe" type="number" min={1} max={10} placeholder="RPE" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
          <input name="pain" type="number" min={0} max={10} placeholder="Pain" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        </div>
        <button disabled={pending} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">{pending ? "Saving..." : "Save set"}</button>
        {error ? <div className="text-xs text-red-400">{error}</div> : null}
      </form>
    </div>
  );
}
