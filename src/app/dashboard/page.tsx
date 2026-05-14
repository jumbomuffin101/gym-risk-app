import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { computeSessionRisk } from "@/app/lib/riskEngine";

import DashboardActions from "./DashboardActions";
import { KpiCard } from "src/app/dashboard/KpiCard";
import { RiskMeter } from "src/app/dashboard/RiskMeter";
import { MuscleHeatmap, type RiskMap } from "src/app/dashboard/MuscleHeatmap";
import { LoadPanel } from "src/app/dashboard/LoadPanel";
import { LabCard } from "src/app/dashboard/components/LabCard";
import { MetricCard } from "src/app/dashboard/components/MetricCard";
import { PageShell } from "src/app/dashboard/components/PageShell";
import { SectionHeader } from "src/app/dashboard/components/SectionHeader";
import { StatusChip } from "src/app/dashboard/components/StatusChip";

export const runtime = "nodejs";

type DashboardRiskReason = {
  kind: string;
  title: string;
  score: number;
  details: Record<string, unknown>;
  sessionId: string;
  startedAt: Date;
};

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

function reasonCategories(reason: DashboardRiskReason) {
  const categories = new Set<string>();
  const category = reason.details.category;
  if (typeof category === "string") categories.add(category);

  for (const key of ["examples", "hardSets"]) {
    const rows = reason.details[key];
    if (!Array.isArray(rows)) continue;

    rows.forEach((row) => {
      if (row && typeof row === "object" && "category" in row) {
        const rowCategory = (row as { category?: unknown }).category;
        if (typeof rowCategory === "string") categories.add(rowCategory);
      }
    });
  }

  return Array.from(categories);
}

function buildHeatmap(reasons: DashboardRiskReason[]): RiskMap {
  const risk: RiskMap = {
    shoulders: "low",
    elbows: "low",
    lowerBack: "low",
    quads: "low",
    hamstrings: "low",
    knees: "low",
  };

  const apply = (regions: Array<keyof RiskMap>, score: number) => {
    const level = score >= 70 ? "high" : score >= 40 ? "moderate" : "low";
    if (level === "low") return;

    regions.forEach((region) => {
      if (risk[region] === "high") return;
      risk[region] = level;
    });
  };

  reasons.forEach((reason) => {
    const categories = reasonCategories(reason);
    categories.forEach((category) => {
      if (category === "squat") apply(["quads", "knees", "lowerBack"], reason.score);
      if (category === "hinge") apply(["hamstrings", "lowerBack"], reason.score);
      if (category === "push") apply(["shoulders", "elbows"], reason.score);
      if (category === "pull") apply(["shoulders", "elbows"], reason.score);
      if (category === "core") apply(["lowerBack"], reason.score);
    });
  });

  return risk;
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
    where: {
      userId: user.id,
      sets: { some: {} },
    },
    orderBy: { startedAt: "desc" },
    take: 8,
    select: {
      id: true,
      startedAt: true,
      note: true,
      _count: { select: { sets: true } },
      sets: {
        select: {
          exerciseId: true,
          reps: true,
          weight: true,
          rpe: true,
        },
      },
    },
  });

  const recentRiskReasons: DashboardRiskReason[] = (
    await Promise.all(
      sessions.slice(0, 4).map(async (workout) => {
        const reasons = await computeSessionRisk(user.id, workout.id);
        return reasons.map((reason) => ({
          ...reason,
          sessionId: workout.id,
          startedAt: workout.startedAt,
        }));
      })
    )
  )
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const riskScore = recentRiskReasons[0]?.score ?? 8;
  const heatmap = buildHeatmap(recentRiskReasons);
  const sessionLoads = sessions.map((workout) => ({
    id: workout.id,
    load: workout.sets.reduce((sum, set) => sum + setLoad(set), 0),
  }));
  const referenceTime = sessions[0] ? new Date(sessions[0].startedAt).getTime() : 0;
  const recentSessions = sessions.filter(
    (workout) => referenceTime - new Date(workout.startedAt).getTime() <= 7 * 24 * 60 * 60 * 1000
  );
  const recentLoad = recentSessions.reduce(
    (sum, workout) => sum + workout.sets.reduce((load, set) => load + setLoad(set), 0),
    0
  );
  const completedLoads = sessionLoads.filter((workout) => workout.load > 0).map((workout) => workout.load);
  const baseline =
    completedLoads.length > 0
      ? completedLoads.reduce((sum, load) => sum + load, 0) / completedLoads.length
      : 0;
  const deltaPct = baseline ? Math.round(((recentLoad - baseline) / baseline) * 100) : 0;
  const lastWorkout = sessions[0] ?? null;
  const lastWorkoutLoad = lastWorkout
    ? lastWorkout.sets.reduce((sum, set) => sum + setLoad(set), 0)
    : 0;

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
                  <div className="text-sm lab-muted">
                    Workout load updates after saving workouts.
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
          title="Last workout"
          value={
            lastWorkout
              ? new Date(lastWorkout.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "None"
          }
          badge={lastWorkout ? `${lastWorkout._count.sets} sets` : "New"}
          badgeTone={lastWorkout ? "safe" : "neutral"}
          subline={lastWorkout ? `${formatLoad(lastWorkoutLoad) ?? "0"} load` : "Create a workout to begin tracking."}
          progress={lastWorkout && baseline ? Math.min(100, Math.max(8, (lastWorkoutLoad / baseline) * 50)) : 8}
        />

        <MetricCard
          eyebrow="Risk status"
          title={recentRiskReasons.length > 0 ? "Latest signal" : "No flags"}
          subtitle={
            sessions.length === 0
              ? "Save workouts to generate risk signals."
              : "Based on recent volume, RPE, and pain."
          }
          actions={
            <StatusChip
              label={riskScore >= 70 ? "High" : riskScore >= 40 ? "Watch" : "Low"}
              tone={riskScore >= 70 ? "danger" : riskScore >= 40 ? "watch" : "safe"}
            />
          }
        >
          <div className="flex min-h-24 items-center justify-between gap-4">
            <div className="text-sm lab-muted">
              {recentRiskReasons[0]?.title ? cleanDisplayText(recentRiskReasons[0].title) : "No recent risk events."}
            </div>
            <RiskMeter score={riskScore} />
          </div>
        </MetricCard>

        <KpiCard
          title="7-day load"
          value={formatLoad(recentLoad) ?? "0"}
          badge={baseline ? `${deltaPct >= 0 ? "+" : ""}${deltaPct}%` : "New"}
          badgeTone={!baseline ? "neutral" : deltaPct >= 20 ? "danger" : deltaPct >= 12 ? "watch" : "safe"}
          subline={baseline ? "Compared with session baseline." : "No baseline yet."}
          progress={baseline ? Math.min(100, Math.max(8, (recentLoad / baseline) * 50)) : 8}
        />
      </section>

      <LoadPanel recentLoad={recentLoad} baseline={baseline} deltaPct={deltaPct} />

      <MuscleHeatmap risk={heatmap} hasWorkouts={sessions.length > 0} />

      <section className="grid gap-4 md:grid-cols-2">
        <LabCard className="rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Recent workouts</div>
            <div className="text-xs lab-muted">{sessions.length} shown</div>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/85">No workouts yet</div>
              <div className="mt-1 text-xs lab-muted">
                Save a workout to populate your dashboard.
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {sessions.map((workout) => {
                const load = formatLoad(workout.sets.reduce((sum, set) => sum + setLoad(set), 0));
                const note = cleanSessionNote(workout.note);

                return (
                  <div
                    key={workout.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white/90">
                        {new Date(workout.startedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs lab-muted">
                        {workout._count.sets} sets{load ? ` - ${load} load` : ""}
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
                Recent workouts have not triggered a pain, RPE, or load flag.
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
