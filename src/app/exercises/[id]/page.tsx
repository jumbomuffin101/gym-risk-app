// src/app/exercises/[id]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { notFound } from "next/navigation";
import SetEntryForm from "@/app/exercises/SetEntryForm";

export const runtime = "nodejs";

export default async function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await requireDbUserId();

  const id = params.id?.trim();
  if (!id) return notFound();

  const ex = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  if (!ex) return notFound();

  const recentSets = await prisma.setEntry.findMany({
    where: { exerciseId: ex.id },
    orderBy: { performedAt: "desc" },
    take: 6,
    select: { id: true, performedAt: true, reps: true, weight: true, rpe: true, pain: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          {ex.name}
        </h1>
        <p className="mt-1 text-sm lab-muted">
          {ex.category ?? "Uncategorized"} • {setCount} sets logged
        </p>
      </header>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Log a set</div>
        <div className="mt-3">
          <SetEntryForm exerciseId={ex.id} />
        </div>
      </div>

      <div className="lab-card rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/90">Recent sets</div>
          <div className="text-xs text-white/60">{recentSets.length} shown</div>
        </div>
        <div className="mt-4 space-y-2">
          {recentSets.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
              No sets logged yet
            </div>
          ) : (
            recentSets.map((set) => (
              <div
                key={set.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80"
              >
                <span>{new Date(set.performedAt).toLocaleDateString()}</span>
                <span className="text-white/60">
                  {set.reps} reps • {set.weight} lb
                  {set.rpe ? ` • RPE ${set.rpe}` : ""}
                  {set.pain !== null ? ` • Pain ${set.pain}` : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
