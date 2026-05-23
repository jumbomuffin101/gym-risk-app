"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { normalizeWorkoutName } from "@/app/lib/workouts";

type LogActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

const UpdateWorkoutLogSchema = z.object({
  workoutId: z.string().min(1),
  name: z.string().trim().min(1, "Workout name cannot be empty.").max(120, "Workout name must be 120 characters or fewer."),
  workoutDate: z.string().trim().min(1, "Workout date is required.").refine(
    (value) => Number.isFinite(new Date(value).getTime()),
    "Enter a valid workout date."
  ),
});

const DeleteWorkoutLogSchema = z.object({
  workoutId: z.string().min(1),
});

function revalidateLogViews(exerciseIds: string[] = []) {
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/workouts");
  revalidatePath("/exercises");

  for (const exerciseId of exerciseIds) {
    revalidatePath(`/exercises/${exerciseId}`);
  }
}

export async function updateWorkoutLogAction(input: unknown): Promise<LogActionResult> {
  const parsed = UpdateWorkoutLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Could not update workout log.",
    };
  }

  const userId = await requireDbUserId();
  const name = normalizeWorkoutName(parsed.data.name);
  if (!name) {
    return { ok: false, error: "Workout name cannot be empty." };
  }

  const startedAt = new Date(parsed.data.workoutDate);
  const endedAt = new Date(startedAt.getTime() + 60 * 1000);
  const workout = await prisma.workoutSession.findFirst({
    where: {
      id: parsed.data.workoutId,
      userId,
      endedAt: { not: null },
      sets: { some: {} },
    },
    select: {
      sets: { select: { exerciseId: true } },
    },
  });

  if (!workout) {
    return { ok: false, error: "Workout log could not be found." };
  }

  await prisma.$transaction([
    prisma.workoutSession.update({
      where: { id: parsed.data.workoutId },
      data: {
        note: name,
        startedAt,
        endedAt,
      },
    }),
    prisma.setEntry.updateMany({
      where: {
        sessionId: parsed.data.workoutId,
        userId,
      },
      data: { performedAt: startedAt },
    }),
  ]);

  revalidateLogViews(Array.from(new Set(workout.sets.map((set) => set.exerciseId))));
  return { ok: true };
}

export async function deleteWorkoutLogAction(input: unknown): Promise<LogActionResult> {
  const parsed = DeleteWorkoutLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Workout log could not be deleted." };
  }

  const userId = await requireDbUserId();
  const workout = await prisma.workoutSession.findFirst({
    where: {
      id: parsed.data.workoutId,
      userId,
      endedAt: { not: null },
      sets: { some: {} },
    },
    select: {
      sets: { select: { exerciseId: true } },
    },
  });

  if (!workout) {
    return { ok: false, error: "Workout log could not be found." };
  }

  await prisma.workoutSession.delete({
    where: { id: parsed.data.workoutId },
  });

  revalidateLogViews(Array.from(new Set(workout.sets.map((set) => set.exerciseId))));
  return { ok: true };
}
