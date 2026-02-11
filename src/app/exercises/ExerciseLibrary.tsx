"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ExerciseItem = {
  id: string;
  name: string;
  category: string | null;
  source: "external" | "custom";
  setCount: number;
};

export default function ExerciseLibrary() {
  const router = useRouter();
  const [items, setItems] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    fetch("/api/exercises?sync=1", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!mounted) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Unable to load exercises.");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  async function handleCreate(formData: FormData) {
    setError(null);
    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        category: formData.get("category"),
        primaryMuscles: formData.get("primaryMuscles"),
        equipment: formData.get("equipment"),
        instructions: formData.get("instructions"),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to create exercise.");
      return;
    }

    router.push(`/exercises/${payload.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-2"
        action={(formData) => {
          startTransition(async () => {
            await handleCreate(formData);
          });
        }}
      >
        <input name="name" required placeholder="Exercise name" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="category" placeholder="Category" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="primaryMuscles" placeholder="Primary muscles (optional)" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <input name="equipment" placeholder="Equipment (optional)" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <textarea name="instructions" placeholder="Instructions (optional)" className="md:col-span-2 min-h-20 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <div className="md:col-span-2 flex items-center justify-between">
          <div className="text-xs text-white/60">Create exercise</div>
          <button disabled={pending} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-60">{pending ? "Saving..." : "Create"}</button>
        </div>
        {error ? <div className="md:col-span-2 text-xs text-red-400">{error}</div> : null}
      </form>

      <div className="lab-card rounded-2xl p-4 grid gap-3 md:grid-cols-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90" />
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90">
          {categories.map((category) => <option key={category} value={category}>{category === "all" ? "All categories" : category}</option>)}
        </select>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/90">
          <option value="all">All sources</option>
          <option value="external">External</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {loading ? <div className="lab-card rounded-2xl p-5 text-sm text-white/70">Loading…</div> : null}

      {!loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="lab-card rounded-2xl p-5 text-sm text-white/70">No data yet</div>
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
      ) : null}
    </div>
  );
}
