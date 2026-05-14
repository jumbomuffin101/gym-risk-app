import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import { requireDbUserId } from "@/app/lib/auth/requireUser";

export const runtime = "nodejs";

type ExerciseInfo = {
  purpose: string;
  powerlifterUse: string;
  programming: string;
  riskRelevance: string;
};

const categoryInfo: Record<string, ExerciseInfo> = {
  squat: {
    purpose: "Builds lower-body strength through knee and hip extension under axial load.",
    powerlifterUse: "Used as a competition lift or close variation for squat-specific strength.",
    programming: "Commonly programmed for 3 to 6 working sets, with volume adjusted around heavy exposures.",
    riskRelevance: "Useful for tracking quad, hip, knee, and lower-back loading across the training week.",
  },
  hinge: {
    purpose: "Develops posterior-chain strength through hip extension and loaded bracing.",
    powerlifterUse: "Used for deadlift strength, lockout work, posterior-chain volume, and hinge tolerance.",
    programming: "Often benefits from conservative volume because heavy hinge work carries high systemic fatigue.",
    riskRelevance: "Useful for monitoring posterior-chain exposure, lower-back stress, and fatigue spikes.",
  },
  push: {
    purpose: "Builds upper-body pressing strength through shoulder and elbow extension.",
    powerlifterUse: "Used for bench-specific strength, pressing volume, and triceps or shoulder accessories.",
    programming: "Frequently programmed with moderate volume and RPE tracking to manage joint exposure.",
    riskRelevance: "Useful for tracking shoulder, elbow, and pressing workload over time.",
  },
  pull: {
    purpose: "Builds upper-back and lat strength for pulling balance and pressing support.",
    powerlifterUse: "Used to support bench stability, deadlift positioning, and upper-back capacity.",
    programming: "Often programmed as accessory volume with controlled intensity and consistent weekly exposure.",
    riskRelevance: "Useful for spotting sudden increases in upper-back or elbow-related workload.",
  },
  arms: {
    purpose: "Adds direct elbow flexion or extension volume for accessory strength.",
    powerlifterUse: "Used to support pressing, pulling, and elbow tolerance.",
    programming: "Best tracked as accessory volume with moderate effort and clean technique.",
    riskRelevance: "Useful for monitoring elbow workload when pressing and pulling volume is already high.",
  },
  core: {
    purpose: "Builds trunk strength, bracing control, and position tolerance.",
    powerlifterUse: "Used to support squat and deadlift bracing under heavier loads.",
    programming: "Typically added as low-to-moderate fatigue accessory work after primary lifts.",
    riskRelevance: "Useful for tracking bracing exposure and accessory workload without overstating load.",
  },
  calves: {
    purpose: "Adds lower-leg accessory volume and ankle-extension strength.",
    powerlifterUse: "Used as supplemental lower-body work with limited competition specificity.",
    programming: "Usually programmed as accessory volume after primary lower-body work.",
    riskRelevance: "Useful for general workload tracking and lower-leg exposure.",
  },
  conditioning: {
    purpose: "Builds general work capacity and contributes to weekly training stress.",
    powerlifterUse: "Used to support conditioning without replacing strength-specific work.",
    programming: "Intensity and duration should be managed around heavy lower-body training.",
    riskRelevance: "Useful for general workload signals, with lower strength-specific interpretation.",
  },
  uncategorized: {
    purpose: "Provides additional training stimulus outside the primary lift categories.",
    powerlifterUse: "Used as supplemental work based on the lifter's current training needs.",
    programming: "Track volume, effort, and discomfort consistently to understand its effect.",
    riskRelevance: "Useful for workload tracking when paired with RPE and pain notes.",
  },
};

const exerciseInfo: Record<string, Partial<ExerciseInfo>> = {
  "back squat": {
    purpose: "Primary lower-body strength lift using axial loading, bracing, and deep knee and hip flexion.",
    powerlifterUse: "Competition squat pattern for building meet-specific strength and technical consistency.",
    riskRelevance: "Useful for tracking axial fatigue, quad and hip loading, and lower-back exposure.",
  },
  "front squat": {
    purpose: "Squat variation that emphasizes upright posture, quads, and upper-back bracing.",
    powerlifterUse: "Used as a squat accessory when lifters need quad strength or cleaner positions.",
  },
  deadlift: {
    purpose: "High-force hinge pattern with large posterior-chain and systemic fatigue demand.",
    powerlifterUse: "Competition deadlift pattern for strength, positioning, and pulling tolerance.",
    riskRelevance: "Useful for tracking posterior-chain, lower-back, and high-fatigue exposures.",
  },
  "bench press": {
    purpose: "Primary upper-body pressing lift for chest, shoulder, and triceps strength.",
    powerlifterUse: "Competition bench pattern for building pressing strength and technical consistency.",
    riskRelevance: "Useful for shoulder and elbow workload tracking across pressing volume.",
  },
  plank: {
    purpose: "Trunk bracing exercise for positional control and endurance.",
    powerlifterUse: "Used to support bracing capacity for squat and deadlift work.",
  },
};

function getExerciseInfo(name: string, category: string | null): ExerciseInfo {
  const categoryKey = (category ?? "uncategorized").toLowerCase();
  const fallback = categoryInfo[categoryKey] ?? categoryInfo.uncategorized;
  const specific = exerciseInfo[name.toLowerCase()] ?? {};

  return {
    purpose: specific.purpose ?? fallback.purpose,
    powerlifterUse: specific.powerlifterUse ?? fallback.powerlifterUse,
    programming: specific.programming ?? fallback.programming,
    riskRelevance: specific.riskRelevance ?? fallback.riskRelevance,
  };
}

function ExerciseNotFound({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="lab-card rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise not found</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white/95">
          No exercise matches this ID.
        </h1>
        <p className="mt-3 text-sm lab-muted">
          Requested ID: <span className="font-mono text-white/70">{id}</span>
        </p>
        <Link href="/exercises" className="btn-secondary mt-5">
          Back to exercises
        </Link>
      </div>
    </div>
  );
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDbUserId();

  const { id: rawId } = await params;
  const id = rawId?.trim();
  if (!id) return notFound();

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      _count: { select: { sets: true } },
    },
  });

  if (!exercise) return <ExerciseNotFound id={id} />;

  const info = getExerciseInfo(exercise.name, exercise.category);
  const sections = [
    ["Purpose in training", info.purpose],
    ["Common use for powerlifters", info.powerlifterUse],
    ["Example programming notes", info.programming],
    ["Gym-Risk relevance", info.riskRelevance],
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="text-xs uppercase tracking-wide lab-muted">Exercise</div>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white/95">
              {exercise.name}
            </h1>
            <p className="mt-1 text-sm lab-muted">
              {exercise.category ?? "Uncategorized"} - {exercise._count.sets} sets logged
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/exercises" className="btn-secondary text-sm">
              Back to exercises
            </Link>
            <Link href="/workouts/new" className="btn-primary text-sm">
              Log in new workout
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, body]) => (
          <section key={title} className="lab-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/90">{title}</h2>
            <p className="mt-2 text-sm leading-6 lab-muted">{body}</p>
          </section>
        ))}
      </div>

      <div className="lab-card rounded-2xl p-5">
        <div className="text-sm font-semibold text-white/90">Where to log sets</div>
        <p className="mt-2 text-sm lab-muted">
          Exercise pages are informational. Build and save workouts from the New Workout tab.
        </p>
      </div>
    </div>
  );
}
