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

  const categories = useMemo(() => {
    const set = new Set(exercises.map((exercise) => exercise.category).filter(Boolean) as string[]);
    return ["all", ...Array.from(set).sort()];
  }, [exercises]);

  const filtered = useMemo(
    () => exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(query.toLowerCase()) && (category === "all" || exercise.category === category)
    ),
    [exercises, query, category]
  );

  return (
    <div className="space-y-4">
      <form
        className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = event.currentTarget;
          const formData = new FormData(form);
          startTransition(async () => {
            const result = (await createExerciseAction(formData)) as CreateExerciseResult;
            if (!result.ok) {
              setError(result.error);
              return;
            }
            form.reset();
            location.reload();
          });
        }}
      >
        <input name="name" required placeholder="Exercise name" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="category" placeholder="Category (optional)" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <button disabled={pending} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">{pending ? "Saving..." : "Add"}</button>
        {error ? <div className="md:col-span-3 text-xs text-red-400">{error}</div> : null}
      </form>

      <div className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90">
          {categories.map((cat) => <option key={cat} value={cat}>{cat === "all" ? "All categories" : cat}</option>)}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="lab-card rounded-2xl p-5 text-sm text-white/70">No data yet</div>
        ) : (
          filtered.map((exercise) => (
            <Link key={exercise.id} href={`/exercises/${exercise.id}`} className="lab-card lab-hover rounded-2xl p-5 block">
              <div className="text-base font-semibold text-white/90">{exercise.name}</div>
              <div className="mt-1 text-xs text-white/60">{exercise.category ?? "Uncategorized"}</div>
              <div className="mt-3 text-xs text-white/70">{exercise._count.sets} sets</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
