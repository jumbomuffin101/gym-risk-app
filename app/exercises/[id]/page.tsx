import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SetEntryForm from "./SetEntryForm";
import { getRecentSetsForExercise } from "@/lib/data/setEntries";
import type { SetEntry } from "@prisma/client";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatNumber(n: number) {
  // Avoid showing 135.0000001, also keeps it readable
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const exercise = await prisma.exercise.findUnique({
    where: { id },
  });
  if (!exercise) notFound();

  const sets = await getRecentSetsForExercise(id, 10);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border bg-white p-5">
        <h1 className="text-2xl font-semibold leading-tight">
          {exercise.name ?? "Untitled Exercise"}
        </h1>
        <div className="mt-1 text-xs text-gray-500">Exercise ID: {exercise.id}</div>
      </div>

      {/* Form */}
      <SetEntryForm exerciseId={exercise.id} />

      {/* Recent sets */}
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b p-4">
          <div className="font-medium">Recent sets</div>
          <div className="text-xs text-gray-500">{sets.length} shown</div>
        </div>

        {sets.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            No sets yet. Add your first one above.
          </div>
        ) : (
          <ul className="divide-y">
            {sets.map((s: SetEntry) => (
              <li key={String(s.id)} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {s.reps} reps @ {formatNumber(s.weight)}
                      {s.rpe != null ? (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          RPE {formatNumber(s.rpe)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {s.performedAt
                        ? new Date(s.performedAt).toLocaleString()
                        : "No timestamp recorded"}
                    </div>
                  </div>

                  {/* Right-side badges */}
                  <div className="flex flex-col items-end gap-1">
                    {s.pain != null ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        Pain: {formatNumber(s.pain)}
                      </span>
                    ) : null}

                    {/* If you later add riskScore to Prisma, swap this in.
                        For now it's intentionally not referenced to avoid TS errors. */}
                    {/* {s.riskScore != null ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        Risk: {formatNumber(s.riskScore)}
                      </span>
                    ) : null} */}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
