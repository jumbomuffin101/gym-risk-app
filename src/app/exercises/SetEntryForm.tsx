"use client";

import { useState, useTransition } from "react";
import { createSetEntryAction, type CreateSetEntryResult } from "./actions";

export default function SetEntryForm({ exerciseId }: { exerciseId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  return (
    <form
      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3"
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

      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-white/60">Reps</div>
          <input
            name="reps"
            type="number"
            min={1}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90"
            placeholder="8"
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-white/60">Weight</div>
          <input
            name="weight"
            type="number"
            min={0}
            step="0.5"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90"
            placeholder="135"
            required
          />
        </label>

        <label className="space-y-1">
          <div className="text-xs uppercase tracking-wide text-white/60">RPE (optional)</div>
          <input
            name="rpe"
            type="number"
            min={1}
            max={10}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90"
            placeholder="8"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {pending ? "Saving..." : "Add set"}
      </button>

      {error ? <div className="text-sm text-rose-200">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-200">{success}</div> : null}
    </form>
  );
}
