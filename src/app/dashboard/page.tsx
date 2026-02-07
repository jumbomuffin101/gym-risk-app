// src/app/dashboard/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { BRAND_ICON_SRC } from "@/lib/brand";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import QuickLogPanel from "@/app/dashboard/QuickLogPanel";
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
      endedAt: true,
      note: true,
      _count: { select: { sets: true } },
    },
  });

  const lastSessionAgo =
    sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  const hasAnySets = (await prisma.setEntry.count({ where: { userId: user.id } })) > 0;

  const now = new Date();
  const sevenDaysAgo = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  const fourteenDaysAgo = startOfDay(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

  const recentSets = await prisma.setEntry.findMany({
    where: { userId: user.id, performedAt: { gte: sevenDaysAgo } },
    select: { reps: true, weight: true, rpe: true, pain: true, performedAt: true },
  });

  const priorPainSets = await prisma.setEntry.findMany({
    where: {
      userId: user.id,
      performedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      pain: { not: null },
    },
    select: { pain: true },
  });

  const latestSet = await prisma.setEntry.findFirst({
    where: { userId: user.id },
    orderBy: { performedAt: "desc" },
    select: { sessionId: true },
  });

  const riskReasons = latestSet ? await computeSessionRisk(user.id, latestSet.sessionId) : [];
  const riskScore = riskReasons[0]?.score ?? null;

  const weeklyLoad = recentSets.reduce((sum, set) => sum + set.reps * set.weight, 0);
  const rpeValues = recentSets.map((set) => set.rpe).filter((val): val is number => val !== null);
  const painValues = recentSets.map((set) => set.pain).filter((val): val is number => val !== null);
  const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length : null;

  const fatigueLabel =
    avgRpe === null ? "Not available" : avgRpe >= 8 ? "High" : avgRpe >= 6 ? "Moderate" : "Low";

  const recentPainAvg =
    painValues.length > 0 ? painValues.reduce((sum, val) => sum + val, 0) / painValues.length : null;
  const priorPainValues = priorPainSets
    .map((set) => set.pain)
    .filter((val): val is number => val !== null);
  const priorPainAvg =
    priorPainValues.length > 0
      ? priorPainValues.reduce((sum, val) => sum + val, 0) / priorPainValues.length
      : null;

  const painTrend =
    recentPainAvg === null
      ? "Not available"
      : priorPainAvg !== null && recentPainAvg > priorPainAvg + 0.5
        ? "Rising"
        : "Stable";

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

  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
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
          <div className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
            Training overview
          </div>
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Risk score</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-3xl font-semibold text-white/95">
              {!hasAnySets ? "—" : riskScore ?? "Baseline"}
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/70">
              {!hasAnySets ? "No data" : riskScore ? "Estimated" : "No estimate"}
            </span>
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Weekly load</div>
          <div className="mt-3 text-3xl font-semibold text-white/95">
            {recentSets.length === 0 ? "—" : weeklyLoad.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-white/60">
            {recentSets.length === 0 ? "No data" : "Last 7 days"}
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Fatigue</div>
          <div className="mt-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/75">
              {hasAnySets ? fatigueLabel : "No data"}
            </span>
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Pain trend</div>
          <div className="mt-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/75">
              {hasAnySets ? painTrend : "No data"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide lab-muted">Load trend</div>
            <div className="text-sm font-semibold text-white/90">
              {recentSets.length === 0 ? "—" : weeklyLoad.toLocaleString()}
            </div>
          </div>
          {hasTrendData ? (
            <div className="mt-4">
              <svg viewBox="0 0 240 80" className="h-16 w-full">
                <polyline
                  fill="none"
                  stroke="rgba(34,197,94,0.8)"
                  strokeWidth="2"
                  points={trendPoints}
                />
              </svg>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-white/70">
              No data yet
            </div>
          )}
        </div>

        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide lab-muted">Recent sessions</div>
            <div className="text-xs text-white/60">{Math.min(3, sessions.length)} shown</div>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                No sessions yet
              </div>
            ) : (
              sessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/80"
                >
                  <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                  <span className="text-white/60">{session._count.sets} sets</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <QuickLogPanel exercises={exercises} />
    </div>
  );
}
