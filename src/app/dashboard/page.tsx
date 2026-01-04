// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";

import DashboardActions from "./DashboardActions";
import { KpiCard } from "src/app/dashboard/KpiCard";
import { RiskMeter } from "src/app/dashboard/RiskMeter";
import { SessionStepper } from "src/app/dashboard/SessionStepper";
import { MuscleHeatmap, type RiskMap } from "src/app/dashboard/MuscleHeatmap";
import { LoadPanel } from "src/app/dashboard/LoadPanel";

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
  const heatmap: RiskMap = {
    shoulders: "low",
    elbows: "low",
    lowerBack: activeSession ? "moderate" : "low",
    quads: "low",
    hamstrings: activeSession ? "moderate" : "low",
    knees: "low",
  };

  const elevatedCount = Object.values(heatmap).filter((v) => v !== "low").length;

  // placeholder load analytics
  const today = activeSession ? 12450 : 0;
  const baseline = 9800;
  const deltaPct = baseline ? Math.round(((today - baseline) / baseline) * 100) : 0;

  const lastSessionAgo =
    sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* HERO */}
      <header className="lab-card rounded-2xl p-5 overflow-hidden relative">
        {/* subtle divider gradient + ambient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(800px 240px at 20% 30%, rgba(34,197,94,0.10), transparent 55%), radial-gradient(600px 220px at 80% 20%, rgba(56,189,248,0.06), transparent 55%)",
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide lab-muted">Dashboard</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white/95 leading-tight">
              Training overview
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="text-sm lab-muted">
                Logged in as <span className="text-white/80">{email}</span>
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="text-sm text-white/80">
                System:{" "}
                <span className="lab-muted">
                  {sessions.length === 0
                    ? "No recent training load detected."
                    : `Last session: ${lastSessionAgo}d ago.`}
                </span>
              </div>
            </div>
          </div>

          <DashboardActions />
        </div>
      </header>

      {/* TOP GRID */}
      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Session flow"
          value={activeSession ? "In progress" : "Idle"}
          badge={activeSession ? "Active" : "Ready"}
          badgeTone={activeSession ? "watch" : "safe"}
          subline={activeSession ? "Logging sets updates risk live." : "Start a session to enable signals."}
          micro={activeSession ? "Live signals enabled" : "Awaiting session start"}
          microTone={activeSession ? "watch" : "neutral"}
          progress={activeSession ? 62 : 12}
        />

        <div className="lab-card lab-hover rounded-2xl p-5 flex items-center justify-between gap-4 hover:">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide lab-muted">Risk status</div>
            <div className="mt-1 text-sm text-white/85">
              {activeSession ? "Adaptive estimate" : "Baseline estimate"}
            </div>
            <div className="mt-3 text-xs lab-muted">
              {sessions.length === 0 ? "No data yet, risk starts stable." : "Computed from volume, RPE, recovery."}
            </div>
          </div>
          <RiskMeter score={fakeRiskScore} />
        </div>

        <KpiCard
          title="Muscle heatmap"
          value={elevatedCount === 0 ? "No hot zones" : `${elevatedCount} elevated`}
          badge={elevatedCount === 0 ? "Stable" : "Watch"}
          badgeTone={elevatedCount === 0 ? "safe" : "watch"}
          subline="Click zones for explainable drivers."
          micro={elevatedCount === 0 ? "Even distribution" : "Concentration detected"}
          microTone={elevatedCount === 0 ? "neutral" : "watch"}
          progress={elevatedCount === 0 ? 18 : 54}
        />
      </section>

      {/* BIG PANELS */}
      <section className="grid gap-4 lg:grid-cols-2">
        <SessionStepper active={Boolean(activeSession)} />
        <LoadPanel today={today} baseline={baseline} deltaPct={deltaPct} active={Boolean(activeSession)} />
      </section>

      <MuscleHeatmap risk={heatmap} active={Boolean(activeSession)} />

      {/* RECENT SESSIONS + RISK FEED (still placeholder) */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="lab-card lab-hover rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Recent sessions</div>
            <div className="text-xs lab-muted">{sessions.length} shown</div>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">No sessions yet</div>
              <div className="mt-1 text-xs lab-muted">
                Start a workout and log sets to populate your dashboard.
              </div>
              <div className="mt-3">
                <a
                  className="inline-flex rounded-xl bg-[rgba(34,197,94,0.92)] px-3 py-2 text-xs font-medium text-black"
                  href="/workouts"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(34,197,94,0.25), 0 18px 55px rgba(34,197,94,0.10)",
                  }}
                >
                  Go to workouts
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/90">
                      {new Date(s.startedAt).toLocaleString()}
                    </div>
                    <div className="text-xs lab-muted">{s._count.sets} sets</div>
                  </div>
                  {s.note ? <div className="mt-1 text-xs text-white/70">{s.note}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lab-card lab-hover rounded-2xl p-5 relative overflow-hidden">
          {/* faint animated line hint (alive micro-indicator) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-px opacity-40"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(34,197,94,0.45), transparent)",
              animation: "lab-scan 3.6s ease-in-out infinite",
            }}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Risk feed</div>
            <div className="text-xs lab-muted">v0</div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-white/85">No risk events yet</div>
            <div className="mt-1 text-xs lab-muted">
              Status: <span className="text-white/75">Last spike: 3 days ago</span>
              {" "} (placeholder)
            </div>
            <div className="mt-3 text-xs lab-muted">
              Quick test: log sets with high RPE or pain.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
