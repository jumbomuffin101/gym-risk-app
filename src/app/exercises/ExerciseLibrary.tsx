"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ExerciseItem = {
  id: string;
  name: string;
  category: string | null;
  source: "external" | "custom";
  setCount: number;
};

export default function ExerciseLibrary({ initialItems }: { initialItems: ExerciseItem[] }) {
  const router = useRouter();
  const [items] = useState<ExerciseItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(items.map((item) => item.category).filter(Boolean) as string[]);
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
        const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
        return matchesQuery && matchesCategory && matchesSource;
      }),
    [items, query, categoryFilter, sourceFilter]
  );

  async function onCreate(formData: FormData) {
    setError(null);
    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        category: formData.get("category"),
        equipment: formData.get("equipment"),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
    if (!response.ok || !payload?.id) {
      setError(payload?.error ?? "Unable to create exercise.");
      return;
    }

    router.push(`/exercises/${payload.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-3"
        action={(formData) => {
          startTransition(async () => {
            await onCreate(formData);
          });
        }}
      >
        <input name="name" required placeholder="Exercise name" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="category" placeholder="Category" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="equipment" placeholder="Equipment (optional)" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <div className="md:col-span-3 flex items-center justify-between">
          <div className="text-xs text-white/60">Create exercise</div>
          <button disabled={loading} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">{loading ? "Saving..." : "Create"}</button>
        </div>
        {error ? <div className="md:col-span-3 text-xs text-red-400">{error}</div> : null}
      </form>

      <div className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90">
          {categories.map((category) => <option key={category} value={category}>{category === "all" ? "All categories" : category}</option>)}
        </select>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90">
          <option value="all">All sources</option>
          <option value="custom">Custom</option>
          <option value="external">External</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="lab-card rounded-2xl p-5 text-sm text-white/70">No exercises found.</div>
        ) : (
          filtered.map((exercise) => (
            <Link key={exercise.id} href={`/exercises/${exercise.id}`} className="lab-card lab-hover rounded-2xl p-5 block">
              <div className="text-base font-semibold text-white/90">{exercise.name}</div>
              <div className="mt-1 text-xs text-white/60">{exercise.category ?? "Uncategorized"}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/65">
                <span>{exercise.source}</span>
                <span>{exercise.setCount} sets</span>
              </div>
              <div className="mt-2 text-xs text-emerald-300">Choose this exercise →</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
