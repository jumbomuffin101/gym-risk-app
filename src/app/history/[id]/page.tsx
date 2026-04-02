import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import { prisma } from "@/app/lib/prisma";
import { computeSessionLoad } from "@/lib/metrics/load";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistorySessionDetailPage({ params }: PageProps) {
  const userId = await requireDbUserId();
  const { id } = await params;

  const session = await prisma.workoutSession.findFirst({
    where: {
      id,
      userId,
      endedAt: { not: null },
    },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      note: true,
      sets: {
        orderBy: [{ performedAt: "asc" }],
        select: {
          id: true,
          performedAt: true,
          reps: true,
          weight: true,
          rpe: true,
          pain: true,
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  const riskReasons = await computeSessionRisk(userId, session.id);
  const sessionLoad = computeSessionLoad(session.sets);
  const avgRpe = averageOf(session.sets.map((set) => set.rpe).filter(isNumber));
  const maxPain = maxOf(session.sets.map((set) => set.pain).filter(isNumber));
  const groupedExercises = groupSessionExercises(session.sets);
  const signal = getSessionSignal({ reasonsCount: riskReasons.length, avgRpe, maxPain });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="lab-card rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/history"
            className="rounded-full border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.1)] px-3 py-1.5 text-sm text-white"
          >
            History
          </Link>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/75">
            Session detail
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Past session</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-white/95">
              {session.note?.trim() || formatSessionDateTime(session.startedAt)}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {formatSessionDuration(session.startedAt, session.endedAt)} • {session.sets.length} sets •{" "}
              {groupedExercises.length} exercises
            </p>
          </div>

          <div className={`rounded-full border px-3 py-1.5 text-sm ${signal.classes}`}>{signal.label}</div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailMetric label="Session load" value={sessionLoad.toFixed(1)} />
        <DetailMetric label="Avg RPE" value={avgRpe !== null ? avgRpe.toFixed(1) : "-"} />
        <DetailMetric label="Max pain" value={maxPain !== null ? String(maxPain) : "-"} />
        <DetailMetric label="Watchouts" value={String(riskReasons.length)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <section className="lab-card rounded-2xl p-4 space-y-3">
          <div className="text-sm font-semibold text-white/90">Exercise breakdown</div>

          <div className="space-y-3">
            {groupedExercises.map((exercise) => (
              <div key={exercise.exerciseId} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white/90">{exercise.name}</div>
                    <div className="mt-1 text-xs text-white/55">{exercise.category ?? "Uncategorized"}</div>
                  </div>
                  <div className="text-xs text-white/55">{exercise.sets.length} sets</div>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <DetailMetric label="Session load" value={exercise.sessionLoad.toFixed(1)} compact />
                  <DetailMetric label="Avg RPE" value={exercise.avgRpe !== null ? exercise.avgRpe.toFixed(1) : "-"} compact />
                  <DetailMetric label="Max pain" value={exercise.maxPain !== null ? String(exercise.maxPain) : "-"} compact />
                  <DetailMetric label="Category" value={exercise.category ?? "-"} compact />
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/10">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-white/50">
                        <th className="px-3 py-2 pr-4">Time</th>
                        <th className="py-2 pr-4">Reps</th>
                        <th className="py-2 pr-4">Load</th>
                        <th className="py-2 pr-4">Details</th>
                        <th className="py-2 pr-4">RPE</th>
                        <th className="py-2 pr-4">Pain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercise.sets.map((set) => (
                        <tr key={set.id} className="border-t border-white/10 text-white/85">
                          <td className="px-3 py-2 pr-4">{formatTime(set.performedAt)}</td>
                          <td className="py-2 pr-4">{set.reps}</td>
                          <td className="py-2 pr-4">{set.weight}</td>
                          <td className="py-2 pr-4 text-white/65">{formatSetDetails(set)}</td>
                          <td className="py-2 pr-4">{set.rpe ?? "-"}</td>
                          <td className="py-2 pr-4">{set.pain ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Session read</div>
            <div className={`rounded-2xl border p-4 ${signal.panelClasses}`}>
              <div className="text-xs uppercase tracking-wide text-white/60">Retrospective signal</div>
              <div className="mt-1 text-lg font-semibold text-white/90">{signal.label}</div>
              <div className="mt-1 text-sm text-white/70">{signal.description}</div>
            </div>
          </section>

          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Watchouts</div>
            {riskReasons.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
                No major watchouts were flagged in this session.
              </div>
            ) : (
              <div className="space-y-2">
                {riskReasons.map((reason) => (
                  <div key={reason.kind + reason.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="text-sm text-white/85">{reason.title}</div>
                    <div className="mt-1 text-xs text-white/55">Score {Math.round(reason.score)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] ${compact ? "p-2.5" : "p-3"}`}>
      <div className="text-[11px] uppercase tracking-wide lab-muted">{label}</div>
      <div className={`mt-1 font-semibold text-white/90 ${compact ? "text-sm" : "text-base"}`}>{value}</div>
    </div>
  );
}

function groupSessionExercises(
  sets: Array<{
    id: string;
    performedAt: Date;
    reps: number;
    weight: number;
    durationSeconds?: number | null;
    distanceMeters?: number | null;
    rpe: number | null;
    pain: number | null;
    notes?: string | null;
    exercise: {
      id: string;
      name: string;
      category: string | null;
    };
  }>
) {
  const map = new Map<
    string,
    {
      exerciseId: string;
      name: string;
      category: string | null;
      sets: typeof sets;
      sessionLoad: number;
      avgRpe: number | null;
      maxPain: number | null;
    }
  >();

  for (const set of sets) {
    const existing =
      map.get(set.exercise.id) ??
      {
        exerciseId: set.exercise.id,
        name: set.exercise.name,
        category: set.exercise.category,
        sets: [],
        sessionLoad: 0,
        avgRpe: null,
        maxPain: null,
      };

    existing.sets.push(set);
    existing.sessionLoad += computeSessionLoad([set]);
    const rpes = existing.sets.map((item) => item.rpe).filter(isNumber);
    existing.avgRpe = averageOf(rpes);
    const pains = existing.sets.map((item) => item.pain).filter(isNumber);
    existing.maxPain = maxOf(pains);
    map.set(set.exercise.id, existing);
  }

  return [...map.values()].sort((a, b) => b.sessionLoad - a.sessionLoad);
}

function getSessionSignal({
  reasonsCount,
  avgRpe,
  maxPain,
}: {
  reasonsCount: number;
  avgRpe: number | null;
  maxPain: number | null;
}) {
  if ((maxPain ?? 0) >= 7 || reasonsCount >= 2 || (avgRpe ?? 0) >= 9) {
    return {
      label: "High stress",
      description: "This session carried elevated warning signals and is worth reviewing before repeating the same load.",
      classes: "border-rose-400/25 bg-rose-500/10 text-white/85",
      panelClasses: "border-rose-400/25 bg-rose-500/10",
    };
  }

  if ((maxPain ?? 0) >= 4 || reasonsCount >= 1 || (avgRpe ?? 0) >= 8) {
    return {
      label: "Watch",
      description: "The session was productive, but at least one load, effort, or pain signal deserves attention.",
      classes: "border-amber-300/25 bg-amber-400/10 text-white/85",
      panelClasses: "border-amber-300/25 bg-amber-400/10",
    };
  }

  return {
    label: "Stable",
    description: "The session stayed inside manageable ranges with no major watchouts.",
    classes: "border-emerald-400/25 bg-emerald-500/10 text-white/85",
    panelClasses: "border-emerald-400/25 bg-emerald-500/10",
  };
}

function formatSessionDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSessionDuration(startedAt: Date, endedAt: Date | null) {
  if (!endedAt) {
    return "Active session";
  }

  const minutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} hr`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSetDetails(set: {
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  notes?: string | null;
}) {
  const parts: string[] = [];

  if (set.durationSeconds !== null) {
    parts.push(`${set.durationSeconds}s`);
  }

  if (set.distanceMeters !== null) {
    parts.push(`${set.distanceMeters}m`);
  }

  if (set.notes) {
    parts.push(set.notes);
  }

  return parts.length > 0 ? parts.join(" | ") : "-";
}

function isNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function averageOf(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxOf(values: number[]) {
  if (values.length === 0) return null;
  return Math.max(...values);
}
