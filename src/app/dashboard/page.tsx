// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { computeSessionRisk } from "@/app/lib/riskEngine";

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

function setLoad(set: { reps: number; weight: number; rpe: number | null }) {
  return set.reps * set.weight * (set.rpe ?? 1);
}

function formatLoad(value: number) {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value).toLocaleString();
}

function cleanSessionNote(note: string | null) {
  const value = note?.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  const looksMachineGenerated =
    value.startsWith("{") ||
    value.startsWith("[") ||
    value.includes("[object Object]") ||
    lower === "null" ||
    lower === "undefined" ||
    lower.includes('"') ||
    lower.includes("=>") ||
    lower.includes("\u00e2") ||
    lower.includes("\u00c3");

  if (looksMachineGenerated) return null;
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

function cleanDisplayText(value: string) {
  return value
    .replaceAll("\u00e2\u2030\u00a5", ">=")
    .replaceAll("\u00e2\u20ac\u201c", "-")
    .replaceAll("\u00e2\u20ac\u201d", "-");
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
      sets: { select: { reps: true, weight: true, rpe: true } },
    },
  });

  const activeSession = await prisma.workoutSession.findFirst({
    where: { userId: user.id, endedAt: null },
    select: { id: true, startedAt: true },
  });

  const recentRiskReasons = (
    await Promise.all(
      sessions
        .filter((s) => s._count.sets > 0)
        .slice(0, 4)
        .map(async (s) => {
          const reasons = await computeSessionRisk(user.id, s.id);
          return reasons.map((reason) => ({
            ...reason,
            sessionId: s.id,
            startedAt: s.startedAt,
          }));
        })
    )
  )
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const riskScore = recentRiskReasons[0]?.score ?? (activeSession ? 24 : 8);
  const heatmap: RiskMap = {
    shoulders: "low",
    elbows: "low",
    lowerBack: activeSession ? "moderate" : "low",
    quads: "low",
    hamstrings: activeSession ? "moderate" : "low",
    knees: "low",
  };

  const referenceTime = sessions[0] ? new Date(sessions[0].startedAt).getTime() : 0;
  const recentSessions = sessions.filter(
    (s) => referenceTime - new Date(s.startedAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  );
  const sessionLoads = sessions.map((s) => ({
    id: s.id,
    load: s.sets.reduce((sum, set) => sum + setLoad(set), 0),
  }));
  const today = recentSessions.reduce(
    (sum, session) => sum + session.sets.reduce((load, set) => load + setLoad(set), 0),
    0
  );
  const completedSessionLoads = sessionLoads.filter((s) => s.load > 0).map((s) => s.load);
  const baseline =
    completedSessionLoads.length > 0
      ? completedSessionLoads.reduce((sum, load) => sum + load, 0) / completedSessionLoads.length
      : 0;
  const deltaPct = baseline ? Math.round(((today - baseline) / baseline) * 100) : 0;

  const lastSessionAgo =
    sessions.length > 0 ? daysAgo(new Date(sessions[0].startedAt)) : null;

  return (
    <PageShell>
      <LabCard className="rounded-2xl p-5" hover={false}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
                    <span className="lab-muted">
                      {sessions.length === 0
                        ? "No sessions logged yet."
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
          title="Active session"
          value={activeSession ? "In progress" : "Idle"}
          badge={activeSession ? "Active" : "Ready"}
          badgeTone={activeSession ? "watch" : "safe"}
          subline={activeSession ? "Sets logged here update the dashboard." : "Start a workout to begin tracking."}
          micro={activeSession ? "Tracking current work" : undefined}
          microTone={activeSession ? "watch" : "neutral"}
          progress={activeSession ? 62 : 12}
        />

        <MetricCard
          eyebrow="Risk status"
          title={recentRiskReasons.length > 0 ? "Latest signal" : "No flags"}
          subtitle={
            sessions.length === 0
              ? "Log sets to generate risk signals."
              : "Based on recent volume, RPE, and pain."
          }
          actions={
            <StatusChip
              label={riskScore >= 70 ? "High" : riskScore >= 40 ? "Watch" : "Low"}
              tone={riskScore >= 70 ? "danger" : riskScore >= 40 ? "watch" : "safe"}
            />
          }
        >
          <div className="flex items-center justify-between gap-4 min-h-24">
            <div className="text-sm lab-muted">
              {recentRiskReasons[0]?.title ? cleanDisplayText(recentRiskReasons[0].title) : "No recent risk events."}
            </div>
            <RiskMeter score={riskScore} />
          </div>
        </MetricCard>

        <KpiCard
          title="7-day load"
          value={formatLoad(today) ?? "0"}
          badge={baseline ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}%` : "New"}
          badgeTone={!baseline ? "neutral" : deltaPct >= 20 ? "danger" : deltaPct >= 12 ? "watch" : "safe"}
          subline={baseline ? "Compared with recent session average." : "No baseline yet."}
          progress={baseline ? Math.min(100, Math.max(8, (today / baseline) * 50)) : 8}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SessionStepper active={Boolean(activeSession)} />
        <LoadPanel today={today} baseline={baseline} deltaPct={deltaPct} active={Boolean(activeSession)} />
      </section>

      <MuscleHeatmap risk={heatmap} active={Boolean(activeSession)} />

      <section className="grid gap-4 md:grid-cols-2">
        <LabCard className="rounded-2xl p-5">
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
                  className="btn-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lab-accent-strong)]"
                  href="/workouts"
                >
                  Go to workouts
                </a>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sessions.map((s) => {
                const load = formatLoad(s.sets.reduce((sum, set) => sum + setLoad(set), 0));
                const note = cleanSessionNote(s.note);

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white/90">
                        {new Date(s.startedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs lab-muted">
                        {s._count.sets} sets{load ? ` · ${load} load` : ""}
                      </div>
                    </div>
                    {note ? <div className="mt-1 text-xs text-white/65">{note}</div> : null}
                  </div>
                );
              })}
            </div>
          )}
        </LabCard>

        <LabCard className="rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Risk feed</div>
            <div className="text-xs lab-muted">{recentRiskReasons.length} events</div>
          </div>

          {recentRiskReasons.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">No risk events</div>
              <div className="mt-1 text-xs lab-muted">
                Recent sessions have not triggered a pain, RPE, or load flag.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {recentRiskReasons.map((reason, index) => (
                <div key={`${reason.sessionId}-${reason.kind}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white/90">{cleanDisplayText(reason.title)}</div>
                      <div className="mt-1 text-xs lab-muted">
                        {new Date(reason.startedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <StatusChip
                      label={`${reason.score}`}
                      tone={reason.score >= 70 ? "danger" : reason.score >= 40 ? "watch" : "safe"}
                      showDot={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </LabCard>
      </section>
    </PageShell>
  );
}
