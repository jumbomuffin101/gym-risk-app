"use client";

import { useState, useTransition } from "react";
import { createSetEntryAction } from "./actions";
type CreateSetEntryResult =
  | { ok: true; volume: number; risk: number; label: string }
  | { ok: false; error: string };

export default function SetEntryForm({ exerciseId }: { exerciseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="rounded-xl border p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const form = e.currentTarget;
        const fd = new FormData(form);

        startTransition(async () => {
          const res = (await createSetEntryAction(fd)) as CreateSetEntryResult;


          if (!res.ok) {
            setError(res.error ?? "Something went wrong.");
            return;
          }

          setSuccess("Set saved successfully.");
          form.reset();
        });
      }}
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />

      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1">
          <div className="text-xs text-gray-600">Reps</div>
          <input
            name="reps"
            type="number"
            min={1}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="8"
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-gray-600">Weight</div>
          <input
            name="weight"
            type="number"
            min={0}
            step="0.5"
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="135"
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs text-gray-600">RPE (optional)</div>
          <input
            name="rpe"
            type="number"
            min={1}
            max={10}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="8"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Saving..." : "Add set"}
      </button>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-700">{success}</div> : null}
    </form>
  );
}
