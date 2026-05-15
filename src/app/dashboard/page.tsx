import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/lib/auth/authOptions";
import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { computeSessionRisk } from "@/app/lib/riskEngine";
import { buildMuscleRegionRisks, computeDashboardRiskSignal } from "@/app/lib/dashboardRisk";
import { cleanWorkoutName, formatLoad, setLoad, summarizeWorkoutSets } from "@/app/lib/workouts";

import DashboardActions from "./DashboardActions";
import { DashboardWorkoutSelector } from "./DashboardWorkoutSelector";
import { KpiCard } from "src/app/dashboard/KpiCard";
import { RiskMeter } from "src/app/dashboard/RiskMeter";
import { MuscleHeatmap } from "src/app/dashboard/MuscleHeatmap";
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

const DAY_MS = 24 * 60 * 60 * 1000;

function cleanDisplayText(value: string) {
  return value
    .replaceAll("\u00e2\u2030\u00a5", ">=")
    .replaceAll("\u00e2\u20ac\u201c", "-")
    .replaceAll("\u00e2\u20ac\u201d", "-");
}

function formatWorkoutDateTime(startedAt: Date) {
  return new Date(startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatWorkoutOptionLabel(workout: { startedAt: Date; note: string | null }) {
  const date = formatWorkoutDateTime(workout.startedAt);
  const name = cleanWorkoutName(workout.note, 56);

  return name ? `${date} - ${name}` : date;
}

function AnalysisMetric({
  label,
  value,
  subline,
}: {
  label: string;
  value: string;
  subline?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs lab-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold lab-num text-white/90">{value}</div>
      {subline ? <div className="mt-1 text-xs lab-muted">{subline}</div> : null}
    </div>
  );
}

type DashboardPageProps = {
  searchParams?: Promise<{ workoutId?: string | string[] }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const userId = await requireDbUserId();

  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) redirect("/signin?callbackUrl=/dashboard");

  const params = searchParams ? await searchParams : {};
  const rawWorkoutId = params.workoutId;
  const requestedWorkoutId = Array.isArray(rawWorkoutId) ? rawWorkoutId[0] : rawWorkoutId;
  const now = new Date();

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      sets: { some: {} },
    },
    orderBy: { startedAt: "desc" },
    take: 12,
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      note: true,
      _count: { select: { sets: true } },
      sets: {
        select: {
          exerciseId: true,
          reps: true,
          weight: true,
          rpe: true,
          pain: true,
        },
      },
    },
  });

  const selectedWorkout =
    sessions.find((workout) => workout.id === requestedWorkoutId) ?? sessions[0] ?? null;
  const selectedRiskAnchor = selectedWorkout
    ? new Date((selectedWorkout.endedAt ?? selectedWorkout.startedAt).getTime() + 1)
    : now;
  const metricsSince = new Date(
    Math.min(now.getTime(), selectedRiskAnchor.getTime()) - 35 * DAY_MS
  );
  const metricsUntil = new Date(Math.max(now.getTime(), selectedRiskAnchor.getTime()));

  const [metricSets, recentRiskReasonGroups] = await Promise.all([
    prisma.setEntry.findMany({
      where: {
        userId,
        performedAt: { gte: metricsSince, lte: metricsUntil },
        session: { endedAt: { not: null } },
      },
      select: {
        performedAt: true,
        reps: true,
        weight: true,
        rpe: true,
        pain: true,
        exercise: { select: { name: true, category: true } },
      },
    }),
    Promise.all(
      sessions.slice(0, 4).map(async (workout) => {
        const reasons = await computeSessionRisk(userId, workout.id);
        return reasons.map((reason) => ({
          ...reason,
          sessionId: workout.id,
          startedAt: workout.startedAt,
        }));
      })
    ),
  ]);

  const recentRiskReasons: DashboardRiskReason[] = recentRiskReasonGroups
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const riskSignal = computeDashboardRiskSignal(metricSets, now);
  const selectedRiskSignal = selectedWorkout
    ? computeDashboardRiskSignal(metricSets, selectedRiskAnchor)
    : null;
  const riskTone =
    riskSignal.state === "high" ? "danger" : riskSignal.state === "monitor" ? "watch" : "safe";
  const heatmap = buildMuscleRegionRisks(metricSets, now);
  const sessionLoads = sessions.map((workout) => ({
    id: workout.id,
    load: workout.sets.reduce((sum, set) => sum + setLoad(set), 0),
  }));
  const referenceTime = sessions[0] ? new Date(sessions[0].startedAt).getTime() : 0;
  const recentSessions = sessions.filter(
    (workout) => referenceTime - new Date(workout.startedAt).getTime() <= 7 * DAY_MS
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
  const workoutOptions = sessions.map((workout) => ({
    id: workout.id,
    label: formatWorkoutOptionLabel(workout),
  }));
  const selectedSummary = selectedWorkout ? summarizeWorkoutSets(selectedWorkout.sets) : null;
  const selectedWorkoutName = selectedWorkout
    ? cleanWorkoutName(selectedWorkout.note) ?? "Untitled workout"
    : "No completed workout";
  const selectedRiskScore = selectedRiskSignal?.score ?? 20;
  const selectedBaselineLoads = sessionLoads
    .filter((workout) => workout.id !== selectedWorkout?.id && workout.load > 0)
    .map((workout) => workout.load)
    .slice(0, 7);
  const selectedBaseline =
    selectedBaselineLoads.length > 0
      ? selectedBaselineLoads.reduce((sum, load) => sum + load, 0) / selectedBaselineLoads.length
      : 0;
  const selectedDeltaPct =
    selectedSummary && selectedBaseline
      ? Math.round(((selectedSummary.sessionLoad - selectedBaseline) / selectedBaseline) * 100)
      : 0;
  const selectedLoadTone =
    !selectedBaseline ? "neutral" : selectedDeltaPct >= 20 ? "danger" : selectedDeltaPct >= 12 ? "watch" : "safe";

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
          title={riskSignal.stateLabel}
          actions={
            <StatusChip
              label={`${riskSignal.score} / 100`}
              tone={riskTone}
              showDot={false}
            />
          }
        >
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="text-4xl font-semibold tracking-tight lab-num text-white/95">
                {riskSignal.score}
              </div>
              <div className="pb-1 text-sm lab-muted">/ 100</div>
            </div>
            <div className="text-sm font-medium text-white/90">
              Top driver: {riskSignal.topDriver}
            </div>
            <p className="text-xs leading-5 lab-muted">{riskSignal.interpretation}</p>
            <Link
              href="/info"
              className="inline-flex rounded-full border border-emerald-400/25 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300/45 hover:text-emerald-100"
            >
              How this is calculated
            </Link>
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

      <MetricCard
        eyebrow="Selected workout analysis"
        title={selectedWorkoutName}
        subtitle={
          selectedWorkout
            ? `${formatWorkoutDateTime(selectedWorkout.startedAt)}. Workout-level load, risk, and effort signals.`
            : "Save a completed workout to analyze a specific session."
        }
        actions={
          <DashboardWorkoutSelector
            options={workoutOptions}
            selectedId={selectedWorkout?.id ?? null}
          />
        }
      >
        {selectedWorkout && selectedSummary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AnalysisMetric
                label="Session load"
                value={formatLoad(selectedSummary.sessionLoad) ?? "0"}
                subline={
                  selectedBaseline
                    ? `${selectedDeltaPct >= 0 ? "+" : ""}${selectedDeltaPct}% vs recent baseline`
                    : "No baseline yet"
                }
              />
              <AnalysisMetric label="Sets" value={String(selectedSummary.setCount)} />
              <AnalysisMetric label="Exercises" value={String(selectedSummary.exerciseCount)} />
              <AnalysisMetric
                label="RPE / pain"
                value={
                  selectedSummary.averageRpe === null
                    ? "No RPE"
                    : `${selectedSummary.averageRpe.toFixed(1)} avg`
                }
                subline={
                  selectedSummary.maxPain === null
                    ? "No pain logged"
                    : `${selectedSummary.maxPain}/10 max pain`
                }
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white/90">Load and effort signals</div>
                  <StatusChip
                    label={
                      !selectedBaseline
                        ? "No baseline"
                        : selectedDeltaPct >= 20
                        ? "Load spike"
                        : selectedDeltaPct >= 12
                        ? "Above baseline"
                        : "In range"
                    }
                    tone={selectedLoadTone}
                  />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs lab-muted">Recent baseline</div>
                    <div className="mt-1 text-sm font-semibold lab-num text-white/90">
                      {selectedBaseline ? formatLoad(selectedBaseline) ?? "0" : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs lab-muted">High RPE sets</div>
                    <div className="mt-1 text-sm font-semibold lab-num text-white/90">
                      {selectedSummary.highRpeSetCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs lab-muted">Pain entries</div>
                    <div className="mt-1 text-sm font-semibold lab-num text-white/90">
                      {selectedSummary.painSetCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs lab-muted">Risk score</div>
                    <div className="mt-1 text-sm font-semibold lab-num text-white/90">
                      {selectedRiskScore}/100
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <RiskMeter score={selectedRiskScore} />
                <div className="mt-3 text-xs lab-muted">Selected workout risk</div>
                <div className="mt-2 text-sm leading-5 text-white/80">
                  {selectedRiskSignal?.topDriver ?? "No selected workout risk signal."}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-white/90">Selected workout risk signal</div>
                <StatusChip
                  label={selectedRiskSignal?.stateLabel ?? "Stable"}
                  tone={
                    selectedRiskSignal?.state === "high"
                      ? "danger"
                      : selectedRiskSignal?.state === "monitor"
                      ? "watch"
                      : "safe"
                  }
                />
              </div>
              <div className="mt-3 text-sm text-white/85">
                Top driver: {selectedRiskSignal?.topDriver ?? "No saved workouts in this window"}
              </div>
              <p className="mt-2 text-xs leading-5 lab-muted">
                Uses the same deterministic workload signal as the dashboard Risk Status.
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm text-white/85">No completed workouts yet</div>
            <div className="mt-1 text-xs lab-muted">
              Create and save a workout to analyze its load, set count, RPE, pain, and risk.
            </div>
          </div>
        )}
      </MetricCard>

      <MuscleHeatmap regions={heatmap} hasWorkouts={sessions.length > 0} />

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
                const workoutName = cleanWorkoutName(workout.note, 80);
                const date = new Date(workout.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={workout.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white/90">
                        {workoutName ?? date}
                      </div>
                      <div className="text-xs lab-muted">
                        {workout._count.sets} sets{load ? ` - ${load} load` : ""}
                      </div>
                    </div>
                    {workoutName ? <div className="mt-1 text-xs text-white/65">{date}</div> : null}
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
