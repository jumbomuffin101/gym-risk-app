"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireDbUserId } from "@/app/lib/auth/requireUser";
import { prisma } from "@/app/lib/prisma";
import { normalizeWorkoutName } from "@/app/lib/workouts";

type WorkoutActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
    };

const RenameWorkoutSchema = z.object({
  workoutId: z.string().min(1),
  name: z.string().trim().min(1, "Template name cannot be empty.").max(120, "Template name must be 120 characters or fewer."),
});

const DeleteWorkoutSchema = z.object({
  workoutId: z.string().min(1),
});

function revalidateWorkoutViews(exerciseIds: string[] = []) {
  revalidatePath("/workouts");
  revalidatePath("/workouts/new");
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/exercises");

  for (const exerciseId of exerciseIds) {
    revalidatePath(`/exercises/${exerciseId}`);
  }
}

export async function renameWorkoutAction(input: unknown): Promise<WorkoutActionResult> {
  const parsed = RenameWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Enter a template name.",
    };
  }

  const userId = await requireDbUserId();
  const name = normalizeWorkoutName(parsed.data.name);
  if (!name) {
    return { ok: false, error: "Template name cannot be empty." };
  }

  const result = await prisma.workoutSession.updateMany({
    where: {
      id: parsed.data.workoutId,
      userId,
      endedAt: null,
      sets: { some: {} },
    },
    data: { note: name },
  });

  if (result.count === 0) {
    return { ok: false, error: "Workout template could not be found." };
  }

  revalidateWorkoutViews();
  return { ok: true };
}

export async function deleteWorkoutAction(input: unknown): Promise<WorkoutActionResult> {
  const parsed = DeleteWorkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Workout could not be deleted." };
  }

  const userId = await requireDbUserId();
  const workout = await prisma.workoutSession.findFirst({
    where: {
      id: parsed.data.workoutId,
      userId,
      endedAt: null,
      sets: { some: {} },
    },
    select: {
      sets: { select: { exerciseId: true } },
    },
  });

  if (!workout) {
    return { ok: false, error: "Workout template could not be found." };
  }

  const result = await prisma.workoutSession.deleteMany({
    where: {
      id: parsed.data.workoutId,
      userId,
      endedAt: null,
    },
  });

  if (result.count === 0) {
    return { ok: false, error: "Workout template could not be deleted." };
  }

  revalidateWorkoutViews(Array.from(new Set(workout.sets.map((set) => set.exerciseId))));
  return { ok: true };
}
