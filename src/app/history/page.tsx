import Link from "next/link";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import { prisma } from "@/app/lib/prisma";
import { computeSessionLoad } from "@/lib/metrics/load";

export const runtime = "nodejs";

type SessionListItem = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  note: string | null;
  sets: Array<{
    reps: number;
    weight: number;
    durationSeconds: number | null;
    distanceMeters: number | null;
    rpe: number | null;
    pain: number | null;
    exercise: {
      name: string;
      category: string | null;
    };
  }>;
  _count: {
    sets: number;
  };
};

export default async function HistoryPage() {
  const userId = await requireDbUserId();

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 16,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      note: true,
      sets: {
        orderBy: { performedAt: "asc" },
        select: {
          reps: true,
          weight: true,
          durationSeconds: true,
          distanceMeters: true,
          rpe: true,
          pain: true,
          exercise: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
      _count: { select: { sets: true } },
    },
  });

  const completedSessions = sessions.filter((session) => session.endedAt !== null);
  const [riskBySession, recentExerciseLeaders] = await Promise.all([
    Promise.all(
      completedSessions.slice(0, 8).map(async (session) => ({
        sessionId: session.id,
        reasons: await computeSessionRisk(userId, session.id),
      }))
    ),
    prisma.setEntry.groupBy({
      by: ["exerciseId"],
      where: { userId },
      _count: { exerciseId: true },
      orderBy: { _count: { exerciseId: "desc" } },
      take: 5,
    }),
  ]);

  const riskMap = new Map(riskBySession.map((entry) => [entry.sessionId, entry.reasons]));
  const sessionsWithSummary = completedSessions.map((session) => buildSessionSummary(session, riskMap.get(session.id) ?? []));
  const totalLoggedSets = sessionsWithSummary.reduce((sum, session) => sum + session.setCount, 0);
  const totalLoad = sessionsWithSummary.reduce((sum, session) => sum + session.sessionLoad, 0);
  const avgSessionLoad = sessionsWithSummary.length > 0 ? totalLoad / sessionsWithSummary.length : 0;
  const highestRiskSession = sessionsWithSummary[0]
    ? [...sessionsWithSummary].sort((a, b) => b.watchouts.length - a.watchouts.length || b.sessionLoad - a.sessionLoad)[0]
    : null;

  const leaderExercises =
    recentExerciseLeaders.length > 0
      ? await prisma.exercise.findMany({
          where: { id: { in: recentExerciseLeaders.map((item) => item.exerciseId) } },
          select: { id: true, name: true, category: true },
        })
      : [];
  const leaderMap = new Map(leaderExercises.map((exercise) => [exercise.id, exercise]));

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="lab-card rounded-2xl p-4 space-y-2.5">
        <div className="text-xs uppercase tracking-wide lab-muted">History</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white/95">Session timeline</h1>
        <p className="text-sm text-white/70">
          Review finished sessions, see where load clustered, and spot which sessions carried the most watchouts.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HistoryMetric label="Completed sessions" value={String(sessionsWithSummary.length)} />
        <HistoryMetric label="Logged sets" value={String(totalLoggedSets)} />
        <HistoryMetric label="Avg session load" value={avgSessionLoad > 0 ? avgSessionLoad.toFixed(1) : "-"} />
        <HistoryMetric
          label="Most flagged"
          value={highestRiskSession ? formatSessionDate(highestRiskSession.startedAt) : "-"}
          help={highestRiskSession ? `${highestRiskSession.watchouts.length} watchouts` : "No completed sessions yet"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="lab-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white/90">Recent sessions</div>
              <div className="mt-1 text-xs text-white/55">Newest completed sessions first.</div>
            </div>
            <Link
              href="/workouts/new"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/80 hover:bg-white/[0.06]"
            >
              Start workout flow
            </Link>
          </div>

          {sessionsWithSummary.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
              No finished sessions yet. Complete a session and it will show up here with load and watchout summaries.
            </div>
          ) : (
            <div className="space-y-3">
              {sessionsWithSummary.map((session) => (
                <Link
                  key={session.id}
                  href={`/history/${session.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3 transition hover:bg-white/[0.04]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white/90">{formatSessionDateTime(session.startedAt)}</div>
                      <div className="mt-1 text-xs text-white/55">
                        {session.durationLabel} • {session.setCount} sets • {session.exerciseCount} exercises
                      </div>
                    </div>
                    <div className={`rounded-full border px-2.5 py-1 text-[11px] ${session.signal.classes}`}>
                      {session.signal.label}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-4">
                    <HistoryMetric label="Session load" value={session.sessionLoad.toFixed(1)} compact />
                    <HistoryMetric label="Avg RPE" value={session.avgRpe !== null ? session.avgRpe.toFixed(1) : "-"} compact />
                    <HistoryMetric label="Max pain" value={session.maxPain !== null ? String(session.maxPain) : "-"} compact />
                    <HistoryMetric label="Watchouts" value={String(session.watchouts.length)} compact />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {session.exercises.map((exercise) => (
                      <span
                        key={`${session.id}-${exercise.name}`}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/75"
                      >
                        {exercise.name}
                      </span>
                    ))}
                  </div>

                  {session.watchouts.length > 0 ? (
                    <div className="space-y-2">
                      {session.watchouts.slice(0, 2).map((watchout) => (
                        <div
                          key={`${session.id}-${watchout.kind}-${watchout.title}`}
                          className="rounded-xl border border-white/10 bg-black/10 p-3"
                        >
                          <div className="text-xs uppercase tracking-wide text-white/50">{watchout.label}</div>
                          <div className="mt-1 text-sm text-white/85">{watchout.title}</div>
                          <div className="mt-1 text-xs text-white/55">{watchout.detail}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white/70">
                      No major watchouts were flagged in this session.
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">Most repeated exercises</div>
            {recentExerciseLeaders.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
                Exercise trends will appear once you log a few sessions.
              </div>
            ) : (
              <div className="space-y-2">
                {recentExerciseLeaders.map((entry, index) => {
                  const exercise = leaderMap.get(entry.exerciseId);
                  return (
                    <div key={entry.exerciseId} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-white/85">
                            {index + 1}. {exercise?.name ?? "Exercise"}
                          </div>
                          <div className="mt-1 text-xs text-white/55">{exercise?.category ?? "Uncategorized"}</div>
                        </div>
                        <div className="text-xs text-white/55">{entry._count.exerciseId} sets</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="lab-card rounded-2xl p-4 space-y-3">
            <div className="text-sm font-semibold text-white/90">History note</div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/75">
              Use this page to look for session-level patterns, not single-set decisions. The goal is to spot how load,
              effort, and pain changed across finished workouts.
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function HistoryMetric({
  label,
  value,
  help,
  compact = false,
}: {
  label: string;
  value: string;
  help?: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.03] ${compact ? "p-2.5" : "p-3"}`}>
      <div className="text-[11px] uppercase tracking-wide lab-muted">{label}</div>
      <div className={`mt-1 font-semibold text-white/90 ${compact ? "text-sm" : "text-base"}`}>{value}</div>
      {help ? <div className="mt-1 text-[11px] text-white/50">{help}</div> : null}
    </div>
  );
}

function buildSessionSummary(session: SessionListItem, reasons: Awaited<ReturnType<typeof computeSessionRisk>>) {
  const sessionLoad = computeSessionLoad(session.sets);
  const avgRpe = averageOf(session.sets.map((set) => set.rpe).filter(isNumber));
  const maxPain = maxOf(session.sets.map((set) => set.pain).filter(isNumber));
  const exercises = Array.from(new Set(session.sets.map((set) => set.exercise.name))).slice(0, 5);
  const signal = getSessionSignal({ reasonsCount: reasons.length, avgRpe, maxPain });

  return {
    id: session.id,
    startedAt: session.startedAt,
    setCount: session._count.sets,
    exerciseCount: new Set(session.sets.map((set) => set.exercise.name)).size,
    sessionLoad,
    avgRpe,
    maxPain,
    durationLabel: formatSessionDuration(session.startedAt, session.endedAt),
    exercises: exercises.map((name) => ({ name })),
    watchouts: reasons.map(mapHistoryWatchout),
    signal,
  };
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
      classes: "border-rose-400/25 bg-rose-500/10 text-white/85",
    };
  }

  if ((maxPain ?? 0) >= 4 || reasonsCount >= 1 || (avgRpe ?? 0) >= 8) {
    return {
      label: "Watch",
      classes: "border-amber-300/25 bg-amber-400/10 text-white/85",
    };
  }

  return {
    label: "Stable",
    classes: "border-emerald-400/25 bg-emerald-500/10 text-white/85",
  };
}

function mapHistoryWatchout(reason: Awaited<ReturnType<typeof computeSessionRisk>>[number]) {
  switch (reason.kind) {
    case "pain_flag":
      return {
        kind: reason.kind,
        label: "Pain",
        title: "Pain was the main issue in this session",
        detail:
          typeof reason.details.maxPain === "number"
            ? `Pain peaked at ${reason.details.maxPain}/10.`
            : "Pain crossed the session threshold.",
      };
    case "conditioning_density":
    case "conditioning_load_spike":
      return {
        kind: reason.kind,
        label: "Conditioning",
        title: "Conditioning drove most of the strain",
        detail: typeof reason.details.pct === "number"
          ? `Conditioning load ran about ${reason.details.pct}% above baseline.`
          : "Long or dense conditioning work pushed fatigue higher.",
      };
    case "volume_spike":
      return {
        kind: reason.kind,
        label: "Load spike",
        title: "One movement bucket ran ahead of baseline",
        detail:
          typeof reason.details.category === "string" && typeof reason.details.pct === "number"
            ? `${reason.details.category} load was about ${reason.details.pct}% above baseline.`
            : "Load rose faster than the recent pattern.",
      };
    case "rpe_spike":
    case "rpe_warning":
      return {
        kind: reason.kind,
        label: "Intensity",
        title: "Hard sets clustered in this session",
        detail: "Near-max effort showed up often enough to flag recovery pressure.",
      };
    default:
      return {
        kind: reason.kind,
        label: "Watchout",
        title: reason.title,
        detail: "This session triggered a rule-based watchout.",
      };
  }
}

function formatSessionDuration(startedAt: Date, endedAt: Date | null) {
  if (!endedAt) {
    return "Active session";
  }

  const minutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} hr`;
}

function formatSessionDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatSessionDateTime(date: Date) {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
