"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSetEntryAction } from "@/app/exercises/actions";

type Exercise = { id: string; name: string; category: string | null };

export default function WorkoutLogger({
  sessionId,
  exercises,
}: {
  sessionId: string;
  exercises: Exercise[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("sessionId", sessionId);

        startTransition(async () => {
          const result = await createSetEntryAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
    >
      <label className="block space-y-1">
        <div className="text-xs text-white/60">Exercise</div>
        <select name="exerciseId" className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" required>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-1">
          <div className="text-xs text-white/60">Reps</div>
          <input name="reps" type="number" min={1} required className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-white/60">Weight</div>
          <input name="weight" type="number" min={0} step="0.5" className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" placeholder="optional" />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-white/60">RPE</div>
          <input name="rpe" type="number" min={1} max={10} className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        </label>
        <label className="space-y-1">
          <div className="text-xs text-white/60">Pain</div>
          <input name="pain" type="number" min={0} max={10} className="w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        </label>
      </div>

      <button disabled={pending} className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black disabled:opacity-60">
        {pending ? "Saving..." : "Add set"}
      </button>

      {error ? <div className="text-xs text-red-400">{error}</div> : null}
    </form>
  );
}
