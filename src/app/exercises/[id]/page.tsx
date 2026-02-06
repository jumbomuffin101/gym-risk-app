// src/app/exercises/[id]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { notFound } from "next/navigation";
import SetEntryForm from "../SetEntryForm";
import ExerciseRiskSummary from "../ExerciseRiskSummary";

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

  const setCount = await prisma.setEntry.count({
    where: { exerciseId: ex.id, userId },
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

      <div className="lab-card rounded-2xl p-5 space-y-4">
        <ExerciseRiskSummary exerciseId={ex.id} />
      </div>

      <div id="log-sets" className="lab-card rounded-2xl p-5 space-y-3">
        <div>
          <div className="text-sm font-semibold text-white/90">Log a set</div>
          <p className="mt-1 text-sm lab-muted">
            Add reps, weight, and optional RPE to update your exercise risk score.
          </p>
        </div>
        <SetEntryForm exerciseId={ex.id} />
      </div>
    </div>
  );
}
