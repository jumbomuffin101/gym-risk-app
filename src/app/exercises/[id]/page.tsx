import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import SetEntryForm from "@/app/exercises/SetEntryForm";
import { computeExerciseRisk } from "@/app/lib/exerciseRisk";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const userId = await requireDbUserId();
  const id = params.id?.trim();

  const ex = id
    ? await prisma.exercise.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          category: true,
          source: true,
          primaryMuscles: true,
          equipment: true,
          instructions: true,
        },
      })
    : null;

  if (!ex) notFound();

  const recentSets = await prisma.setEntry.findMany({
    where: { exerciseId: ex.id, userId },
    orderBy: { performedAt: "desc" },
    take: 12,
    select: { id: true, performedAt: true, reps: true, weight: true, rpe: true, pain: true },
  });

  const risk = computeExerciseRisk(recentSets.map((set) => ({ ...set, performedAt: new Date(set.performedAt) })));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">{ex.name}</h1>
        <p className="mt-1 text-sm lab-muted">{ex.category ?? "Uncategorized"} • {ex.source}</p>
        <p className="mt-2 text-xs text-white/60">{ex.primaryMuscles ?? "No muscle metadata"}</p>
      </header>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Risk summary</div>
        {risk ? (
          <div className="mt-2 space-y-2 text-xs text-white/80">
            <div>Score {risk.score} • {risk.label}</div>
            {risk.drivers.map((driver) => <div key={driver} className="text-white/65">{driver}</div>)}
          </div>
        ) : (
          <div className="mt-2 text-xs text-white/70">No estimate</div>
        )}
      </div>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Log a set</div>
        <div className="mt-3"><SetEntryForm exerciseId={ex.id} /></div>
      </div>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Recent sets</div>
        <div className="mt-3 space-y-2">
          {recentSets.length === 0 ? (
            <div className="text-xs text-white/70">No data yet</div>
          ) : (
            recentSets.map((set) => (
              <div key={set.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">
                {new Date(set.performedAt).toLocaleString()} • {set.reps} reps • {set.weight > 0 ? `${set.weight} lb` : "Bodyweight"}
                {set.rpe != null ? ` • RPE ${set.rpe}` : ""}
                {set.pain != null ? ` • Pain ${set.pain}` : ""}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
