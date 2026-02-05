// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";


export const runtime = "nodejs";

function daysAgo(d: Date) {
  const diff = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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

  const activeSession = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endedAt: null },
    select: { id: true, startedAt: true },
  });

  // --- Placeholder but "alive" dashboard signals (you can replace with real model later)
  const fakeRiskScore = activeSession ? 38 : 12;
  const elevatedCount = activeSession ? 2 : 0;

  // placeholder load analytics
  const today = activeSession ? 12450 : 0;
  const baseline = 9800;
  const deltaPct = baseline ? Math.round(((today - baseline) / baseline) * 100) : 0;

  const lastSessionAgo =
    sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  const weeklyLoad = baseline + (activeSession ? 1650 : 0);
  const riskStatus = fakeRiskScore >= 35 ? "Elevated" : "Stable";
  const fatigueLabel = activeSession ? "Moderate" : "Low";
  const painTrend = elevatedCount > 1 ? "Rising" : "Stable";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide lab-muted">Dashboard</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-white/95">
            Training overview
          </div>
        </div>
        <div className="text-xs text-white/60">
          {sessions.length === 0 ? "No recent sessions" : `Last session ${lastSessionAgo}d ago`}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Risk score</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-3xl font-semibold text-white/95">{fakeRiskScore}</div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/70">
              {riskStatus}
            </span>
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Weekly load</div>
          <div className="mt-3 text-3xl font-semibold text-white/95">{weeklyLoad.toLocaleString()}</div>
          <div className="mt-2 text-xs text-white/60">
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct}% vs baseline
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Fatigue</div>
          <div className="mt-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/75">
              {fatigueLabel}
            </span>
          </div>
        </div>

        <div className="lab-card rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wide lab-muted">Pain trend</div>
          <div className="mt-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-medium text-white/75">
              {painTrend}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide lab-muted">Load trend</div>
            <div className="text-sm font-semibold text-white/90">{today.toLocaleString()}</div>
          </div>
          <div className="mt-4">
            <svg viewBox="0 0 240 80" className="h-16 w-full">
              <polyline
                fill="none"
                stroke="rgba(34,197,94,0.8)"
                strokeWidth="2"
                points="0,60 30,54 60,58 90,40 120,44 150,30 180,36 210,22 240,28"
              />
              <polyline
                fill="none"
                stroke="rgba(148,163,184,0.4)"
                strokeWidth="1"
                points="0,70 30,66 60,68 90,62 120,64 150,60 180,58 210,56 240,54"
              />
            </svg>
          </div>
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
    </div>
  );
}
