import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { BRAND_ICON_ALT, BRAND_ICON_SRC } from "@/lib/brand";
import QuickLogPanel from "@/app/dashboard/QuickLogPanel";
import { baselineLoad, computeRiskScore, averageRecent, weeklyLoad, type MetricSet } from "@/app/lib/metrics";
import { startOrResumeWorkoutAction } from "@/app/workouts/actions";

export const runtime = "nodejs";

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export default async function DashboardPage() {
  const userId = await requireDbUserId();
  const now = new Date();
  const weekStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [activeSession, exercises, sessions, allSets] = await Promise.all([
    prisma.workoutSession.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: "desc" } }),
    prisma.exercise.findMany({ select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    prisma.workoutSession.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, take: 8, select: { id: true, startedAt: true, note: true, _count: { select: { sets: true } } } }),
    prisma.setEntry.findMany({ where: { userId }, select: { performedAt: true, reps: true, weight: true, rpe: true, pain: true }, orderBy: { performedAt: "asc" } }),
  ]);

  const metricSets: MetricSet[] = allSets.map((set) => ({ ...set, performedAt: new Date(set.performedAt) }));

  const acuteLoad = weeklyLoad(metricSets, weekStart, now);
  const baseline = baselineLoad(metricSets, weekStart);
  const recentSets = metricSets.filter((set) => set.performedAt >= weekStart);
  const avgRpe = averageRecent(recentSets.map((set) => set.rpe));
  const avgPain = averageRecent(recentSets.map((set) => set.pain));
  const risk = computeRiskScore({ acuteLoad, baseline, avgPain, avgRpe });

  const dailyLoads = Array.from({ length: 7 }, (_, index) => {
    const dayStart = startOfDay(new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return weeklyLoad(metricSets, dayStart, dayEnd);
  });
  const maxLoad = Math.max(...dailyLoads, 0);
  const hasTrend = maxLoad > 0;
  const points = hasTrend
    ? dailyLoads.map((value, index) => `${(index / 6) * 220},${64 - (value / maxLoad) * 48}`).join(" ")
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src={BRAND_ICON_SRC} alt={BRAND_ICON_ALT} width={32} height={32} className="h-8 w-8 object-contain" />
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

      {activeSession ? <div className="lab-card rounded-2xl p-4 text-xs text-white/70">In progress</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Weekly load</div><div className="mt-2 text-2xl text-white/95">{acuteLoad > 0 ? Math.round(acuteLoad).toLocaleString() : "Not enough data yet"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Baseline</div><div className="mt-2 text-2xl text-white/95">{baseline != null ? Math.round(baseline).toLocaleString() : "Not enough data yet"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Risk score</div><div className="mt-2 text-2xl text-white/95">{risk ? `${risk.score} (${risk.label})` : "Not enough data yet"}</div></div>
        <div className="lab-card rounded-2xl p-4"><div className="text-xs lab-muted">Recovery signals</div><div className="mt-2 text-sm text-white/85">RPE {avgRpe != null ? avgRpe.toFixed(1) : "—"} • Pain {avgPain != null ? avgPain.toFixed(1) : "—"}</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <QuickLogPanel exercises={exercises} activeSessionId={activeSession?.id ?? null} />
        <div className="lab-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide lab-muted">Load trend</div>
          {hasTrend ? (
            <svg viewBox="0 0 220 72" className="mt-3 h-20 w-full"><polyline fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="2" points={points} /></svg>
          ) : (
            <div className="mt-3 text-xs text-white/70">Not enough data yet</div>
          )}
        </div>
      </section>

      <section className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Recent sessions</div>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-xs text-white/70">No data yet</div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80">
                {new Date(session.startedAt).toLocaleString()} • {session._count.sets} sets{session.note ? ` • ${session.note}` : ""}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
