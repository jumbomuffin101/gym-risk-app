import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { BRAND_ICON_SRC } from "@/lib/brand";
import QuickLogPanel from "@/app/dashboard/QuickLogPanel";
import { computeExerciseRisk } from "@/app/lib/exerciseRisk";
import {
  average,
  calculateSetLoad,
  fatigueLabelFromAvgRpe,
  painTrendLabel,
} from "@/app/lib/trainingMetrics";
import { startOrResumeWorkoutAction } from "@/app/workouts/actions";

export const runtime = "nodejs";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function DashboardPage() {
  const userId = await requireDbUserId();
  const now = new Date();
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const fourteenDaysAgo = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

  const [activeSession, recentSessions, recentSets, previousSets, exercises] = await Promise.all([
    prisma.workoutSession.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: "desc" } }),
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: { id: true, startedAt: true, endedAt: true, note: true, _count: { select: { sets: true } } },
    }),
    prisma.setEntry.findMany({
      where: { userId, performedAt: { gte: sevenDaysAgo } },
      orderBy: { performedAt: "asc" },
      select: { reps: true, weight: true, rpe: true, pain: true, performedAt: true, exerciseId: true },
    }),
    prisma.setEntry.findMany({
      where: { userId, performedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
      select: { pain: true },
    }),
    prisma.exercise.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
  ]);

  const weeklyLoad = recentSets.reduce((sum, set) => sum + calculateSetLoad(set.reps, set.weight), 0);
  const avgRpe = average(recentSets.map((set) => set.rpe).filter((value): value is number => value != null));
  const fatigue = fatigueLabelFromAvgRpe(avgRpe);
  const recentPain = average(recentSets.map((set) => set.pain).filter((value): value is number => value != null));
  const previousPain = average(previousSets.map((set) => set.pain).filter((value): value is number => value != null));
  const painTrend = painTrendLabel(recentPain, previousPain);

  const riskEstimate = computeExerciseRisk(
    recentSets.map((set) => ({ ...set, performedAt: new Date(set.performedAt) }))
  );

  const dayBuckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo);
    day.setDate(day.getDate() + index);
    return startOfDay(day);
  });
  const dailyLoad = dayBuckets.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return recentSets
      .filter((set) => set.performedAt >= day && set.performedAt < dayEnd)
      .reduce((sum, set) => sum + calculateSetLoad(set.reps, set.weight), 0);
  });
  const hasTrend = dailyLoad.some((value) => value > 0);
  const max = hasTrend ? Math.max(...dailyLoad) : 0;
  const points = hasTrend
    ? dailyLoad.map((value, index) => `${(index / 6) * 220},${64 - (value / max) * 48}`).join(" ")
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src={BRAND_ICON_SRC} alt="Gym-Risk" width={32} height={32} className="h-8 w-8 object-contain" />
          <h1 className="text-2xl font-semibold text-white/95">Training overview</h1>
        </div>
        {activeSession ? (
          <Link href={`/workouts/new?sessionId=${activeSession.id}`} className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">Resume workout</Link>
        ) : (
          <form action={startOrResumeWorkoutAction}>
            <button className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black">New workout</button>
          </form>
        )}
      </header>

      {activeSession ? (
        <div className="lab-card rounded-2xl p-4 text-xs text-white/70">In progress • started {new Date(activeSession.startedAt).toLocaleTimeString()}</div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Risk score</div><div className="mt-2 text-2xl text-white/95">{riskEstimate ? riskEstimate.score : "No estimate"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Weekly load</div><div className="mt-2 text-2xl text-white/95">{weeklyLoad > 0 ? Math.round(weeklyLoad).toLocaleString() : "No data yet"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Fatigue</div><div className="mt-2 text-2xl text-white/95">{fatigue ?? "No data yet"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Pain trend</div><div className="mt-2 text-2xl text-white/95">{painTrend ?? "No data yet"}</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <QuickLogPanel exercises={exercises} activeSessionId={activeSession?.id ?? null} />
        <div className="lab-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide lab-muted">Load trend</div>
          {hasTrend ? <svg viewBox="0 0 220 72" className="mt-3 h-20 w-full"><polyline fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="2" points={points} /></svg> : <div className="mt-3 text-xs text-white/70">No data yet</div>}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="lab-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide lab-muted">Recent sessions</div>
          <div className="mt-3 space-y-2">
            {recentSessions.length === 0 ? (
              <div className="text-xs text-white/70">No data yet</div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">
                  {new Date(session.startedAt).toLocaleString()} • {session._count.sets} sets{session.note ? ` • ${session.note}` : ""}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lab-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide lab-muted">Risk feed</div>
          <div className="mt-3 space-y-2">
            {riskEstimate?.drivers.length ? riskEstimate.drivers.map((driver) => (
              <div key={driver} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">{driver}</div>
            )) : <div className="text-xs text-white/70">No data yet</div>}
          </div>
        </div>
      </section>
    </div>
  );
}
