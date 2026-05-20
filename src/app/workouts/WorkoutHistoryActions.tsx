"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { deleteWorkoutAction, renameWorkoutAction } from "./actions";

export function WorkoutHistoryActions({
  workoutId,
  initialName,
}: {
  workoutId: string;
  initialName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) {
      setError("Template name cannot be empty.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await renameWorkoutAction({ workoutId, name });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setDraftName(name);
      setEditing(false);
      router.refresh();
    });
  }

  function deleteWorkout() {
    if (!window.confirm("Delete this workout template? This cannot be undone.")) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteWorkoutAction({ workoutId });
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="min-w-0 space-y-2 md:min-w-72">
        <form onSubmit={submitRename} className="flex gap-2">
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Template name"
            maxLength={120}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-[rgba(34,197,94,0.35)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/[0.04] hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </form>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDraftName(initialName);
              setEditing(false);
              setError(null);
            }}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:bg-white/[0.04] hover:text-white/85"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteWorkout}
            disabled={pending}
            className="rounded-lg border border-[rgba(239,68,68,0.28)] px-3 py-2 text-xs text-red-200/80 hover:bg-[rgba(239,68,68,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        </div>
        {error ? <div className="text-xs text-red-200/85">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-start gap-2 md:justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(true);
            setError(null);
          }}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/[0.04] hover:text-white/90"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={deleteWorkout}
          disabled={pending}
          className="rounded-lg border border-[rgba(239,68,68,0.28)] px-3 py-2 text-xs text-red-200/80 hover:bg-[rgba(239,68,68,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {error ? <div className="text-xs text-red-200/85 md:text-right">{error}</div> : null}
    </div>
  );
}
