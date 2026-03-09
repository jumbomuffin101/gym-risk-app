// src/app/dashboard/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import {
  computeAcuteChronicRatio,
  computeSessionLoad,
  computeWowPercent,
  deriveRiskState,
  sumLoadInWindow,
} from "@/lib/metrics/load";

import DashboardActions from "./DashboardActions";
import { KpiCard } from "src/app/dashboard/KpiCard";
import { RiskMeter } from "src/app/dashboard/RiskMeter";
import { SessionStepper } from "src/app/dashboard/SessionStepper";
import { MuscleHeatmap, type RiskMap } from "src/app/dashboard/MuscleHeatmap";
import { LoadPanel } from "src/app/dashboard/LoadPanel";
import { LabCard } from "src/app/dashboard/components/LabCard";
import { MetricCard } from "src/app/dashboard/components/MetricCard";
import { PageShell } from "src/app/dashboard/components/PageShell";
import { SectionHeader } from "src/app/dashboard/components/SectionHeader";
import { StatusChip } from "src/app/dashboard/components/StatusChip";

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
    take: 24,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      note: true,
      sets: { select: { reps: true, weight: true, rpe: true } },
      _count: { select: { sets: true } },
    },
  });

  const sessionsWithLoad = sessions.map((workout) => ({
    ...workout,
    sessionLoad: computeSessionLoad(workout.sets),
  }));

  const activeSession = sessionsWithLoad.find((s) => s.endedAt === null) ?? null;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const twentyEightDaysAgo = new Date(now);
  twentyEightDaysAgo.setDate(now.getDate() - 28);

  const weeklyLoad = sumLoadInWindow(sessionsWithLoad, sevenDaysAgo, now);
  const priorWeeklyLoad = sumLoadInWindow(sessionsWithLoad, fourteenDaysAgo, sevenDaysAgo);
  const chronic28d = sumLoadInWindow(sessionsWithLoad, twentyEightDaysAgo, now);
  const baseline7d = chronic28d / 4;
  const ratio = computeAcuteChronicRatio(weeklyLoad, chronic28d);
  const wowPct = computeWowPercent(weeklyLoad, priorWeeklyLoad);

  const hasTwoWeekWindow = sessionsWithLoad.some((s) => daysAgo(new Date(s.startedAt)) >= 14);
  const risk = deriveRiskState(wowPct, ratio);

  const fakeRiskScore = risk.state === "High" ? 79 : risk.state === "Monitor" ? 48 : 20;
  const heatmap: RiskMap = {
    shoulders: "low",
    elbows: ratio >= 1.3 ? "moderate" : "low",
    lowerBack: risk.state === "High" ? "high" : ratio >= 1.3 ? "moderate" : "low",
    quads: ratio > 1.5 ? "high" : ratio >= 1.3 ? "moderate" : "low",
    hamstrings: wowPct >= 15 ? "moderate" : "low",
    knees: "low",
  };
  const elevatedCount = Object.values(heatmap).filter((v) => v !== "low").length;

  const trend = sessionsWithLoad
    .slice(0, 8)
    .reverse()
    .map((s) => Number(s.sessionLoad.toFixed(2)));

  const riskEvents: Array<{ when: Date; title: string; detail: string; tone: "danger" | "watch" }> = [];
  if (wowPct >= 30) {
    riskEvents.push({
      when: now,
      title: "Week-over-week spike",
      detail: `Weekly load increased ${wowPct.toFixed(1)}% vs prior week.`,
      tone: "danger",
    });
  } else if (wowPct >= 15) {
    riskEvents.push({
      when: now,
      title: "Week-over-week increase",
      detail: `Weekly load increased ${wowPct.toFixed(1)}%.`,
      tone: "watch",
    });
  }

  if (ratio > 1.5) {
    riskEvents.push({
      when: now,
      title: "Acute:chronic high",
      detail: `AC ratio ${ratio.toFixed(2)} is above 1.5.`,
      tone: "danger",
    });
  } else if (ratio >= 1.3) {
    riskEvents.push({
      when: now,
      title: "Acute:chronic monitor",
      detail: `AC ratio ${ratio.toFixed(2)} is in the monitor band.`,
      tone: "watch",
    });
  }

  const lastSessionAgo = sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  return (
    <PageShell>
      <LabCard className="rounded-2xl p-5 overflow-hidden relative" hover={false}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(800px 240px at 20% 30%, rgba(34,197,94,0.10), transparent 55%), radial-gradient(600px 220px at 80% 20%, rgba(56,189,248,0.06), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <SectionHeader
              eyebrow="Dashboard"
              title="Training overview"
              as="h1"
              subtitle={
                <div className="flex flex-wrap items-center gap-3">
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
              }
            />
          </div>

          <DashboardActions />
        </div>
      </LabCard>

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Session flow"
          value={activeSession ? "In progress" : "No active session"}
          badge={activeSession ? "Active" : "Ready"}
          badgeTone={activeSession ? "watch" : "safe"}
          subline={
            activeSession
              ? `Started ${new Date(activeSession.startedAt).toLocaleString()}`
              : "No active session. Start a new workout."
          }
          micro={activeSession ? `${activeSession._count.sets} sets logged` : "Awaiting session start"}
          microTone={activeSession ? "watch" : "neutral"}
          progress={activeSession ? 68 : 10}
        />

        <MetricCard
          eyebrow="Risk status"
          title={risk.state}
          subtitle={risk.driver}
          actions={<StatusChip label={risk.state} tone={risk.state === "High" ? "danger" : risk.state === "Monitor" ? "watch" : "safe"} />}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs lab-muted">Derived from weekly load change and acute:chronic ratio.</div>
            <RiskMeter score={fakeRiskScore} />
          </div>
        </MetricCard>

        <KpiCard
          title="Muscle heatmap"
          value={elevatedCount === 0 ? "No hot zones" : `${elevatedCount} elevated`}
          badge={elevatedCount === 0 ? "Stable" : "Watch"}
          badgeTone={elevatedCount === 0 ? "safe" : "watch"}
          subline="Load concentration from current stress profile."
          micro={elevatedCount === 0 ? "Even distribution" : "Concentration detected"}
          microTone={elevatedCount === 0 ? "neutral" : "watch"}
          progress={elevatedCount === 0 ? 18 : 54}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SessionStepper active={Boolean(activeSession)} />
        <LoadPanel
          weeklyLoad={weeklyLoad}
          baseline7d={baseline7d}
          wowPct={wowPct}
          ratio={ratio}
          riskState={risk.state}
          driver={risk.driver}
          trend={trend}
          baselinePending={!hasTwoWeekWindow}
        />
      </section>

      <MuscleHeatmap risk={heatmap} active={Boolean(activeSession)} />

      <section className="grid gap-4 md:grid-cols-2">
        <LabCard className="rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Recent sessions</div>
            <div className="text-xs lab-muted">{Math.min(sessionsWithLoad.length, 5)} shown</div>
          </div>

          {sessionsWithLoad.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">No sessions yet</div>
              <div className="mt-1 text-xs lab-muted">Start a workout and log sets to populate your dashboard.</div>
              <div className="mt-3">
                <a className="btn-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]" href="/workouts">
                  Go to workouts
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sessionsWithLoad.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  href={`/api/sessions/${s.id}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white/90">{new Date(s.startedAt).toLocaleString()}</div>
                    <div className="text-xs lab-muted">{s._count.sets} sets</div>
                  </div>
                  <div className="mt-1 text-xs lab-muted">Session load: {Math.round(s.sessionLoad).toLocaleString()}</div>
                  {s.note ? <div className="mt-1 text-xs text-white/70">{s.note}</div> : null}
                </Link>
              ))}
            </div>
          )}
        </LabCard>

        <LabCard className="rounded-2xl p-5 relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-0 h-px opacity-40"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.45), transparent)",
              animation: "lab-scan 3.6s ease-in-out infinite",
            }}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Risk feed</div>
            <div className="text-xs lab-muted">Derived</div>
          </div>

          {riskEvents.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">No active risk events</div>
              <div className="mt-1 text-xs lab-muted">Current load and ratio are inside stable bands.</div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {riskEvents.slice(0, 5).map((event, index) => (
                <div key={`${event.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm text-white/90">{event.title}</div>
                    <StatusChip label={event.tone === "danger" ? "High" : "Monitor"} tone={event.tone} />
                  </div>
                  <div className="mt-1 text-xs lab-muted">{event.detail}</div>
                </div>
              ))}
            </div>
          )}
        </LabCard>
      </section>
    </PageShell>
  );
}
