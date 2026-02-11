// src/app/dashboard/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { BRAND_ICON_SRC } from "@/lib/brand";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import Link from "next/link";


export const runtime = "nodejs";

function daysAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function DashboardPage() {
  await requireDbUserId();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) redirect("/signin?callbackUrl=/dashboard");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) redirect("/signin?callbackUrl=/dashboard");

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 8,
    select: {
      id: true,
      startedAt: true,
      _count: { select: { sets: true } },
    },
  });

  const lastSessionAgo =
    sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  const hasAnySets = (await prisma.setEntry.count({ where: { userId: user.id } })) > 0;

  const now = new Date();
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const recentSets = await prisma.setEntry.findMany({
    where: { userId: user.id, performedAt: { gte: sevenDaysAgo } },
    select: { reps: true, weight: true, rpe: true, pain: true, performedAt: true },
  });

  const latestSet = await prisma.setEntry.findFirst({
    where: { userId: user.id },
    orderBy: { performedAt: "desc" },
    select: { sessionId: true },
  });

  const riskReasons = latestSet ? await computeSessionRisk(user.id, latestSet.sessionId) : [];
  const riskScore = riskReasons[0]?.score ?? null;

  const weeklyLoad = recentSets.reduce((sum, set) => sum + set.reps * set.weight, 0);
  const avgRpeValues = recentSets.map((set) => set.rpe).filter((val): val is number => val !== null);
  const avgRpe =
    avgRpeValues.length > 0
      ? avgRpeValues.reduce((sum, val) => sum + val, 0) / avgRpeValues.length
      : null;
  const fatigueLabel =
    avgRpe === null ? "Not available" : avgRpe >= 8 ? "High" : avgRpe >= 6 ? "Moderate" : "Low";

  const dayBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + index);
    return startOfDay(date);
  });

  const dailyTotals = dayBuckets.map((day) => {
    const dayEnd = new Date(day);
    dayEnd.setDate(day.getDate() + 1);
    return recentSets
      .filter((set) => set.performedAt >= day && set.performedAt < dayEnd)
      .reduce((sum, set) => sum + set.reps * set.weight, 0);
  });

  const hasTrendData = dailyTotals.some((total) => total > 0);
  const maxTrend = hasTrendData ? Math.max(...dailyTotals) : 0;
  const trendPoints = hasTrendData
    ? dailyTotals
        .map((total, index) => {
          const x = (index / (dailyTotals.length - 1)) * 240;
          const y = 68 - (total / maxTrend) * 56;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ")
    : "";

  const activeDays = dailyTotals.filter((total) => total > 0).length;
  const sevenDayAverage = activeDays > 0 ? Math.round(weeklyLoad / activeDays) : null;
  const latestDayLoad = dailyTotals[dailyTotals.length - 1] ?? 0;
  const priorActiveLoads = dailyTotals.slice(0, -1).filter((total) => total > 0);
  const priorAverageLoad =
    priorActiveLoads.length > 0
      ? priorActiveLoads.reduce((sum, total) => sum + total, 0) / priorActiveLoads.length
      : null;
  const loadSpike =
    !hasAnySets || priorAverageLoad === null || latestDayLoad === 0
      ? "Not available"
      : latestDayLoad > priorAverageLoad * 1.3
        ? "Elevated"
        : "Stable";
  const recovery =
    !hasAnySets || lastSessionAgo === null
      ? "Not available"
      : lastSessionAgo >= 3
        ? "Due"
        : "On track";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-10 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src={BRAND_ICON_SRC}
            alt="Gym-Risk"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Dashboard</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
              Training overview
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/60">
            {sessions.length === 0 ? "No recent sessions" : `Last session ${lastSessionAgo}d ago`}
          </div>
          <Link
            href="/workouts/new"
            className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black"
            style={{
              boxShadow:
                "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
            }}
          >
            Start workout
          </Link>
          <Link
            href="/history"
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/85"
          >
            View history
          </Link>
        </div>
      </header>

      {!hasAnySets ? (
        <div className="lab-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">No data yet</div>
            <div className="mt-1 text-xs text-white/60">
              Log your first workout to unlock metrics.
            </div>
          </div>
          <Link
            href="/workouts/new"
            className="rounded-xl bg-[rgba(34,197,94,0.92)] px-4 py-2 text-xs font-semibold text-black"
            style={{
              boxShadow:
                "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.12)",
            }}
          >
            Start logging
          </Link>
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Primary metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Weekly load</div>
            <div className="mt-3 text-3xl font-semibold text-white/95">
              {recentSets.length === 0 ? "—" : weeklyLoad.toLocaleString()}
            </div>
          </div>

          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">7-day avg load</div>
            <div className="mt-3 text-3xl font-semibold text-white/95">
              {sevenDayAverage === null ? "—" : sevenDayAverage.toLocaleString()}
            </div>
          </div>

          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Injury risk score</div>
            <div className="mt-3 text-3xl font-semibold text-white/95">
              {!hasAnySets ? "—" : riskScore ?? "Baseline"}
            </div>
          </div>

          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">7-day sparkline</div>
            {hasTrendData ? (
              <svg viewBox="0 0 240 80" className="mt-3 h-14 w-full">
                <polyline
                  fill="none"
                  stroke="rgba(34,197,94,0.85)"
                  strokeWidth="2"
                  points={trendPoints}
                />
              </svg>
            ) : (
              <div className="mt-3 text-sm text-white/60">No data</div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">
          Training log summary
        </h2>
        <div className="lab-card rounded-2xl p-5">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-sm text-white/70">No sessions yet</div>
            ) : (
              sessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b border-white/10 pb-3 text-sm text-white/85 last:border-b-0 last:pb-0"
                >
                  <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                  <span className="text-white/60">{session._count.sets} sets</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Load trend</h2>
        <div className="lab-card rounded-2xl p-5">
          {hasTrendData ? (
            <div>
              <svg viewBox="0 0 240 80" className="h-24 w-full">
                <polyline fill="none" stroke="rgba(34,197,94,0.85)" strokeWidth="2" points={trendPoints} />
              </svg>
            </div>
          ) : (
            <div className="text-sm text-white/70">
              No data yet
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">Signals</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Fatigue</div>
            <div className="mt-3 text-lg font-semibold text-white/90">
              {hasAnySets ? fatigueLabel : "No data"}
            </div>
          </div>
          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Load spike</div>
            <div className="mt-3 text-lg font-semibold text-white/90">{loadSpike}</div>
          </div>
          <div className="lab-card rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide lab-muted">Recovery</div>
            <div className="mt-3 text-lg font-semibold text-white/90">{recovery}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
