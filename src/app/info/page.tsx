import type { ReactNode } from "react";
import Link from "next/link";

import { LabCard } from "src/app/dashboard/components/LabCard";
import { PageShell } from "src/app/dashboard/components/PageShell";
import { SectionHeader } from "src/app/dashboard/components/SectionHeader";
import { StatusChip } from "src/app/dashboard/components/StatusChip";

export const metadata = {
  title: "Info | Gym-Risk",
  description: "How Gym-Risk calculates workload and risk signals",
};

function MethodSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-white/10 py-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-tight text-white/90">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-white/74">{children}</div>
    </section>
  );
}

function FormulaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-medium text-white/86">{label}</div>
      <div className="text-sm lab-muted">{value}</div>
    </div>
  );
}

export default function InfoPage() {
  return (
    <PageShell>
      <LabCard className="rounded-2xl p-5" hover={false}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionHeader
            eyebrow="Info"
            title="Methodology"
            as="h1"
            subtitle="How Gym-Risk turns saved workouts into workload signals."
          />
          <Link href="/dashboard" className="btn-secondary w-fit">
            Back to dashboard
          </Link>
        </div>
      </LabCard>

      <LabCard className="rounded-2xl p-5" hover={false}>
        <MethodSection title="What Gym-Risk Does">
          <p>
            Gym-Risk is a workload signal tool, not a medical device. Scores are intended to help
            lifters notice workload spikes, high-intensity streaks, and pain notes, not diagnose
            injuries.
          </p>
          <p>
            The model combines external load, RPE, and pain notes into a deterministic risk signal.
            It should be read as training feedback, not a prediction of what will happen next.
          </p>
        </MethodSection>

        <MethodSection title="Session Load">
          <p>
            Each saved set contributes load as reps x weight x RPE. If RPE is not logged, the set
            uses a neutral RPE multiplier of 1 so the set still contributes external load.
          </p>
          <p>
            Session load is the sum of all saved set loads in that workout. Muscle-region load uses
            reps x weight mapped to the regions trained by each exercise.
          </p>
        </MethodSection>

        <MethodSection title="Weekly Load">
          <p>
            Weekly load is the sum of saved set load over the most recent 7-day window. The dashboard
            compares that current 7-day load with the prior 7-day window when enough saved data
            exists.
          </p>
        </MethodSection>

        <MethodSection title="Acute:Chronic Ratio">
          <p>
            The acute load is the current 7-day load. The chronic baseline is the average weekly load
            from the previous 28 days. Acute:Chronic Workload Ratio is calculated as acute load
            divided by that chronic weekly baseline.
          </p>
          <p>
            Acute:Chronic Workload Ratio is commonly used in sport workload monitoring. Gabbett
            workload research describes a commonly cited range around 0.8 to 1.3, with more concern
            when workload spikes well above that range. This app uses that concept cautiously as a
            workload context signal.
          </p>
        </MethodSection>

        <MethodSection title="Risk Score Formula">
          <p>The dashboard Risk Status and Selected Workout Analysis use the same scoring function.</p>
          <p>
            Baseline pending is shown only before 3 completed workouts. From 3 workouts onward,
            the app uses a provisional baseline from available history. The baseline is considered
            established after 8 completed workouts or workouts on 5 unique days.
          </p>
          <div className="space-y-2">
            <FormulaItem label="Base score" value="20 points" />
            <FormulaItem label="Week-over-week load increase" value="0 to 30 points, scaled from 0% to +30%" />
            <FormulaItem label="Acute:Chronic ratio" value="0 to 25 points, scaled from 1.0 to 1.5" />
            <FormulaItem label="High RPE exposure" value="0 to 15 points from sets at RPE >= 9" />
            <FormulaItem label="Pain flags" value="0 to 20 points from pain entries at 7/10 or higher" />
          </div>
          <p>
            The final score is clamped from 0 to 100. The formula is deterministic, so the same
            saved workouts produce the same score.
          </p>
        </MethodSection>

        <MethodSection title="Status Bands">
          <div className="flex flex-wrap gap-2">
            <StatusChip label="Baseline pending" tone="neutral" />
            <StatusChip label="Provisional baseline" tone="neutral" />
            <StatusChip label="Stable 0-39" tone="safe" />
            <StatusChip label="Monitor 40-69" tone="watch" />
            <StatusChip label="High 70-100" tone="danger" />
          </div>
          <p>
            Baseline pending means fewer than 3 workouts have been logged. Provisional baseline
            means the app is using limited history instead of blocking analytics. Stable means the
            saved workload signal is within the current thresholds. Monitor means there is at least
            one meaningful workload, RPE, or pain signal worth watching. High means the formula
            found a workload spike or a severe RPE or pain signal.
          </p>
        </MethodSection>

        <MethodSection title="Limitations">
          <p>
            Pain flags are user-reported warning signals, not diagnostic data. The app does not know
            your sleep, technique, stress, training age, injury history, or whether a painful set was
            clinically meaningful.
          </p>
          <p>
            Use the score to notice patterns and decide when to review training load. For medical
            advice, diagnosis, or treatment decisions, consult a qualified clinician.
          </p>
        </MethodSection>

        <MethodSection title="References">
          <ul className="space-y-2">
            <li>
              Gabbett TJ. The training-injury prevention paradox: should athletes be training
              smarter and harder?{" "}
              <a
                href="https://bjsm.bmj.com/content/50/5/273"
                className="text-emerald-200 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-100"
                rel="noreferrer"
                target="_blank"
              >
                British Journal of Sports Medicine
              </a>
              .
            </li>
            <li>
              Foster C et al. A new approach to monitoring exercise training.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/11708692/"
                className="text-emerald-200 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-100"
                rel="noreferrer"
                target="_blank"
              >
                PubMed
              </a>
              .
            </li>
            <li>
              Haddad M et al. Session-RPE Method for Training Load Monitoring.{" "}
              <a
                href="https://pubmed.ncbi.nlm.nih.gov/29163016/"
                className="text-emerald-200 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-100"
                rel="noreferrer"
                target="_blank"
              >
                PubMed
              </a>
              .
            </li>
          </ul>
        </MethodSection>
      </LabCard>
    </PageShell>
  );
}
