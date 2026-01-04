// src/app/exercises/[id]/page.tsx
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { notFound } from "next/navigation";

export const runtime = "nodejs";

export default async function ExerciseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireDbUserId();

  const id = params.id?.trim();
  if (!id) return notFound();

  const ex = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      _count: { select: { sets: true } },
    },
  });

  if (!ex) return notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
          {ex.name}
        </h1>
        <p className="mt-1 text-sm lab-muted">
          {ex.category ?? "Uncategorized"} • {ex._count.sets} sets logged
        </p>
      </header>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-medium text-white/90">Logger</div>
        <p className="mt-2 text-sm lab-muted">
          Paste your set logger UI here (form → createSetEntryAction).
        </p>
      </div>
    </div>
  );
}
